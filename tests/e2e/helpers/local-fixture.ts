import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

/** Only remove the exact anonymous fixture identities captured from these local browser contexts. */
export async function cleanupLocalFixture(origin: string, roomId: string, playerIds: readonly string[]) {
  if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) return { skipped: true };
  assert.match(roomId, /^[a-f0-9]{32}$/);
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:19000'; process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:19099';
  const app = initializeApp({ projectId: 'demo-merchants-bluff', databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' }, `cleanup-${roomId}`);
  try {
    const db = getDatabase(app), auth = getAuth(app);
    const room = JSON.parse((await db.ref(`rooms/${roomId}/authoritative/snapshot`).get()).val());
    assert.deepEqual([...room.seatOrder].sort(), [...playerIds].sort()); assert.match(room.code, /^[A-HJ-NP-Z2-9]{4}$/);
    for (const id of playerIds) { const user = await auth.getUser(id); assert.equal(user.providerData.length, 0); assert.ok(!user.email); }
    await db.ref().update({ [`rooms/${roomId}`]: null, [`presence/${roomId}`]: null, [`roomCodes/${room.code}`]: null });
    for (const id of playerIds) { await auth.deleteUser(id); await db.ref(`requestLimits/${id}`).remove(); }
    return { rooms: 1, users: playerIds.length };
  } finally { await deleteApp(app); }
}
