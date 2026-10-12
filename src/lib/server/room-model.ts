import 'server-only';
import type { GameState } from '../game/types';
import type { CommandReceipt } from '../shared/rooms';

export interface RoomMember {
  displayName: string; avatarId: number; ready: boolean; joinedAt: number;
  controlClientId: string; sessionGeneration: number;
}
export interface ProcessedCommand { actorId: string; fingerprint: string; receipt: CommandReceipt }
export interface RoomCore {
  roomId: string; code: string; hostId: string; revision: number;
  lifecycle: 'LOBBY' | 'PLAYING' | 'FINISHED' | 'ABORTED';
  seatOrder: string[]; members: Record<string, RoomMember>;
  game: GameState | null; processed: Record<string, ProcessedCommand>;
  creation: ProcessedCommand;
}
export interface StoredRoom {
  authoritative: { snapshot: string };
  members: Record<string, true>;
  views: { public: string; private: Record<string, string> };
}
export interface RoomReservation {
  roomId: string; code: string; ownerId: string; commandId: string; clientId: string;
  displayName: string; avatarId: number; createdAt: number; fingerprint: string; status: 'pending' | 'ready';
}
