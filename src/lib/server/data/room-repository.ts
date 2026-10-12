import 'server-only';
import type { Database } from 'firebase-admin/database';
import type { RoomCore, RoomReservation, StoredRoom } from '../room-model';
import { loadRoom, storeRoom } from '../projections';
import { GameRuleError } from '../../game/errors';

export function roomRepository(database: Database) {
  return {
    async read(roomId: string): Promise<RoomCore | null> {
      const value = (await database.ref(`rooms/${roomId}`).get()).val() as StoredRoom | null;
      return value ? loadRoom(value) : null;
    },
    async mutate(roomId: string, update: (room: RoomCore) => RoomCore): Promise<RoomCore> {
      const { snapshot } = await database.ref(`rooms/${roomId}`).transaction((value: StoredRoom | null) => {
        // A first callback may see local null. Commit a no-op so server data can trigger retry.
        if (!value) return null;
        try { return storeRoom(update(loadRoom(value))); }
        catch (error) { if (error instanceof GameRuleError) return value; throw error; }
      });
      const value = snapshot.val() as StoredRoom | null;
      if (!value) throw new GameRuleError('ROOM_NOT_FOUND', 'ไม่พบห้อง');
      return loadRoom(value);
    },
    async ensure(reservation: RoomReservation, create: () => RoomCore): Promise<RoomCore> {
      const { snapshot } = await database.ref(`rooms/${reservation.roomId}`).transaction((value: StoredRoom | null) => value ?? storeRoom(create()));
      return loadRoom(snapshot.val() as StoredRoom);
    },
    async reserve(reservation: RoomReservation): Promise<RoomReservation> {
      const { snapshot } = await database.ref(`roomCodes/${reservation.code}`).transaction((value: RoomReservation | null) => value ?? reservation);
      return snapshot.val() as RoomReservation;
    },
    async reservation(code: string): Promise<RoomReservation | null> {
      return (await database.ref(`roomCodes/${code}`).get()).val() as RoomReservation | null;
    },
    async markReady(reservation: RoomReservation): Promise<void> {
      await database.ref(`roomCodes/${reservation.code}`).transaction((value: RoomReservation | null) =>
        value?.roomId === reservation.roomId ? { ...value, status: 'ready' } : value);
    },
    async online(roomId: string): Promise<ReadonlySet<string>> {
      const presence = (await database.ref(`presence/${roomId}`).get()).val() as Record<string, Record<string, { online?: boolean }>> | null;
      return new Set(Object.entries(presence ?? {}).filter(([, connections]) => Object.values(connections).some(connection => connection.online === true)).map(([uid]) => uid));
    },
  };
}
