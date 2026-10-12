import { createRoomSchema } from '@/lib/shared/rooms';
import { roomPost } from '@/lib/server/http';
import { adminDatabase } from '@/lib/server/firebase-admin';
import { roomService } from '@/lib/server/room-service';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  return roomPost(request, createRoomSchema, (uid, body) => roomService(adminDatabase()).create(uid, body));
}
