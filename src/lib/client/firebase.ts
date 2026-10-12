'use client';
import { getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, connectAuthEmulator, getAuth, setPersistence, signInAnonymously, type Auth } from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase, type Database } from 'firebase/database';

type FirebaseClient = { auth: Auth; database: Database };
const clientCache = globalThis as typeof globalThis & { merchantFirebase?: FirebaseClient };
export function getFirebaseClient(): FirebaseClient {
  if (clientCache.merchantFirebase) return clientCache.merchantFirebase;
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (Object.values(config).some(value => !value)) throw new Error('ยังไม่ได้ตั้งค่า Firebase ใน .env.local');
  const emulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
  if (emulators && (process.env.NODE_ENV === 'production' || !config.projectId?.startsWith('demo-'))) {
    throw new Error('การเชื่อม emulator ใช้ได้เฉพาะ development และ demo project');
  }
  const app = getApps().find(app => app.name === 'merchant-client') ?? initializeApp(config, 'merchant-client');
  const auth = getAuth(app);
  const database = getDatabase(app);
  if (emulators) {
    const hostname = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || window.location.hostname;
    const urlHost = hostname.includes(':') ? '[' + hostname + ']' : hostname;
    connectAuthEmulator(auth, 'http://' + urlHost + ':' + (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || '19099'), { disableWarnings: true });
    connectDatabaseEmulator(database, hostname, Number(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_EMULATOR_PORT || 19000));
  }
  clientCache.merchantFirebase = { auth, database };
  return clientCache.merchantFirebase;
}
let pendingUser: ReturnType<typeof initializeAnonymousUser> | undefined;
async function initializeAnonymousUser() {
  const { auth } = getFirebaseClient();
  await setPersistence(auth, browserLocalPersistence);
  await auth.authStateReady();
  return auth.currentUser ?? (await signInAnonymously(auth)).user;
}
export function anonymousUser() {
  pendingUser ??= initializeAnonymousUser().finally(() => { pendingUser = undefined; });
  return pendingUser;
}
