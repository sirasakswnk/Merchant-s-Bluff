import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { authenticatedUid } from './auth';
import { adminDatabase } from './firebase-admin';
import { GameRuleError } from '../game/errors';

const responseHeaders = { 'Cache-Control': 'no-store' };
async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new GameRuleError('INVALID_INPUT', 'ต้องส่งข้อมูล JSON');
  const reader = request.body?.getReader();
  if (!reader) throw new GameRuleError('INVALID_INPUT', 'ไม่มีข้อมูลคำสั่ง');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0; let text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.length;
      if (bytes > 16384) { await reader.cancel(); throw new GameRuleError('INVALID_INPUT', 'คำสั่งมีขนาดใหญ่เกินไป'); }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (error instanceof GameRuleError) throw error;
    throw new GameRuleError('INVALID_INPUT', 'รูปแบบคำสั่งไม่ถูกต้อง');
  } finally { reader.releaseLock(); }
}
async function checkRate(uid: string, id: string): Promise<void> {
  const window = Math.floor(Date.now() / 60000);
  const key = createHash('sha256').update(id).digest('hex');
  const { snapshot } = await adminDatabase().ref(`requestLimits/${uid}`).transaction((stored: { window: number; seen?: Record<string, true> } | null) => {
    const seen = stored?.window === window ? { ...stored.seen } : {};
    if (Object.hasOwn(seen, key)) return stored;
    if (Object.keys(seen).length >= 180) return stored;
    seen[key] = true;
    return { window, seen };
  });
  if (!snapshot.child(`seen/${key}`).exists()) throw new GameRuleError('RATE_LIMITED', 'ส่งคำสั่งถี่เกินไป กรุณารอสักครู่');
}
function checkOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin) return; // Non-browser authenticated clients remain supported.
  let matches = false;
  try { const url = new URL(origin); matches = url.host === request.headers.get('host') && url.protocol === new URL(request.url).protocol; } catch { /* Reject below. */ }
  if (!matches) throw new GameRuleError('INVALID_ORIGIN', 'ต้นทางคำสั่งไม่ถูกต้อง');
}
export async function roomPost<T extends { commandId: string }>(request: Request, schema: z.ZodType<T>, operation: (uid: string, body: T) => Promise<unknown>): Promise<Response> {
  try {
    checkOrigin(request);
    const uid = await authenticatedUid(request);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new GameRuleError('UNAUTHORIZED', 'บัญชีไม่ถูกต้อง');
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) throw new GameRuleError('INVALID_INPUT', 'ข้อมูลคำสั่งไม่ถูกต้อง');
    await checkRate(uid, `${new URL(request.url).pathname}:${parsed.data.commandId}`);
    return Response.json(await operation(uid, parsed.data), { headers: responseHeaders });
  } catch (error) { return roomError(error); }
}
export function roomError(error: unknown): Response {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') return Response.json({ error: 'UNAUTHORIZED', message: 'กรุณาเชื่อมต่อใหม่' }, { status: 401, headers: responseHeaders });
  if (error instanceof GameRuleError) {
    const status = error.code === 'INVALID_INPUT' ? 400 : error.code === 'ROOM_NOT_FOUND' ? 404 : error.code === 'RATE_LIMITED' ? 429
      : ['NOT_MEMBER', 'INVALID_ORIGIN', 'HOST_REQUIRED', 'SHERIFF_REQUIRED', 'CONTROL_REQUIRED', 'STALE_SESSION'].includes(error.code) ? 403 : 409;
    return Response.json({ error: error.code, message: error.message }, { status, headers: responseHeaders });
  }
  console.error('Room operation failed'); // Never log tokens, cards or snapshots.
  return Response.json({ error: 'SERVICE_UNAVAILABLE', message: 'ยังยืนยันผลคำสั่งไม่ได้ กรุณาลองคำสั่งเดิมอีกครั้ง' }, { status: 503, headers: responseHeaders });
}
