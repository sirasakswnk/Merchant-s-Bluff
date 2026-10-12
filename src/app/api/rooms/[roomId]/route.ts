import { authenticatedUid } from '@/lib/server/auth';
import { adminDatabase } from '@/lib/server/firebase-admin';
import { roomError } from '@/lib/server/http';
import { roomService } from '@/lib/server/room-service';
export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ roomId: string }> }) {
  try {
    const uid = await authenticatedUid(request); const { roomId } = await context.params;
    if (!/^[a-f0-9]{32}$/.test(roomId)) return Response.json({ error: 'ROOM_NOT_FOUND' }, { status: 404 });
    return Response.json(await roomService(adminDatabase()).resume(uid, roomId), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return roomError(error); }
}
