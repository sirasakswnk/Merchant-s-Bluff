import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase, onValue, ref, get, type Database } from 'firebase/database';
import { initializeApp as initializeAdminApp, deleteApp as deleteAdminApp, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getDatabase as getAdminDatabase } from 'firebase-admin/database';
import { connectionPath } from '../../src/lib/shared/health';

const projectId = 'demo-merchants-bluff';
let client: FirebaseApp;
let admin: App;
let database: Database;
let env: RulesTestEnvironment;
let uid: string;

describe('real Firebase Auth/RTDB emulators', () => {
  beforeAll(async () => {
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
      throw new Error('Use npm run test:emulators or test:m0; real Firebase is forbidden in these tests');
    }
    const [databaseHost, databasePort] = process.env.FIREBASE_DATABASE_EMULATOR_HOST.split(':');
    env = await initializeTestEnvironment({ projectId, database: { host: databaseHost, port: Number(databasePort), rules: readFileSync('firebase/database.emulator.rules.json', 'utf8') } });
    admin = initializeAdminApp({ projectId, databaseURL: 'https://' + projectId + '-default-rtdb.firebaseio.com' }, 'm0-integration-admin');
    client = initializeApp({ apiKey: 'demo-api-key', projectId, databaseURL: 'https://' + projectId + '-default-rtdb.firebaseio.com' }, 'm0-integration-client');
    const auth = getAuth(client);
    connectAuthEmulator(auth, 'http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST, { disableWarnings: true });
    database = getDatabase(client);
    connectDatabaseEmulator(database, databaseHost, Number(databasePort));
    uid = (await signInAnonymously(auth)).user.uid;
  });
  afterAll(async () => {
    if (admin && uid) await getAdminDatabase(admin).ref('healthChecks/' + uid).remove();
    if (client) await deleteApp(client);
    if (admin) await deleteAdminApp(admin);
    if (env) await env.cleanup();
  });
  it('verifies a real anonymous ID token on the Admin SDK', async () => {
    const token = await getAuth(client).currentUser!.getIdToken();
    const verified = await getAdminAuth(admin).verifyIdToken(token);
    expect(verified.uid).toBe(uid);
    expect(verified.firebase.sign_in_provider).toBe('anonymous');
  });
  it('streams a committed Admin write to the authenticated Web SDK', async () => {
    const nonce = crypto.randomUUID();
    const received = new Promise<void>((resolve, reject) => {
      const unsubscribe = onValue(ref(database, connectionPath(uid)), snapshot => {
        if (snapshot.val()?.nonce === nonce) { unsubscribe(); resolve(); }
      }, reject);
    });
    await getAdminDatabase(admin).ref(connectionPath(uid)).set({ nonce, checkedAt: Date.now() });
    await received;
    expect((await get(ref(database, connectionPath(uid)))).val().nonce).toBe(nonce);
  });
  it('permits only the owner to read the emulator health path and denies client writes', async () => {
    const owner = env.authenticatedContext(uid).database();
    const other = env.authenticatedContext('other-user').database();
    const guest = env.unauthenticatedContext().database();
    await assertSucceeds(owner.ref(connectionPath(uid)).get());
    await assertFails(other.ref(connectionPath(uid)).get());
    await assertFails(guest.ref(connectionPath(uid)).get());
    await assertFails(owner.ref(connectionPath(uid)).set({ nonce: crypto.randomUUID(), checkedAt: Date.now() }));
    await assertFails(owner.ref('healthChecks').get());
  });
  it('denies game state, secret paths, and root reads/writes even to authenticated users', async () => {
    const owner = env.authenticatedContext(uid).database();
    for (const location of ['/', 'rooms', 'rooms/test/authoritative', 'rooms/test/views/public', 'rooms/test/views/private/' + uid, 'roomCodes/TEST']) {
      await assertFails(owner.ref(location).get());
      await assertFails(owner.ref(location).set({ cash: 999 }));
    }
  });
  it('rejects a forged token and keeps production root/authoritative paths default-deny', async () => {
    await expect(getAdminAuth(admin).verifyIdToken('forged-token')).rejects.toThrow();
    const productionRules = JSON.parse(readFileSync('firebase/database.rules.json', 'utf8'));
    expect(productionRules.rules['.read']).toBe(false);
    expect(productionRules.rules['.write']).toBe(false);
    expect(productionRules.rules.healthChecks).toBeUndefined();
    expect(productionRules.rules.rooms.$roomId.authoritative).toBeUndefined();
  });
});
