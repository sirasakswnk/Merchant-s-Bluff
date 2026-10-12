import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { roomService } from '../../src/lib/server/room-service';
import { loadRoom, publicView, storeRoom } from '../../src/lib/server/projections';
import type { RoomCore } from '../../src/lib/server/room-model';
import type { RoomCommandRequest, CommandReceipt } from '../../src/lib/shared/rooms';
import type { ProductId } from '../../src/lib/game/types';
import { arrangeHand, gameFixture, prepareAll, seededEntropy } from '../fixtures/game';
import { applyGameCommand, assertGameState, startGame } from '../../src/lib/game/engine';
import { LEGACY_RULES } from '../fixtures/legacy-rules';

let adminA: App; let adminB: App; let env: RulesTestEnvironment;
const createdRooms: CommandReceipt[] = [];
const clients = ['a', 'b', 'c', 'd'].map(id => ({ uid: `m2-${id}`, clientId: randomUUID() }));
async function create() {
  const api = roomService(getDatabase(adminA));
  const receipt = await api.create(clients[0].uid, { commandId: randomUUID(), clientId: clients[0].clientId, displayName: 'ผู้จัด', avatarId: 0 });
  createdRooms.push(receipt);
  for (const client of clients.slice(1)) await api.join(client.uid, { commandId: randomUUID(), clientId: client.clientId, code: receipt.code, displayName: client.uid, avatarId: 1 });
  return receipt.roomId;
}
async function core(roomId: string): Promise<RoomCore> {
  return loadRoom((await getDatabase(adminA).ref(`rooms/${roomId}`).get()).val());
}
async function command(roomId: string, index: number, action: RoomCommandRequest['command'], api = roomService(getDatabase(adminA))) {
  const room = await core(roomId); const client = clients[index];
  return api.command(client.uid, { roomId, commandId: randomUUID(), clientId: client.clientId,
    sessionGeneration: room.members[client.uid].sessionGeneration, gameId: room.game?.gameId ?? null, command: action });
}

describe('real RTDB room transactions and Rules', () => {
  beforeAll(async () => {
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIREBASE_DATABASE_EMULATOR_HOST) throw new Error('Emulators required');
    const config = { projectId: 'demo-merchants-bluff', databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' };
    adminA = initializeApp(config, 'm2-server-a'); adminB = initializeApp(config, 'm2-server-b');
    const [host, port] = process.env.FIREBASE_DATABASE_EMULATOR_HOST.split(':');
    env = await initializeTestEnvironment({ projectId: 'demo-merchant-m2-rules', database: {
      host, port: Number(port), rules: readFileSync('firebase/database.rules.json', 'utf8'),
    } });
    await env.withSecurityRulesDisabled(async context => context.database().ref('rooms/rules-room').set({
      members: { alice: true, bob: true }, authoritative: { snapshot: 'secret' },
      views: { public: 'public-view', private: { alice: 'alice-only', bob: 'bob-only' } },
    }));
  });
  afterAll(async () => {
    for (const room of createdRooms) {
      await getDatabase(adminA).ref(`rooms/${room.roomId}`).remove();
      await getDatabase(adminA).ref(`roomCodes/${room.code}`).remove();
    }
    if (env) await env.cleanup();
    if (adminA) await deleteApp(adminA); if (adminB) await deleteApp(adminB);
  });

  it('serializes duplicate commands from two independent Admin SDK instances', async () => {
    const roomId = await create(); const apiA = roomService(getDatabase(adminA)); const apiB = roomService(getDatabase(adminB));
    const request: RoomCommandRequest = { roomId, commandId: randomUUID(), clientId: clients[0].clientId,
      sessionGeneration: 1, gameId: null, command: { type: 'setReady', ready: true } };
    const before = await core(roomId);
    const results = await Promise.all([apiA.command(clients[0].uid, request), apiB.command(clients[0].uid, request)]);
    expect(results[0]).toEqual(results[1]);
    const after = await core(roomId);
    expect(after.revision).toBe(before.revision + 1);
    expect(after.members[clients[0].uid].ready).toBe(true);
    await expect(apiB.command(clients[0].uid, { ...request, command: { type: 'setReady', ready: false } })).rejects.toMatchObject({ code: 'COMMAND_CONFLICT' });
  });

  it('repairs a pending code reservation after interruption before room creation', async () => {
    const api = roomService(getDatabase(adminA)); const uid = `pending-${randomUUID()}`;
    const profile = { commandId: randomUUID(), clientId: randomUUID(), displayName: 'Pending', avatarId: 2 };
    const result = await api.create(uid, profile); createdRooms.push(result);
    await getDatabase(adminA).ref(`rooms/${result.roomId}`).remove();
    await getDatabase(adminA).ref(`roomCodes/${result.code}/status`).set('pending');
    const joined = await api.join(clients[1].uid, { commandId: randomUUID(), clientId: clients[1].clientId, code: result.code, displayName: 'เพื่อน', avatarId: 1 });
    expect(joined.roomId).toBe(result.roomId);
    const room = await core(result.roomId);
    expect(room.seatOrder).toEqual([uid, clients[1].uid]);
    expect((await getDatabase(adminA).ref(`roomCodes/${result.code}/status`).get()).val()).toBe('ready');
    expect(await api.create(uid, profile)).toEqual(result);
  });

  it('requires readiness and host, prevents late joins, and commits matching public/private revisions', async () => {
    const roomId = await create();
    await expect(command(roomId, 0, { type: 'startGame' })).rejects.toMatchObject({ code: 'NOT_READY' });
    for (let index = 0; index < 4; index++) await command(roomId, index, { type: 'setReady', ready: true });
    await expect(command(roomId, 1, { type: 'startGame' })).rejects.toMatchObject({ code: 'HOST_REQUIRED' });
    await command(roomId, 0, { type: 'startGame' });
    const room = await core(roomId); const stored = (await getDatabase(adminA).ref(`rooms/${roomId}`).get()).val();
    expect(JSON.parse(stored.views.public).revision).toBe(room.revision);
    for (const client of clients) {
      const view = JSON.parse(stored.views.private[client.uid]);
      expect(view.revision).toBe(room.revision); expect(view.hand).toHaveLength(6); expect(view.bag).toEqual([]);
    }
    await expect(roomService(getDatabase(adminB)).join('late-player', { commandId: randomUUID(), clientId: randomUUID(), code: room.code, displayName: 'สาย', avatarId: 0 })).rejects.toMatchObject({ code: 'ROOM_STARTED' });
  });

  it('requires explicit control takeover; rejects old generation and preserves read-only resume', async () => {
    const roomId = await create(); const api = roomService(getDatabase(adminB)); const client = clients[1];
    const newClientId = randomUUID();
    await api.command(client.uid, { roomId, commandId: randomUUID(), clientId: newClientId, sessionGeneration: 1, gameId: null, command: { type: 'claimControl' } });
    expect((await core(roomId)).members[client.uid].sessionGeneration).toBe(2);
    await expect(api.command(client.uid, { roomId, commandId: randomUUID(), clientId: client.clientId, sessionGeneration: 1, gameId: null,
      command: { type: 'setReady', ready: true } })).rejects.toMatchObject({ code: 'STALE_SESSION' });
    expect((await api.resume(client.uid, roomId)).roomId).toBe(roomId);
    await expect(api.resume('stranger', roomId)).rejects.toMatchObject({ code: 'NOT_MEMBER' });
  });

  it('caps concurrent joins at six seats', async () => {
    const roomId = await create(); const room = await core(roomId); const api = roomService(getDatabase(adminB));
    const attempts = await Promise.allSettled(Array.from({ length: 5 }, (_, index) => api.join(`extra-${index}-${roomId}`, {
      commandId: randomUUID(), clientId: randomUUID(), code: room.code, displayName: `คน${index}`, avatarId: 0,
    })));
    expect(attempts.filter(result => result.status === 'fulfilled')).toHaveLength(2);
    expect((await core(roomId)).seatOrder).toHaveLength(6);
  });

  it('resets every game field on rematch and invalidates commands from the previous session epoch', async () => {
    const roomId = await create();
    for (let index = 0; index < 4; index++) await command(roomId, index, { type: 'setReady', ready: true });
    await command(roomId, 0, { type: 'startGame' }); const oldGame = (await core(roomId)).game!;
    await command(roomId, 0, { type: 'abortGame' });
    expect(publicView(await core(roomId)).scores).toBeNull();
    await command(roomId, 0, { type: 'requestRematch' });
    const lobby = await core(roomId);
    expect(lobby.lifecycle).toBe('LOBBY'); expect(lobby.game).toBeNull();
    expect(lobby.seatOrder.every(id => !lobby.members[id].ready && lobby.members[id].sessionGeneration === 2)).toBe(true);
    await expect(roomService(getDatabase(adminB)).command(clients[0].uid, { roomId, commandId: randomUUID(),
      clientId: clients[0].clientId, sessionGeneration: 1, gameId: null, command: { type: 'setReady', ready: true } })).rejects.toMatchObject({ code: 'STALE_SESSION' });
    for (let index = 0; index < 4; index++) await command(roomId, index, { type: 'setReady', ready: true });
    await command(roomId, 0, { type: 'startGame' }); const next = (await core(roomId)).game!;
    expect(next.gameId).not.toBe(oldGame.gameId);
    expect(next.finances.debts).toEqual([]); expect(next.history).toEqual([]);
    expect(Object.values(next.finances.cash)).toEqual([50, 50, 50, 50]);
  });

  it('verifies lobby host succession from server-read presence without changing game roles', async () => {
    const roomId = await create(); const room = await core(roomId);
    room.members[room.hostId].joinedAt -= 20000;
    await getDatabase(adminA).ref(`rooms/${roomId}`).set(storeRoom(room));
    await getDatabase(adminA).ref(`presence/${roomId}`).set({ [clients[1].uid]: { c1: { online: true } }, [clients[2].uid]: { c2: { online: true } } });
    await expect(command(roomId, 2, { type: 'claimHost' })).rejects.toMatchObject({ code: 'HOST_SUCCESSOR_REQUIRED' });
    await command(roomId, 1, { type: 'claimHost' });
    expect((await core(roomId)).hostId).toBe(clients[1].uid);
    expect((await core(roomId)).game).toBeNull();
    await getDatabase(adminA).ref(`presence/${roomId}`).remove();
  });

  it('resumes a stored 0.1 game unchanged and starts 0.2 only after an explicit rematch', async () => {
    const roomId = await create(); const room = await core(roomId);
    room.game = startGame(randomUUID(), room.seatOrder, seededEntropy(42, 120), LEGACY_RULES);
    room.lifecycle = 'PLAYING';
    await getDatabase(adminA).ref(`rooms/${roomId}`).set(storeRoom(room));
    const apiB = roomService(getDatabase(adminB));
    await apiB.resume(clients[0].uid, roomId);
    expect((await core(roomId)).game).toEqual(room.game);
    const merchantIndex = clients.findIndex(client => client.uid !== room.game!.sheriffId);
    await command(roomId, merchantIndex, { type: 'prepareGoods', roundIndex: 1,
      cardIds: room.game.players[clients[merchantIndex].uid].hand.slice(0, 3).map(card => card.instanceId) }, apiB);
    const continued = (await core(roomId)).game!;
    expect(continued.rules).toEqual(LEGACY_RULES);
    expect(publicView(await core(roomId)).rules).toEqual(LEGACY_RULES);
    expect(() => assertGameState(continued)).not.toThrow();
    await command(roomId, 0, { type: 'abortGame' }, apiB);
    await command(roomId, 0, { type: 'requestRematch' }, apiB);
    for (let index = 0; index < 4; index++) await command(roomId, index, { type: 'setReady', ready: true }, apiB);
    await command(roomId, 0, { type: 'startGame' }, apiB);
    const next = (await core(roomId)).game!;
    expect(next.gameId).not.toBe(continued.gameId);
    expect(next.rules.rulesVersion).toBe('0.2'); expect(next.rules.totalCards).toBe(360);
    expect(next.deck).toHaveLength(336); expect(next.discard).toEqual([]);
    expect(() => assertGameState(next)).not.toThrow();
  });

  it('allows members only at the exact public and own-private paths', async () => {
    const owner = env.authenticatedContext('alice').database(); const other = env.authenticatedContext('bob').database();
    const stranger = env.authenticatedContext('charlie').database(); const guest = env.unauthenticatedContext().database();
    await assertSucceeds(owner.ref('rooms/rules-room/views/public').get());
    await assertSucceeds(owner.ref('rooms/rules-room/views/private/alice').get());
    await assertFails(other.ref('rooms/rules-room/views/private/alice').get());
    for (const actor of [stranger, guest]) {
      await assertFails(actor.ref('rooms/rules-room/views/public').get());
      await assertFails(actor.ref('rooms/rules-room/views/private/alice').get());
    }
    for (const path of ['/', 'rooms', 'rooms/rules-room', 'rooms/rules-room/members', 'rooms/rules-room/authoritative',
      'rooms/rules-room/views', 'rooms/rules-room/views/private', 'roomCodes/TEST', 'requestLimits/alice']) {
      await assertFails(owner.ref(path).get()); await assertFails(owner.ref(path).set('fake'));
    }
    for (const path of ['rooms/rules-room/views/public', 'rooms/rules-room/views/private/alice']) await assertFails(owner.ref(path).set('fake'));
  });

  it('permits validated own presence only; refuses identity and field forgery', async () => {
    const owner = env.authenticatedContext('alice').database(); const other = env.authenticatedContext('bob').database();
    const path = 'presence/rules-room/alice/connection-1';
    const valid = { online: true, connectedAt: { '.sv': 'timestamp' } };
    await assertSucceeds(owner.ref(path).set(valid));
    await assertSucceeds(other.ref('presence/rules-room').get());
    await assertFails(other.ref(path).set(valid));
    await assertFails(owner.ref(path).set({ ...valid, cash: 999 }));
    await assertFails(owner.ref(path).set({ online: false, connectedAt: { '.sv': 'timestamp' } }));
    await assertFails(owner.ref(path).set({ online: true, connectedAt: Date.now() + 3600000 }));
    await assertFails(env.authenticatedContext('stranger').database().ref('presence/rules-room/stranger/x').set(valid));
    await assertSucceeds(owner.ref(path).remove());
  });

  it('publishes identical complete public views for same-size PASS bags with one versus four contraband', async () => {
    const base = await core(await create());
    const scenario = (products: ProductId[]) => {
      let game = gameFixture(); const merchant = game.seatOrder.find(id => id !== game.sheriffId)!;
      game = prepareAll(arrangeHand(game, merchant, products));
      for (const id of game.seatOrder.filter(id => id !== game.sheriffId)) game = applyGameCommand(game, {
        type: 'lockBag', roundIndex: 1, declaredProductId: 'apple', cardIds: game.players[id].hand.slice(0, id === merchant ? 4 : 1).map(card => card.instanceId),
      }, { actorId: id, commandId: `pack-${id}`, entropy: seededEntropy(4) });
      game = applyGameCommand(game, { type: 'setOffer', roundIndex: 1, amount: 5, expectedOfferVersion: 0 }, { actorId: merchant, commandId: 'offer', entropy: [] });
      game = applyGameCommand(game, { type: 'selectMerchant', roundIndex: 1, merchantId: merchant }, { actorId: game.sheriffId, commandId: 'select', entropy: [] });
      game = applyGameCommand(game, { type: 'resolveMerchant', roundIndex: 1, merchantId: merchant, action: 'PASS', expectedOfferVersion: 1 },
        { actorId: game.sheriffId, commandId: 'same-result', entropy: [] });
      const room: RoomCore = { ...base, hostId: game.seatOrder[0], seatOrder: [...game.seatOrder], lifecycle: 'PLAYING', game,
        members: Object.fromEntries(game.seatOrder.map(id => [id, { ...base.members[clients[0].uid], displayName: id }])) };
      return room;
    };
    const one = scenario(['apple', 'apple', 'apple', 'crossbow']);
    const four = scenario(['moonshine', 'crossbow', 'cannabis_leaf', 'cannabis_leaf']);
    expect(publicView(one)).toEqual(publicView(four));
    expect(storeRoom(one).views.public).toEqual(storeRoom(four).views.public);
    const { rules, ...visible } = publicView(one);
    expect(rules.totalCards).toBe(360); // Public catalogue, not anyone's private card distribution.
    expect(JSON.stringify(visible)).not.toMatch(/instanceId|goodsValue|stash|cannabis_leaf|crossbow|moonshine/);
    expect(publicView(one).result?.contrabandPassed).toBe(true);
  });
});
