import type { PublicPlayer } from '@/lib/shared/rooms';

/** Presentation order only. The room's authoritative seat/turn order is untouched. */
export function lobbySeats(players: readonly PublicPlayer[], viewerId: string, minimumPlayers: number) {
  const viewer = players.findIndex(player => player.id === viewerId);
  const ordered = viewer < 0 ? [...players] : [...players.slice(viewer), ...players.slice(0, viewer)];
  const count = Math.max(minimumPlayers, ordered.length);
  const angles = Array.from({ length: count }, (_, index) => Math.PI / 2 + index * Math.PI * 2 / count);
  const maximumX = Math.max(...angles.map(angle => Math.abs(Math.cos(angle))));
  return angles.map((angle, index) => ({
    player: ordered[index] ?? null, index,
    x: Number((Math.cos(angle) / maximumX).toFixed(5)), y: Number(Math.sin(angle).toFixed(5)),
  }));
}
