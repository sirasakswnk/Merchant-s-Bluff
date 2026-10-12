import 'server-only';
import type { Database } from 'firebase-admin/database';
import type { RoomCore, RoomReservation, StoredRoom } from '../room-model';
import { loadRoom, storeRoom } from '../projections';
import { GameRuleError } from '../../game/errors';
import { touchRetention, type RetiredRoom } from '../../maintenance/retention-policy';

function active(value: StoredRoom | RetiredRoom | null): StoredRoom | null {
  if (value?.retention?.kind === 'retired') throw new GameRuleError('ROOM_NOT_FOUND', 'ห้องหมดอายุแล้ว กรุณาสร้างห้องใหม่');
  return value as StoredRoom | null;
}

export function roomRepository(database: Database) {
  return {
    async read(roomId: string): Promise<RoomCore | null> {
      const value = active((await database.ref(`rooms/${roomId}`).get()).val());
      return value ? loadRoom(value) : null;
    },
    async mutate(roomId: string, update: (room: RoomCore) => RoomCore): Promise<RoomCore> {
      const { snapshot } = await database.ref(`rooms/${roomId}`).transaction((record: StoredRoom | RetiredRoom | null) => {
        // A first callback may see local null. Commit a no-op so server data can trigger retry.
        if (!record) return null;
        try {
          const value = active(record)!; const room = update(loadRoom(value));
          return { ...storeRoom(room), retention: touchRetention(room, value.retention, Date.now()) };
        } catch (error) { if (error instanceof GameRuleError) return record; throw error; }
      });
      const value = active(snapshot.val());
      if (!value) throw new GameRuleError('ROOM_NOT_FOUND', 'ไม่พบห้อง');
      return loadRoom(value);
    },
    async ensure(reservation: RoomReservation, create: () => RoomCore): Promise<RoomCore> {
      const { snapshot } = await database.ref(`rooms/${reservation.roomId}`).transaction((value: StoredRoom | RetiredRoom | null) => {
        if (value) return value;
        const room = create(); return { ...storeRoom(room), retention: touchRetention(room, undefined, Date.now()) };
      });
      return loadRoom(active(snapshot.val())!);
    },
    async touch(roomId: string, uid: string): Promise<RoomCore> {
      const { snapshot } = await database.ref(`rooms/${roomId}`).transaction((record: StoredRoom | RetiredRoom | null) => {
        if (!record || record.retention?.kind === 'retired') return record;
        const value = record as StoredRoom; const room = loadRoom(value);
        if (!Object.hasOwn(room.members, uid)) return record;
        return { ...value, retention: touchRetention(room, value.retention, Date.now()) };
      });
      const value = active(snapshot.val());
      if (!value) throw new GameRuleError('ROOM_NOT_FOUND', 'ไม่พบห้อง');
      return loadRoom(value);
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
