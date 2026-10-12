import { notFound } from 'next/navigation';
import { RoomClient } from '@/components/room-client';
export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!/^[a-f0-9]{32}$/.test(roomId)) notFound();
  return <RoomClient roomId={roomId} />;
}
