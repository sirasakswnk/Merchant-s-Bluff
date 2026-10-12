import 'server-only';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

function requireValue(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error('Missing server configuration: ' + name);
  return value;
}
export function isLocalEmulatorMode(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
}
function adminApp() {
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  const projectId = requireValue('FIREBASE_PROJECT_ID');
  const databaseURL = requireValue('FIREBASE_DATABASE_URL');
  if (isLocalEmulatorMode()) {
    if (!projectId.startsWith('demo-') || projectId !== process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !authHost || !databaseHost) {
      throw new Error('Local mode requires matching demo project IDs and both emulator hosts');
    }
  } else if (authHost || databaseHost || projectId.startsWith('demo-') || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    throw new Error('Emulator configuration is forbidden outside local mode');
  }
  const existing = getApps().find(app => app.name === 'merchant-server');
  if (existing) return existing;
  return initializeApp({
    projectId, databaseURL,
    ...(isLocalEmulatorMode() ? {} : { credential: cert({
      projectId, clientEmail: requireValue('FIREBASE_CLIENT_EMAIL'),
      privateKey: requireValue('FIREBASE_PRIVATE_KEY').split(String.fromCharCode(92) + 'n').join(String.fromCharCode(10)),
    }) }),
  }, 'merchant-server');
}
export function adminAuth() { return getAuth(adminApp()); }
export function adminDatabase() { return getDatabase(adminApp()); }
