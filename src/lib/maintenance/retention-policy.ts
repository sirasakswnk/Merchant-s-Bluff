import type { RoomCore } from '../server/room-model';

export const RETENTION_POLICY = Object.freeze({ version: 1, idleMs: 24 * 60 * 60 * 1000, leaseMs: 120000, batchSize: 100 });
export interface RoomRetention {
  version: 1; kind: 'active'; createdAt: number; lastActivityAt: number; activity: number;
  lifecycle: RoomCore['lifecycle']; revision: number; dueAt?: number;
  cleanupLease?: { id: string; until: number };
}
export interface RetiredRoom { retention: { version: 1; kind: 'retired'; retiredAt: number; code: string } }
const timestamp = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function isRetention(value: unknown): value is RoomRetention {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<RoomRetention>;
  return v.version === 1 && v.kind === 'active' && timestamp(v.createdAt) && timestamp(v.lastActivityAt)
    && v.createdAt <= v.lastActivityAt && timestamp(v.activity) && v.activity > 0 && timestamp(v.revision)
    && ['LOBBY', 'PLAYING', 'FINISHED', 'ABORTED'].includes(v.lifecycle ?? '')
    && (v.dueAt == null || timestamp(v.dueAt))
    && (!v.cleanupLease || (typeof v.cleanupLease.id === 'string' && timestamp(v.cleanupLease.until)));
}
export function touchRetention(room: RoomCore, previous: unknown, now: number): RoomRetention {
  if (!timestamp(now)) throw new Error('INVALID_RETENTION_TIME');
  const old = isRetention(previous) ? previous : null;
  const lastActivityAt = Math.max(now, old?.lastActivityAt ?? 0);
  return { version: 1, kind: 'active', createdAt: old?.createdAt ?? now, lastActivityAt,
    activity: (old?.activity ?? 0) + 1, lifecycle: room.lifecycle, revision: room.revision,
    ...(room.lifecycle === 'PLAYING' ? {} : { dueAt: lastActivityAt + RETENTION_POLICY.idleMs }) };
}
export function retentionReason(value: unknown, now: number): 'eligible' | 'legacy-or-invalid' | 'playing' | 'recent' | 'leased' | 'retired' {
  if (value && typeof value === 'object' && (value as { kind?: unknown }).kind === 'retired') return 'retired';
  if (!isRetention(value) || !timestamp(now) || value.lastActivityAt > now) return 'legacy-or-invalid';
  if (value.lifecycle === 'PLAYING') return 'playing';
  if (value.dueAt !== value.lastActivityAt + RETENTION_POLICY.idleMs) return 'legacy-or-invalid';
  if (value.cleanupLease && value.cleanupLease.until > now) return 'leased';
  return value.dueAt! <= now ? 'eligible' : 'recent';
}
// Block new/updated presence while the server checks it, but let disconnect remove presence.
// A valid server access or a cleanup retry clears the fence after a worker crash.
// Do not expire it in Rules: doing so could admit presence between the final read and retirement.
export const RETENTION_PRESENCE_WRITE = "auth != null && auth.uid === $uid && root.child('rooms').child($roomId).child('members').child(auth.uid).val() === true && $connectionId.matches(/^[A-Za-z0-9_-]{1,64}$/) && (!newData.exists() || !root.child('rooms').child($roomId).child('retention').child('cleanupLease').exists())";
