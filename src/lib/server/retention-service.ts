import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Database } from 'firebase-admin/database';
import { RETENTION_POLICY, RETENTION_PRESENCE_WRITE, isRetention, retentionReason } from '../maintenance/retention-policy.ts';
import { retentionRest } from './data/retention-rest.ts';
import { isRetired, parseActive, retentionRepository, type RetentionCandidate } from './data/retention-repository.ts';

export interface RetentionPlan {
  version: 1; policyVersion: 1; projectId: string; databaseURL: string; createdAt: number; expiresAt: number;
  candidates: RetentionCandidate[]; counts: Record<string, number>; nextRooms: string | null; nextCodes: string | null;
}
export function hasPresence(value: unknown): boolean {
  if (value === null) return false;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return true;
  return Object.values(value).some(connections => !connections || typeof connections !== 'object' ||
    Object.values(connections).some(connection => !connection || typeof connection !== 'object' || (connection as { online?: unknown }).online !== false));
}
export function retentionService(database: Database, clock = Date.now) {
  const rest = retentionRest(database); const repository = retentionRepository(database, clock);
  const count = (counts: Record<string, number>, key: string) => { counts[key] = (counts[key] ?? 0) + 1; };
  return {
    async plan(options: { roomCursor?: string; codeCursor?: string; roomIds?: string[]; codeIds?: string[] } = {}): Promise<RetentionPlan> {
      const now = clock(); const counts: Record<string, number> = {}; const candidates: RetentionCandidate[] = [];
      const ids = (options.roomIds ?? await rest.keys('rooms')).filter(id => !options.roomCursor || id > options.roomCursor);
      const codes = (options.codeIds ?? await rest.keys('roomCodes')).filter(id => !options.codeCursor || id > options.codeCursor);
      const page = ids.slice(0, RETENTION_POLICY.batchSize); const codePage = codes.slice(0, RETENTION_POLICY.batchSize);
      for (const roomId of page) {
        if (!/^[a-f0-9]{32}$/.test(roomId)) { count(counts, 'invalid-id'); continue; }
        const meta = await rest.get(`rooms/${roomId}/retention`); const reason = retentionReason(meta, now);
        if (reason === 'retired') {
          const value = await rest.get(`rooms/${roomId}`);
          if (isRetired(value)) {
            const reservation = await rest.get(`roomCodes/${value.retention.code}`) as { roomId?: string } | null;
            if (reservation?.roomId === roomId || await rest.get(`presence/${roomId}`) !== null) {
              candidates.push({ type: 'finalize', roomId, code: value.retention.code, retiredAt: value.retention.retiredAt }); continue;
            }
          }
        }
        if (reason !== 'eligible') { count(counts, reason); continue; }
        if (hasPresence(await rest.get(`presence/${roomId}`))) { count(counts, 'online'); continue; }
        const parsed = parseActive(await rest.get(`rooms/${roomId}`));
        if (!parsed || !isRetention(parsed.stored.retention) || parsed.room.roomId !== roomId || parsed.room.lifecycle === 'PLAYING'
          || parsed.room.lifecycle !== parsed.stored.retention.lifecycle || parsed.room.revision !== parsed.stored.retention.revision
          || retentionReason(parsed.stored.retention, now) !== 'eligible') { count(counts, 'changed-or-invalid'); continue; }
        candidates.push({ type: 'room', roomId, code: parsed.room.code, revision: parsed.room.revision,
          activity: parsed.stored.retention.activity, dueAt: parsed.stored.retention.dueAt! });
      }
      for (const code of codePage) {
        if (!/^[A-HJ-NP-Z2-9]{4}$/.test(code)) { count(counts, 'invalid-code'); continue; }
        const value = await rest.get(`roomCodes/${code}`) as { roomId?: string; createdAt?: number; status?: string; fingerprint?: string } | null;
        if (!value || !value.roomId || !/^[a-f0-9]{32}$/.test(value.roomId) || !Number.isSafeInteger(value.createdAt)
          || value.createdAt! > now - RETENTION_POLICY.idleMs || typeof value.fingerprint !== 'string') continue;
        // Missing rooms are checked inside a transaction when applying; concurrent creation always wins.
        if (await rest.get(`rooms/${value.roomId}`, true) === null) candidates.push({ type: 'orphan', roomId: value.roomId, code, createdAt: value.createdAt!, fingerprint: value.fingerprint });
      }
      return { version: 1, policyVersion: 1, projectId: database.app.options.projectId!, databaseURL: database.app.options.databaseURL!,
        createdAt: now, expiresAt: now + 3600000, candidates, counts,
        nextRooms: ids.length > page.length ? page.at(-1)! : null, nextCodes: codes.length > codePage.length ? codePage.at(-1)! : null };
    },
    async apply(plan: RetentionPlan): Promise<Record<string, number>> {
      if (plan.version !== 1 || plan.policyVersion !== RETENTION_POLICY.version || plan.projectId !== database.app.options.projectId
        || plan.databaseURL !== database.app.options.databaseURL || plan.expiresAt <= clock() || plan.createdAt > clock()
        || plan.candidates.length > RETENTION_POLICY.batchSize * 2) throw new Error('INVALID_RETENTION_PLAN');
      const rules = await rest.get('.settings/rules') as { rules?: { '.read'?: unknown; '.write'?: unknown; presence?: Record<string, unknown> } };
      const presenceWrite = (rules.rules?.presence?.$roomId as { $uid?: { $connectionId?: { '.write'?: string } } })?.$uid?.$connectionId?.['.write'];
      const deny = (value: unknown) => value === false || value === 'false';
      if (!deny(rules.rules?.['.read']) || !deny(rules.rules?.['.write']) || presenceWrite !== RETENTION_PRESENCE_WRITE) throw new Error('RETENTION_RULES_NOT_DEPLOYED');
      const counts: Record<string, number> = {};
      for (const candidate of plan.candidates) {
        if (!/^[a-f0-9]{32}$/.test(candidate.roomId) || !/^[A-HJ-NP-Z2-9]{4}$/.test(candidate.code)) throw new Error('INVALID_RETENTION_CANDIDATE');
        if (candidate.type === 'finalize') { count(counts, await repository.finalize(candidate) ? 'finalized' : 'changed'); continue; }
        if (candidate.type === 'orphan') {
          const reservation = await rest.get(`roomCodes/${candidate.code}`) as { roomId?: string; createdAt?: number; fingerprint?: string } | null;
          if (reservation?.roomId !== candidate.roomId || reservation.createdAt !== candidate.createdAt || reservation.fingerprint !== candidate.fingerprint
            || candidate.createdAt > clock() - RETENTION_POLICY.idleMs) { count(counts, 'changed'); continue; }
          const retired = await repository.retireOrphan(candidate);
          count(counts, retired && await repository.finalize(retired) ? 'orphan-retired' : 'changed'); continue;
        }
        const lease = randomUUID();
        if (!await repository.claim(candidate, lease)) { count(counts, 'changed'); continue; }
        try {
          if (hasPresence(await rest.get(`presence/${candidate.roomId}`))) { count(counts, 'online'); continue; }
          const retired = await repository.retire(candidate, lease);
          count(counts, retired && await repository.finalize(retired) ? 'retired' : 'changed');
        } finally { await repository.release(candidate.roomId, lease); }
      }
      return counts;
    },
  };
}
