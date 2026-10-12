import 'server-only';
import type { Database } from 'firebase-admin/database';
import { getApp } from 'firebase-admin/app';

/** Fresh REST reads after a cleanup fence must fail instead of falling back to cached presence. */
export function retentionRest(database: Database) {
  const configured = new URL(database.app.options.databaseURL!);
  const emulator = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  if (emulator && (!database.app.options.projectId?.startsWith('demo-') || !/^(?:127\.0\.0\.1|localhost):[0-9]{2,5}$/.test(emulator))) throw new Error('INVALID_RETENTION_TARGET');
  if (!emulator && (configured.protocol !== 'https:' || configured.port || configured.username || configured.password || configured.pathname !== '/' || configured.search || configured.hash
    || !/(?:\.firebaseio\.com|\.firebasedatabase\.app)$/.test(configured.hostname))) throw new Error('INVALID_RETENTION_TARGET');
  const root = emulator ? new URL(`http://${emulator}/`) : configured;
  async function get(path: string, shallow = false): Promise<unknown> {
    if (!/^(?:rooms|presence|roomCodes)(?:\/[A-Za-z0-9_-]{1,128})*(?:\/retention)?$/.test(path) && path !== '.settings/rules') throw new Error('INVALID_RETENTION_PATH');
    const url = new URL(`${path}.json`, root);
    if (emulator) url.searchParams.set('ns', configured.hostname.split('.')[0]);
    if (shallow) url.searchParams.set('shallow', 'true');
    const credential = getApp(database.app.name).options.credential;
    const token = emulator ? 'owner' : (await credential!.getAccessToken()).access_token;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
      redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('RETENTION_READ_FAILED');
    const text = await response.text();
    if (text.length > 2 * 1024 * 1024) throw new Error('RETENTION_SCAN_TOO_LARGE');
    try { return JSON.parse(text); } catch { throw new Error('RETENTION_READ_INVALID_JSON'); }
  }
  return { get, async keys(path: 'rooms' | 'roomCodes') {
    const value = await get(path, true);
    if (value === null) return [];
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('RETENTION_INDEX_INVALID');
    return Object.keys(value).sort();
  } };
}
