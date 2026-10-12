'use client';
import { onValue, ref } from 'firebase/database';
import { connectionPath, connectionRecordSchema, healthResponseSchema } from '@/lib/shared/health';
import { anonymousUser, getFirebaseClient } from './firebase';

/** Infrastructure check only; timeout never controls a game turn. */
export async function checkLocalConnection(signal: AbortSignal): Promise<void> {
  const health = await fetch('/api/health', { cache: 'no-store', signal });
  if (!health.ok) throw new Error('API ยังไม่พร้อม');
  healthResponseSchema.parse(await health.json());
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const user = await anonymousUser();
  const token = await user.getIdToken();
  const { database } = getFirebaseClient();
  let latestNonce: string | undefined;
  let expectedNonce: string | undefined;
  let succeed: (() => void) | undefined;
  let fail: ((reason: Error) => void) | undefined;
  const listenerResult = new Promise<void>((resolve, reject) => { succeed = resolve; fail = reject; });
  // Attach a handler immediately: permission failures can happen while HTTP is in flight.
  void listenerResult.catch(() => undefined);
  const check = () => { if (latestNonce && latestNonce === expectedNonce) succeed?.(); };
  const unsubscribe = onValue(ref(database, connectionPath(user.uid)), snapshot => {
    const parsed = connectionRecordSchema.safeParse(snapshot.val());
    if (parsed.success) { latestNonce = parsed.data.nonce; check(); }
  }, () => fail?.(new Error('อ่านข้อมูล RTDB ไม่ได้ ตรวจ emulator และ Rules')));
  const aborted = () => fail?.(new DOMException('Aborted', 'AbortError'));
  signal.addEventListener('abort', aborted, { once: true });
  const timeout = setTimeout(() => fail?.(new Error('ยังไม่ได้รับข้อมูลจาก RTDB กรุณาตรวจการเชื่อมต่อ')), 12000);
  try {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const response = await fetch('/api/dev/connect', {
      method: 'POST', headers: { Authorization: 'Bearer ' + token }, signal,
    });
    if (!response.ok) throw new Error('เชื่อมต่อไม่สำเร็จ (' + response.status + ') ตรวจการตั้งค่า emulator');
    expectedNonce = connectionRecordSchema.parse(await response.json()).nonce;
    check();
    await listenerResult;
  } finally {
    clearTimeout(timeout); signal.removeEventListener('abort', aborted); unsubscribe();
  }
}
