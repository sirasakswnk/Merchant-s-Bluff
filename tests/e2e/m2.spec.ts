import { randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext } from '@playwright/test';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectDatabaseEmulator, get, getDatabase, onValue, ref, type Database } from 'firebase/database';
import type { CommandReceipt, PrivateRoomView, PublicRoomView, RoomCommandRequest } from '../../src/lib/shared/rooms';

interface Client { app: FirebaseApp; db: Database; uid: string; clientId: string; token: string }
let clients: Client[];
test.beforeEach(async () => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIREBASE_DATABASE_EMULATOR_HOST) throw new Error('Run npm run test:m0 with real emulators');
  clients = [];
  for (let index = 0; index < 4; index++) {
    const app = initializeApp({ apiKey: 'demo-api-key', projectId: 'demo-merchants-bluff',
      databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' }, `m2-client-${randomUUID()}`);
    const auth = getAuth(app); connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    const db = getDatabase(app); const [host, port] = process.env.FIREBASE_DATABASE_EMULATOR_HOST.split(':');
    connectDatabaseEmulator(db, host, Number(port));
    const user = (await signInAnonymously(auth)).user;
    clients.push({ app, db, uid: user.uid, clientId: randomUUID(), token: await user.getIdToken() });
  }
});
test.afterEach(async () => { await Promise.all(clients.map(client => deleteApp(client.app))); });
async function post(request: APIRequestContext, client: Client, path: string, body: unknown) {
  return request.post(path, { headers: { Authorization: `Bearer ${client.token}` }, data: body });
}
async function view(client: Client, roomId: string): Promise<PublicRoomView> {
  return JSON.parse((await get(ref(client.db, `rooms/${roomId}/views/public`))).val());
}
async function own(client: Client, roomId: string): Promise<PrivateRoomView> {
  return JSON.parse((await get(ref(client.db, `rooms/${roomId}/views/private/${client.uid}`))).val());
}
async function room(request: APIRequestContext): Promise<CommandReceipt> {
  const created = await post(request, clients[0], '/api/rooms/create', {
    commandId: randomUUID(), clientId: clients[0].clientId, displayName: 'นายตลาด', avatarId: 0,
  });
  expect(created.status()).toBe(200); const result = await created.json() as CommandReceipt;
  for (const [index, client] of clients.slice(1).entries()) {
    const joined = await post(request, client, '/api/rooms/join', {
      commandId: randomUUID(), clientId: client.clientId, code: result.code, displayName: `พ่อค้า${index + 1}`, avatarId: index + 1,
    });
    expect(joined.status()).toBe(200);
  }
  return result;
}
async function send(request: APIRequestContext, client: Client, roomId: string, command: RoomCommandRequest['command']) {
  const [publicView, privateView] = await Promise.all([view(client, roomId), own(client, roomId)]);
  return post(request, client, '/api/rooms/command', {
    roomId, commandId: randomUUID(), clientId: client.clientId,
    sessionGeneration: privateView.sessionGeneration, gameId: publicView.gameId, command,
  });
}
async function begin(request: APIRequestContext, roomId: string) {
  for (const client of clients) expect((await send(request, client, roomId, { type: 'setReady', ready: true })).status()).toBe(200);
  expect((await send(request, clients[0], roomId, { type: 'startGame' })).status()).toBe(200);
}

test('four authenticated API clients receive allowed realtime views and play a complete round', async ({ request }) => {
  const { roomId } = await room(request);
  const realtime = new Promise<void>((resolve, reject) => {
    let dispose = () => {}; const timer = setTimeout(() => { dispose(); reject(new Error('Realtime update missing')); }, 10000);
    dispose = onValue(ref(clients[3].db, `rooms/${roomId}/views/public`), snapshot => {
      if (snapshot.exists() && JSON.parse(snapshot.val()).phase === 'PREPARE') { clearTimeout(timer); dispose(); resolve(); }
    }, reject);
  });
  await begin(request, roomId); await realtime;
  const initial = await view(clients[0], roomId); const sheriff = clients.find(client => client.uid === initial.sheriffId)!;
  const merchants = clients.filter(client => client !== sheriff);
  for (const client of merchants) expect((await send(request, client, roomId, { type: 'prepareGoods', roundIndex: 1, cardIds: [] })).status()).toBe(200);
  for (const [index, client] of merchants.entries()) {
    const privateView = await own(client, roomId);
    expect((await send(request, client, roomId, { type: 'lockBag', roundIndex: 1,
      cardIds: [privateView.hand[0].instanceId], declaredProductId: 'apple' })).status()).toBe(200);
    const publicView = await view(client, roomId);
    if (index < merchants.length - 1) expect(publicView.players.every(player => player.declaration === null)).toBe(true);
  }
  for (const client of merchants) expect((await send(request, client, roomId, { type: 'setOffer', roundIndex: 1, amount: 0, expectedOfferVersion: 0 })).status()).toBe(200);
  for (const [index, client] of merchants.reverse().entries()) {
    expect((await send(request, sheriff, roomId, { type: 'selectMerchant', roundIndex: 1, merchantId: client.uid })).status()).toBe(200);
    const decision = await send(request, sheriff, roomId, { type: 'resolveMerchant', roundIndex: 1,
      merchantId: client.uid, action: index % 2 === 0 ? 'PASS' : 'INSPECT', expectedOfferVersion: 1 });
    expect(decision.status()).toBe(200);
    expect(Object.keys(await decision.json()).sort()).toEqual(['code', 'commandId', 'gameId', 'revision', 'roomId']);
    const publicView = await view(client, roomId);
    expect(publicView.phase).toBe('RESOLUTION');
    if (publicView.result!.action === 'PASS') {
      expect(publicView.result!.revealed).toBeNull(); expect(publicView.result!.passed).toBeNull();
      expect(JSON.stringify(publicView)).not.toMatch(/instanceId|stash|goodsValue|scoreDelta/);
    }
    const privateView = await own(client, roomId);
    expect(privateView.revision).toBe(publicView.revision);
    expect((await send(request, sheriff, roomId, { type: 'acknowledgeResolution', roundIndex: 1, resolutionId: publicView.result!.id })).status()).toBe(200);
  }
  expect((await view(clients[0], roomId)).phase).toBe('ROUND_SUMMARY');
  expect((await send(request, sheriff, roomId, { type: 'endRound', roundIndex: 1 })).status()).toBe(200);
  expect((await view(clients[0], roomId)).roundIndex).toBe(2);
  for (const client of clients) {
    const resumed = await request.get(`/api/rooms/${roomId}`, { headers: { Authorization: `Bearer ${client.token}` } });
    expect(resumed.status()).toBe(200);
    await expect(get(ref(client.db, `rooms/${roomId}/authoritative`))).rejects.toThrow();
    await expect(get(ref(client.db, `rooms/${roomId}/views/private/${clients.find(other => other !== client)!.uid}`))).rejects.toThrow();
  }
});

test('HTTP rejects missing/forged auth, origins and fabricated fields, and replays commits safely', async ({ request }) => {
  expect((await request.post('/api/rooms/create', { data: {} })).status()).toBe(401);
  expect((await request.post('/api/rooms/create', { headers: { Authorization: 'Bearer forged' }, data: {} })).status()).toBe(401);
  expect((await request.post('/api/rooms/create', { headers: { Authorization: `Bearer ${clients[0].token}`, Origin: 'https://wrong.example' }, data: {} })).status()).toBe(403);
  const { roomId } = await room(request);
  const requestBody = { roomId, commandId: randomUUID(), clientId: clients[0].clientId,
    sessionGeneration: 1, gameId: null, command: { type: 'setReady', ready: true } };
  const duplicates = await Promise.all([post(request, clients[0], '/api/rooms/command', requestBody), post(request, clients[0], '/api/rooms/command', requestBody)]);
  expect(duplicates.map(response => response.status())).toEqual([200, 200]);
  expect(await duplicates[0].json()).toEqual(await duplicates[1].json());
  expect((await post(request, clients[0], '/api/rooms/command', { ...requestBody, command: { type: 'setReady', ready: false } })).status()).toBe(409);
  expect((await post(request, clients[0], '/api/rooms/command', { ...requestBody, commandId: randomUUID(), cash: 999 })).status()).toBe(400);
  const newClientId = randomUUID();
  expect((await post(request, clients[0], '/api/rooms/command', { ...requestBody, commandId: randomUUID(), clientId: newClientId, command: { type: 'claimControl' } })).status()).toBe(200);
  expect((await post(request, clients[0], '/api/rooms/command', { ...requestBody, commandId: randomUUID() })).status()).toBe(403);
  expect((await own(clients[0], roomId)).sessionGeneration).toBe(2);
});

test('stale offers and concurrent decision replays cannot charge twice or grant a merchant sheriff powers', async ({ request }) => {
  const { roomId } = await room(request); await begin(request, roomId);
  const initial = await view(clients[0], roomId); const sheriff = clients.find(client => client.uid === initial.sheriffId)!;
  const merchants = clients.filter(client => client !== sheriff); const target = merchants[0];
  for (const client of merchants) expect((await send(request, client, roomId, { type: 'prepareGoods', roundIndex: 1, cardIds: [] })).status()).toBe(200);
  for (const client of merchants) expect((await send(request, client, roomId, { type: 'lockBag', roundIndex: 1,
    cardIds: [(await own(client, roomId)).hand[0].instanceId], declaredProductId: 'apple' })).status()).toBe(200);
  expect((await send(request, target, roomId, { type: 'setOffer', roundIndex: 1, amount: 2, expectedOfferVersion: 0 })).status()).toBe(200);
  expect((await send(request, sheriff, roomId, { type: 'selectMerchant', roundIndex: 1, merchantId: target.uid })).status()).toBe(200);
  expect((await send(request, target, roomId, { type: 'resolveMerchant', roundIndex: 1, merchantId: target.uid, action: 'PASS', expectedOfferVersion: 1 })).status()).toBe(403);
  expect((await send(request, target, roomId, { type: 'setOffer', roundIndex: 1, amount: 7, expectedOfferVersion: 1 })).status()).toBe(200);
  const stale = await send(request, sheriff, roomId, { type: 'resolveMerchant', roundIndex: 1, merchantId: target.uid, action: 'PASS', expectedOfferVersion: 1 });
  expect(stale.status()).toBe(409); expect((await stale.json()).error).toBe('STALE_OFFER');
  expect((await view(target, roomId)).players.find(player => player.id === target.uid)!.cash).toBe(50);
  const body: RoomCommandRequest = { roomId, commandId: randomUUID(), clientId: sheriff.clientId,
    sessionGeneration: 1, gameId: initial.gameId, command: { type: 'resolveMerchant', roundIndex: 1, merchantId: target.uid, action: 'PASS', expectedOfferVersion: 2 } };
  const duplicates = await Promise.all([post(request, sheriff, '/api/rooms/command', body), post(request, sheriff, '/api/rooms/command', body)]);
  expect(duplicates.map(response => response.status())).toEqual([200, 200]);
  expect(await duplicates[0].json()).toEqual(await duplicates[1].json());
  const committed = await view(target, roomId);
  expect(committed.phase).toBe('RESOLUTION');
  expect(committed.players.find(player => player.id === target.uid)!.cash).toBe(43);
  expect(committed.players.find(player => player.id === sheriff.uid)!.cash).toBe(57);
  expect((await post(request, sheriff, '/api/rooms/command', { ...body, commandId: randomUUID() })).status()).toBe(409);
  expect((await view(target, roomId)).history).toHaveLength(1);
  const resumed = await request.get(`/api/rooms/${roomId}`, { headers: { Authorization: `Bearer ${target.token}` } });
  expect(resumed.status()).toBe(200); expect((await view(target, roomId)).result!.id).toBe(body.commandId);
});
