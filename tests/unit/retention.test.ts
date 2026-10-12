import { describe, expect, it } from 'vitest';
import { RETENTION_POLICY, retentionReason, touchRetention } from '../../src/lib/maintenance/retention-policy';
import type { RoomCore } from '../../src/lib/server/room-model';
const now = 2_000_000_000_000;
const state = (lifecycle: RoomCore['lifecycle']) => ({ lifecycle, revision: 10 } as RoomCore);
describe('24-hour data retention, independent of game rules', () => {
  for (const lifecycle of ['LOBBY', 'FINISHED', 'ABORTED'] as const) {
    it(`${lifecycle} expires only after 24 full hours`, () => {
      const meta = touchRetention(state(lifecycle), null, now);
      expect(retentionReason(meta, now + RETENTION_POLICY.idleMs - 1)).toBe('recent');
      expect(retentionReason(meta, now + RETENTION_POLICY.idleMs)).toBe('eligible');
    });
  }
  it('never expires PLAYING even after a year offline', () => {
    expect(retentionReason(touchRetention(state('PLAYING'), null, now), now + 366 * RETENTION_POLICY.idleMs)).toBe('playing');
  });
  it('ignores unknown legacy, malformed, mismatched expiry and future timestamps', () => {
    const meta = touchRetention(state('LOBBY'), null, now);
    for (const value of [null, {}, { ...meta, version: 9 }, { ...meta, activity: -1 }, { ...meta, dueAt: now }, { ...meta, lastActivityAt: now + 1 }]) {
      expect(retentionReason(value, now)).toBe('legacy-or-invalid');
    }
  });
  it('a legitimate access extends retention and clears a cleanup lease without changing game state', () => {
    const core = state('FINISHED'); const before = structuredClone(core);
    const old = { ...touchRetention(core, null, now), cleanupLease: { id: 'worker', until: now + RETENTION_POLICY.idleMs } };
    const next = touchRetention(core, old, now + 1000);
    expect(next.createdAt).toBe(now); expect(next.activity).toBe(old.activity + 1);
    expect(next.dueAt).toBe(now + 1000 + RETENTION_POLICY.idleMs); expect(next.cleanupLease).toBeUndefined(); expect(core).toEqual(before);
  });
  it('worker leases expire and retired markers are never treated as active rooms', () => {
    const meta = touchRetention(state('ABORTED'), null, now - RETENTION_POLICY.idleMs);
    const leased = { ...meta, cleanupLease: { id: 'worker', until: now + 1000 } };
    expect(retentionReason(leased, now)).toBe('leased'); expect(retentionReason(leased, now + 1000)).toBe('eligible');
    expect(retentionReason({ version: 1, kind: 'retired', retiredAt: now }, now)).toBe('retired');
  });
});
