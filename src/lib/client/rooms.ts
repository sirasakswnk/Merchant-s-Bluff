'use client';
import { onDisconnect, onValue, ref, remove, serverTimestamp, set } from 'firebase/database';
import { anonymousUser, getFirebaseClient } from './firebase';
import { clientUuid } from './uuid';
import type { CommandReceipt, PrivateRoomView, PublicRoomView } from '../shared/rooms';

export class ApiError extends Error {
  constructor(readonly code: string, message: string, readonly uncertain: boolean) { super(message); }
}
export function tabClientId(): string {
  let id = sessionStorage.getItem('merchant-client-id');
  if (!id) { id = clientUuid(); sessionStorage.setItem('merchant-client-id', id); }
  return id;
}
export interface PendingRequest { uid: string; path: string; body: Record<string, unknown> }
export const PENDING_KEY = 'merchant-pending-request';
/** Send immediately. Gameplay requests are never silently queued while offline. */
export async function postRoom(pending: PendingRequest): Promise<CommandReceipt> {
  if (!navigator.onLine) throw new ApiError('OFFLINE', 'ออฟไลน์อยู่ กรุณาเชื่อมต่อก่อนส่งคำสั่ง', false);
  const user = await anonymousUser();
  if (user.uid !== pending.uid) throw new ApiError('IDENTITY_CHANGED', 'บัญชีในเครื่องเปลี่ยนแล้ว ไม่สามารถส่งคำสั่งของที่นั่งเดิมได้', false);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(pending.path, { method: 'POST', cache: 'no-store', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify(pending.body) });
    const body = await response.json();
    if (!response.ok) throw new ApiError(body.error ?? 'REQUEST_FAILED', body.message ?? 'ส่งคำสั่งไม่สำเร็จ', response.status >= 500);
    return body as CommandReceipt;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('UNKNOWN_RESULT', 'ยังยืนยันผลไม่ได้ กรุณาลองส่งคำสั่งเดิมอีกครั้ง', true);
  } finally { clearTimeout(timeout); }
}
export async function resumeRoom(roomId: string): Promise<CommandReceipt> {
  const user = await anonymousUser();
  const response = await fetch(`/api/rooms/${roomId}`, { cache: 'no-store', headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
  if (!response.ok) { const body = await response.json(); throw new ApiError(body.error, body.message, response.status >= 500); }
  return await response.json() as CommandReceipt;
}
export function watchRoom(roomId: string, uid: string, onViews: (publicView: PublicRoomView, privateView: PrivateRoomView) => void, onError: (error: Error) => void, onSync: (ready: boolean) => void) {
  const { database } = getFirebaseClient();
  let publicView: PublicRoomView | null = null; let privateView: PrivateRoomView | null = null;
  const deliver = () => {
    onSync(Boolean(publicView && privateView && publicView.revision === privateView.revision));
    if (publicView && privateView && publicView.revision === privateView.revision) onViews(publicView, privateView);
  };
  const stops = [
    onValue(ref(database, `rooms/${roomId}/views/public`), snapshot => {
      try { if (snapshot.exists()) { publicView = JSON.parse(snapshot.val()); deliver(); } } catch { onError(new Error('อ่านข้อมูลห้องไม่ได้')); }
    }, onError),
    onValue(ref(database, `rooms/${roomId}/views/private/${uid}`), snapshot => {
      try { if (snapshot.exists()) { privateView = JSON.parse(snapshot.val()); deliver(); } } catch { onError(new Error('อ่านข้อมูลส่วนตัวไม่ได้')); }
    }, onError),
  ];
  return () => stops.forEach(stop => stop());
}
export function watchPresence(roomId: string, uid: string, onOnline: (connected: boolean) => void, onPlayers: (players: ReadonlySet<string>) => void) {
  const { database } = getFirebaseClient(); let active = true; let generation = 0;
  const connections = new Set<ReturnType<typeof ref>>();
  const stopConnection = onValue(ref(database, '.info/connected'), snapshot => {
    const connected = snapshot.val() === true; onOnline(connected); const current = ++generation;
    if (!connected) return;
    const connection = ref(database, `presence/${roomId}/${uid}/${clientUuid()}`); connections.add(connection);
    void (async () => {
      try {
        await onDisconnect(connection).remove();
        if (!active || current !== generation) return;
        await set(connection, { online: true, connectedAt: serverTimestamp() });
        if (!active || current !== generation) await remove(connection);
      } catch { if (active && current === generation) onOnline(false); }
    })();
  });
  const stopPlayers = onValue(ref(database, `presence/${roomId}`), snapshot => {
    const values = (snapshot.val() ?? {}) as Record<string, Record<string, { online?: boolean }>>;
    onPlayers(new Set(Object.entries(values).filter(([, connections]) => Object.values(connections).some(value => value.online === true)).map(([id]) => id)));
  });
  return () => {
    active = false; generation++; stopConnection(); stopPlayers();
    for (const connection of connections) void onDisconnect(connection).cancel().then(() => remove(connection)).catch(() => {});
  };
}
