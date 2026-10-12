import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getDatabase, type Database } from 'firebase-admin/database';
import { roomService } from '../../src/lib/server/room-service';
import { loadRoom, storeRoom } from '../../src/lib/server/projections';
import { RETENTION_POLICY, touchRetention } from '../../src/lib/maintenance/retention-policy';
import { retentionService } from '../../src/lib/server/retention-service';
import { retentionRepository, type RoomCandidate } from '../../src/lib/server/data/retention-repository';
import type { RoomCore } from '../../src/lib/server/room-model';
import { runRetentionJob } from '../../src/lib/server/retention-job';
import { GET as maintenance } from '../../src/app/api/maintenance/retention/route';

const projectId = 'demo-retention'; const entries: { roomId: string; code: string }[] = [];
let app: App; let database: Database; let env: RulesTestEnvironment;
const owner = 'retention-owner'; const clientId = randomUUID();
async function fixture(lifecycle: RoomCore['lifecycle'] = 'LOBBY', age = RETENTION_POLICY.idleMs * 2) {
  const request = { commandId: randomUUID(), clientId, displayName: 'Retention', avatarId: 0 };
  const receipt = await roomService(database).create(owner, request); entries.push(receipt);
  const room = loadRoom((await database.ref(`rooms/${receipt.roomId}`).get()).val()); room.lifecycle = lifecycle;
  const stored = { ...storeRoom(room), retention: touchRetention(room, undefined, Date.now() - age) };
  await database.ref(`rooms/${room.roomId}`).set(stored);
  return { room, stored, request };
}
const planFor = (id: string) => retentionService(database).plan({ roomIds: [id], codeIds: [] });
describe('retention on real RTDB with presence fencing and concurrent recovery', () => {
  beforeAll(async () => {
    if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST) throw new Error('Emulator required');
    const [host, port] = process.env.FIREBASE_DATABASE_EMULATOR_HOST.split(':');
    env = await initializeTestEnvironment({ projectId, database: { host, port: Number(port), rules: readFileSync('firebase/database.rules.json', 'utf8') } });
    app = initializeApp({ projectId, databaseURL: `https://${projectId}.firebaseio.com` }, 'retention-tests'); database = getDatabase(app);
  });
  afterAll(async () => {
    for (const entry of entries) await database.ref().update({ [`rooms/${entry.roomId}`]: null, [`roomCodes/${entry.code}`]: null, [`presence/${entry.roomId}`]: null });
    await env?.cleanup(); if (app) await deleteApp(app);
  });
  it('dry-run is read-only; applies all expired non-playing states and erases secret data, preserving only a small marker', async () => {
    for (const lifecycle of ['LOBBY', 'FINISHED', 'ABORTED'] as const) {
      const { room, stored, request } = await fixture(lifecycle); const before = (await database.ref(`rooms/${room.roomId}`).get()).val();
      const plan = await planFor(room.roomId); expect(plan.candidates).toHaveLength(1);
      expect((await database.ref(`rooms/${room.roomId}`).get()).val()).toEqual(before);
      expect(await retentionService(database).apply(plan)).toEqual({ retired: 1 });
      expect((await database.ref(`rooms/${room.roomId}`).get()).val()).toEqual({ retention: { version: 1, kind: 'retired', code: room.code, retiredAt: expect.any(Number) } });
      expect((await database.ref(`roomCodes/${room.code}`).get()).exists()).toBe(false);
      await expect(roomService(database).create(owner, request)).rejects.toMatchObject({ code: 'ROOM_NOT_FOUND' });
      expect(stored.authoritative.snapshot).toContain('processed');
    }
  });
  it('protects PLAYING, online users, recent and legacy rooms even when old', async () => {
    const playing = await fixture('PLAYING'); expect((await planFor(playing.room.roomId)).counts.playing).toBe(1);
    const online = await fixture(); await database.ref(`presence/${online.room.roomId}/${owner}/online`).set({ online: true, connectedAt: Date.now() });
    expect((await planFor(online.room.roomId)).counts.online).toBe(1);
    const recent = await fixture('FINISHED', RETENTION_POLICY.idleMs - 10000); expect((await planFor(recent.room.roomId)).counts.recent).toBe(1);
    const legacy = await fixture(); await database.ref(`rooms/${legacy.room.roomId}/retention`).remove();
    expect((await planFor(legacy.room.roomId)).counts['legacy-or-invalid']).toBe(1);
  });
  it('an online connection arriving after planning prevents deletion at apply', async () => {
    const { room } = await fixture(); const plan = await planFor(room.roomId);
    await database.ref(`presence/${room.roomId}/${owner}/new-connection`).set({ online: true, connectedAt: Date.now() });
    expect(await retentionService(database).apply(plan)).toEqual({ online: 1 });
    expect((await database.ref(`rooms/${room.roomId}/authoritative`).get()).exists()).toBe(true);
    expect((await database.ref(`rooms/${room.roomId}/retention/cleanupLease`).get()).exists()).toBe(false);
  });
  it('resume clears an in-flight lease; stale worker cannot delete; failed access does not extend data lifetime', async () => {
    const { room } = await fixture(); const plan = await planFor(room.roomId); const candidate = plan.candidates[0] as RoomCandidate;
    const repository = retentionRepository(database); expect(await repository.claim(candidate, 'resume-race')).toBe(true);
    const before = (await database.ref(`rooms/${room.roomId}/retention`).get()).val();
    await expect(roomService(database).resume('not-a-member', room.roomId)).rejects.toMatchObject({ code: 'NOT_MEMBER' });
    expect((await database.ref(`rooms/${room.roomId}/retention`).get()).val()).toEqual(before);
    await roomService(database).resume(owner, room.roomId);
    expect(await repository.retire(candidate, 'resume-race')).toBeNull();
    expect((await database.ref(`rooms/${room.roomId}/retention/cleanupLease`).get()).exists()).toBe(false);
  });
  it('rematch/command races invalidate the exact candidate without altering the current game', async () => {
    const { room } = await fixture('FINISHED'); const plan = await planFor(room.roomId);
    await roomService(database).command(owner, { roomId: room.roomId, commandId: randomUUID(), clientId,
      sessionGeneration: room.members[owner].sessionGeneration, gameId: null, command: { type: 'requestRematch' } });
    expect(await retentionService(database).apply(plan)).toEqual({ changed: 1 });
    expect(loadRoom((await database.ref(`rooms/${room.roomId}`).get()).val()).lifecycle).toBe('LOBBY');
  });
  it('a valid create retry preserves the original receipt and cancels cleanup without extending conflicting requests', async () => {
    const { room, request } = await fixture(); const plan = await planFor(room.roomId); const repository = retentionRepository(database);
    expect(await repository.claim(plan.candidates[0] as RoomCandidate, 'create-retry')).toBe(true);
    const before = (await database.ref(`rooms/${room.roomId}/retention`).get()).val();
    await expect(roomService(database).create(owner, { ...request, displayName: 'changed' })).rejects.toMatchObject({ code: 'COMMAND_CONFLICT' });
    expect((await database.ref(`rooms/${room.roomId}/retention`).get()).val()).toEqual(before);
    expect(await roomService(database).create(owner, request)).toEqual(room.creation.receipt);
    expect(await repository.retire(plan.candidates[0] as RoomCandidate, 'create-retry')).toBeNull();
    expect(loadRoom((await database.ref(`rooms/${room.roomId}`).get()).val())).toEqual(room);
  });
  it('Rules fence new presence until server recovery, including expired leases, while allowing removal', async () => {
    const { room } = await fixture(); const web = env.authenticatedContext(owner).database(); const path = `presence/${room.roomId}/${owner}/phone`;
    await assertSucceeds(web.ref(path).set({ online: true, connectedAt: Date.now() })); await web.ref(path).remove();
    const plan = await planFor(room.roomId); let clock = Date.now(); const repository = retentionRepository(database, () => clock);
    expect(await repository.claim(plan.candidates[0] as RoomCandidate, 'fence')).toBe(true);
    await assertFails(web.ref(path).set({ online: true, connectedAt: Date.now() }));
    await database.ref(path).set({ online: true, connectedAt: Date.now() }); await assertSucceeds(web.ref(path).remove());
    clock += RETENTION_POLICY.leaseMs; expect(await repository.retire(plan.candidates[0] as RoomCandidate, 'fence')).toBeNull();
    await database.ref(`rooms/${room.roomId}/retention/cleanupLease/until`).set(Date.now() - 1);
    await assertFails(web.ref(path).set({ online: true, connectedAt: Date.now() }));
    await roomService(database).resume(owner, room.roomId);
    await assertSucceeds(web.ref(path).set({ online: true, connectedAt: Date.now() }));
    for (const privatePath of [`rooms/${room.roomId}/retention`, `rooms/${room.roomId}/authoritative`]) {
      await assertFails(web.ref(privatePath).get()); await assertFails(web.ref(privatePath).set({ dueAt: 0 }));
    }
  });
  it('two cleanup instances cannot both claim/delete; marker finalization is resumable and keeps reassigned codes', async () => {
    const { room } = await fixture(); const plan = await planFor(room.roomId); const candidate = plan.candidates[0] as RoomCandidate;
    const secondApp = initializeApp({ projectId, databaseURL: `https://${projectId}.firebaseio.com` }, 'retention-second');
    try {
      const a = retentionRepository(database); const b = retentionRepository(getDatabase(secondApp));
      const claims = await Promise.all([a.claim(candidate, 'worker-a'), b.claim(candidate, 'worker-b')]); expect(claims.filter(Boolean)).toHaveLength(1);
      const id = claims[0] ? 'worker-a' : 'worker-b'; const marker = await a.retire(candidate, id); expect(marker).not.toBeNull();
      const recovery = await planFor(room.roomId); expect(recovery.candidates[0].type).toBe('finalize');
      await database.ref(`roomCodes/${room.code}`).set({ roomId: 'f'.repeat(32), status: 'ready' });
      expect(await a.finalize(marker!)).toBe(true); expect((await database.ref(`roomCodes/${room.code}/roomId`).get()).val()).toBe('f'.repeat(32));
    } finally { await deleteApp(secondApp); }
  });
  it('revalidates orphan reservations and protects a concurrently created room', async () => {
    const { room } = await fixture(); await database.ref(`rooms/${room.roomId}`).remove();
    await database.ref(`roomCodes/${room.code}/createdAt`).set(Date.now() - RETENTION_POLICY.idleMs * 2);
    const plan = await retentionService(database).plan({ roomIds: [], codeIds: [room.code] }); expect(plan.candidates[0].type).toBe('orphan');
    await database.ref(`rooms/${room.roomId}`).set({ ...storeRoom(room), retention: touchRetention(room, null, Date.now()) });
    expect(await retentionService(database).apply(plan)).toEqual({ changed: 1 });
    await database.ref(`rooms/${room.roomId}`).remove();
    expect(await retentionService(database).apply(plan)).toEqual({ 'orphan-retired': 1 });
  });
  it('refuses wrong project, stale plans, malformed authoritative data, and a forged eligible PLAYING marker', async () => {
    const { room } = await fixture(); const plan = await planFor(room.roomId);
    await expect(retentionService(database).apply({ ...plan, projectId: 'wrong-project' })).rejects.toThrow('INVALID_RETENTION_PLAN');
    await expect(retentionService(database).apply({ ...plan, expiresAt: Date.now() - 1 })).rejects.toThrow('INVALID_RETENTION_PLAN');
    await database.ref(`rooms/${room.roomId}/authoritative/snapshot`).set('invalid JSON'); expect((await planFor(room.roomId)).candidates).toHaveLength(0);
    room.lifecycle = 'PLAYING'; await database.ref(`rooms/${room.roomId}/authoritative/snapshot`).set(JSON.stringify(room));
    expect(await retentionService(database).apply(plan)).toEqual({ changed: 1 });
    room.lifecycle = 'FINISHED';
    await database.ref(`rooms/${room.roomId}/authoritative/snapshot`).set(JSON.stringify({ ...room, game: { phase: 'PREPARE' } }));
    expect((await planFor(room.roomId)).candidates).toHaveLength(0);
  });
  it('rejects unauthenticated maintenance HTTP requests before opening database access', async () => {
    const original = process.env.CRON_SECRET;
    try {
      delete process.env.CRON_SECRET; expect((await maintenance(new Request('http://localhost/api/maintenance/retention'))).status).toBe(404);
      process.env.CRON_SECRET = 'local-maintenance-secret'.repeat(3);
      expect((await maintenance(new Request('http://localhost/api/maintenance/retention', { headers: { Authorization: 'Bearer forged' } }))).status).toBe(401);
    } finally { if (original === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = original; }
  });
  it('production runner dry-run never changes rooms; apply clears its lease and retains active rooms', async () => {
    const { room } = await fixture(); const before = (await database.ref(`rooms/${room.roomId}`).get()).val();
    expect((await runRetentionJob(database, false)).mode).toBe('dry-run');
    expect((await database.ref(`rooms/${room.roomId}`).get()).val()).toEqual(before);
    expect((await database.ref('_maintenance/retention').get()).exists()).toBe(false);
    const result = await runRetentionJob(database, true); expect(result.mode).toBe('apply'); expect(result.busy).toBe(false);
    expect((await database.ref(`rooms/${room.roomId}/retention/kind`).get()).val()).toBe('retired');
    expect((await database.ref('_maintenance/retention/jobId').get()).exists()).toBe(false);
    await database.ref('_maintenance/retention').remove();
  });
});
