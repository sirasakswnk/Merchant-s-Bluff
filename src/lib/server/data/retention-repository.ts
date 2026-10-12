import 'server-only';
import type { Database } from 'firebase-admin/database';
import type { RoomCore, StoredRoom } from '../room-model';
import { RETENTION_POLICY, isRetention, retentionReason, type RetiredRoom, type RoomRetention } from '../../maintenance/retention-policy.ts';

export interface RoomCandidate { type: 'room'; roomId: string; code: string; revision: number; activity: number; dueAt: number }
export interface FinalizeCandidate { type: 'finalize'; roomId: string; code: string; retiredAt: number }
export interface OrphanCandidate { type: 'orphan'; roomId: string; code: string; createdAt: number; fingerprint: string }
export type RetentionCandidate = RoomCandidate | FinalizeCandidate | OrphanCandidate;
export function parseActive(value: unknown): { stored: StoredRoom; room: RoomCore } | null {
  try {
    const stored = value as StoredRoom;
    if (!stored || typeof stored.authoritative?.snapshot !== 'string') return null;
    const room = JSON.parse(stored.authoritative.snapshot) as RoomCore;
    if (!room || typeof room.roomId !== 'string' || typeof room.code !== 'string' || !Number.isSafeInteger(room.revision)
      || !['LOBBY', 'PLAYING', 'FINISHED', 'ABORTED'].includes(room.lifecycle)) return null;
    if ((room.lifecycle === 'LOBBY' && room.game !== null)
      || (room.lifecycle === 'FINISHED' && room.game && room.game.phase !== 'GAME_OVER')) return null;
    return { stored, room };
  } catch { return null; }
}
export function isRetired(value: unknown): value is RetiredRoom {
  const v = value as RetiredRoom;
  return !!v && Object.keys(v).length === 1 && v.retention?.kind === 'retired' && v.retention.version === 1
    && Number.isSafeInteger(v.retention.retiredAt) && /^[A-HJ-NP-Z2-9]{4}$/.test(v.retention.code);
}
function matches(value: unknown, expected: RoomCandidate, now: number): value is StoredRoom & { retention: RoomRetention } {
  const parsed = parseActive(value); if (!parsed || !isRetention(parsed.stored.retention)) return false;
  const { room, stored } = parsed; const meta = stored.retention!;
  return room.roomId === expected.roomId && room.code === expected.code && room.lifecycle !== 'PLAYING'
    && room.lifecycle === meta.lifecycle && room.revision === meta.revision && room.revision === expected.revision
    && meta.activity === expected.activity && meta.dueAt === expected.dueAt
    && retentionReason({ ...meta, cleanupLease: undefined }, now) === 'eligible';
}
export function retentionRepository(database: Database, clock = Date.now) {
  return {
    async claim(candidate: RoomCandidate, leaseId: string): Promise<boolean> {
      const { snapshot } = await database.ref(`rooms/${candidate.roomId}`).transaction(value => {
        if (!value) return null; // Let the server retry a first callback with an empty SDK cache.
        const now = clock();
        if (!matches(value, candidate, now) || (value.retention.cleanupLease?.until ?? 0) > now) return value;
        return { ...value, retention: { ...value.retention, cleanupLease: { id: leaseId, until: now + RETENTION_POLICY.leaseMs } } };
      });
      return snapshot.child('retention/cleanupLease/id').val() === leaseId;
    },
    async release(roomId: string, leaseId: string): Promise<void> {
      await database.ref(`rooms/${roomId}`).transaction(value => {
        if (!value) return null;
        if (value.retention?.cleanupLease?.id !== leaseId) return value;
        const metadata = { ...value.retention }; delete metadata.cleanupLease;
        return { ...value, retention: metadata };
      });
    },
    async retire(candidate: RoomCandidate, leaseId: string): Promise<FinalizeCandidate | null> {
      const retiredAt = clock();
      const { snapshot } = await database.ref(`rooms/${candidate.roomId}`).transaction(value => {
        if (!value) return null;
        const now = clock();
        if (!matches(value, candidate, now) || value.retention.cleanupLease?.id !== leaseId || value.retention.cleanupLease.until <= now) return value;
        return { retention: { version: 1, kind: 'retired', retiredAt, code: candidate.code } } satisfies RetiredRoom;
      });
      const result = snapshot.val();
      return isRetired(result) && result.retention.retiredAt === retiredAt
        ? { type: 'finalize', roomId: candidate.roomId, code: candidate.code, retiredAt } : null;
    },
    async retireOrphan(candidate: OrphanCandidate): Promise<FinalizeCandidate | null> {
      const retiredAt = clock();
      const { snapshot } = await database.ref(`rooms/${candidate.roomId}`).transaction(value => value ??
        ({ retention: { version: 1, kind: 'retired', retiredAt, code: candidate.code } } satisfies RetiredRoom));
      const result = snapshot.val();
      return isRetired(result) && result.retention.code === candidate.code
        ? { type: 'finalize', roomId: candidate.roomId, code: candidate.code, retiredAt: result.retention.retiredAt } : null;
    },
    async finalize(candidate: FinalizeCandidate): Promise<boolean> {
      const value = (await database.ref(`rooms/${candidate.roomId}`).get()).val();
      if (!isRetired(value) || value.retention.code !== candidate.code || value.retention.retiredAt !== candidate.retiredAt) return false;
      // Keep a newly reassigned code; retries cannot re-create an expired room because its small marker remains.
      await database.ref(`roomCodes/${candidate.code}`).transaction(value => value?.roomId === candidate.roomId ? null : value);
      await database.ref(`presence/${candidate.roomId}`).remove();
      return true;
    },
  };
}
