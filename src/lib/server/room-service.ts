import 'server-only';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Database } from 'firebase-admin/database';
import { applyGameCommand, startGame } from '../game/engine';
import { RULES } from '../game/config';
import { GameRuleError, requireRule } from '../game/errors';
import { ROOM_CODE_ALPHABET, type CommandReceipt, type CreateRoomRequest, type JoinRoomRequest, type RoomCommandRequest } from '../shared/rooms';
import { roomRepository } from './data/room-repository';
import type { ProcessedCommand, RoomCore, RoomReservation } from './room-model';

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function serverEntropy(): number[] {
  // One sample for the first sheriff plus totalCards - 1 for the initial shuffle.
  // This also covers any discard reshuffle in current and older game snapshots.
  const bytes = randomBytes(RULES.totalCards * 4);
  return Array.from({ length: RULES.totalCards }, (_, index) => bytes.readUInt32BE(index * 4) / 4294967296);
}
function receipt(room: RoomCore, commandId: string): CommandReceipt {
  return { commandId, roomId: room.roomId, code: room.code, revision: room.revision, gameId: room.game?.gameId ?? null };
}
function previouslyProcessed(record: ProcessedCommand | undefined, uid: string, fingerprint: string): CommandReceipt | null {
  if (!record) return null;
  requireRule(record.actorId === uid && record.fingerprint === fingerprint, 'COMMAND_CONFLICT', 'รหัสคำสั่งนี้ถูกใช้กับคำสั่งอื่นแล้ว');
  return record.receipt;
}
function initialRoom(reservation: RoomReservation): RoomCore {
  const room = {
    roomId: reservation.roomId, code: reservation.code, hostId: reservation.ownerId, revision: 1,
    lifecycle: 'LOBBY' as const, seatOrder: [reservation.ownerId],
    members: { [reservation.ownerId]: { displayName: reservation.displayName, avatarId: reservation.avatarId, ready: false,
      joinedAt: reservation.createdAt, controlClientId: reservation.clientId, sessionGeneration: 1 } },
    game: null, processed: {}, creation: {} as ProcessedCommand,
  } satisfies RoomCore;
  const record = { actorId: reservation.ownerId, fingerprint: reservation.fingerprint, receipt: receipt(room, reservation.commandId) };
  room.creation = record;
  (room.processed as Record<string, ProcessedCommand>)[reservation.commandId] = record;
  return room;
}

export function roomService(database: Database) {
  const repository = roomRepository(database);

  async function finishReservation(reservation: RoomReservation): Promise<RoomCore> {
    const room = await repository.ensure(reservation, () => initialRoom(reservation));
    requireRule(room.code === reservation.code && room.creation.actorId === reservation.ownerId
      && room.creation.fingerprint === reservation.fingerprint, 'COMMAND_CONFLICT', 'ข้อมูลการสร้างห้องไม่ตรงกัน');
    await repository.markReady(reservation);
    return room;
  }
  async function mutate(roomId: string, uid: string, commandId: string, fingerprint: string, transform: (room: RoomCore) => RoomCore) {
    const update = (input: RoomCore): RoomCore => {
      requireRule(Object.hasOwn(input.members, uid) || !(commandId in input.processed), 'NOT_MEMBER', 'ไม่ได้อยู่ในห้อง');
      if (previouslyProcessed(input.processed[commandId], uid, fingerprint)) return input;
      requireRule(Object.keys(input.processed).length < 4096, 'ROOM_COMMAND_LIMIT', 'ห้องมีคำสั่งมากเกินขอบเขต MVP');
      const next = transform(structuredClone(input));
      next.revision++;
      next.processed[commandId] = { actorId: uid, fingerprint, receipt: receipt(next, commandId) };
      return next;
    };
    const room = await repository.mutate(roomId, update);
    const result = previouslyProcessed(room.processed[commandId], uid, fingerprint);
    if (result) return result;
    // Re-evaluate outside the callback to report an authoritative rejection without side effects in it.
    update(room);
    throw new GameRuleError('RETRY_REQUIRED', 'กรุณาลองส่งคำสั่งเดิมอีกครั้ง');
  }

  return {
    async create(uid: string, request: CreateRoomRequest): Promise<CommandReceipt> {
      const fingerprint = hash({ uid, operation: 'create', request });
      const roomId = hash({ uid, commandId: request.commandId }).slice(0, 32);
      const existing = await repository.read(roomId);
      if (existing) {
        const result = previouslyProcessed(existing.creation, uid, fingerprint)!;
        await repository.touch(roomId, uid);
        return result;
      }
      const createdAt = Date.now();
      for (let attempt = 0; attempt < 32; attempt++) {
        const bytes = createHash('sha256').update(`${roomId}:${attempt}`).digest();
        const code = Array.from(bytes.subarray(0, 4), byte => ROOM_CODE_ALPHABET[byte % 32]).join('');
        const reservation = await repository.reserve({ roomId, code, ownerId: uid, commandId: request.commandId,
          clientId: request.clientId, displayName: request.displayName, avatarId: request.avatarId, createdAt, fingerprint, status: 'pending' });
        if (reservation.roomId !== roomId) continue;
        requireRule(reservation.ownerId === uid && reservation.fingerprint === fingerprint, 'COMMAND_CONFLICT', 'คำสั่งสร้างห้องเปลี่ยนแล้ว');
        const room = await finishReservation(reservation);
        return room.creation.receipt;
      }
      throw new GameRuleError('ROOM_CODE_BUSY', 'ยังจองรหัสห้องไม่ได้ กรุณาลองใหม่');
    },
    async join(uid: string, request: JoinRoomRequest): Promise<CommandReceipt> {
      const reservation = await repository.reservation(request.code);
      requireRule(reservation !== null, 'ROOM_NOT_FOUND', 'ไม่พบรหัสห้อง');
      await finishReservation(reservation);
      const fingerprint = hash({ uid, operation: 'join', request });
      const joinedAt = Date.now();
      return mutate(reservation.roomId, uid, request.commandId, fingerprint, room => {
        if (Object.hasOwn(room.members, uid)) return room; // A new tab reads first; control takeover is explicit.
        requireRule(room.lifecycle === 'LOBBY', 'ROOM_STARTED', 'เกมเริ่มแล้ว ไม่รับผู้เล่นใหม่');
        requireRule(room.seatOrder.length < 6, 'ROOM_FULL', 'ห้องเต็ม 6 คนแล้ว');
        room.seatOrder.push(uid);
        room.members[uid] = { displayName: request.displayName, avatarId: request.avatarId, ready: false,
          joinedAt, controlClientId: request.clientId, sessionGeneration: 1 };
        return room;
      });
    },
    async command(uid: string, request: RoomCommandRequest): Promise<CommandReceipt> {
      const fingerprint = hash({ uid, operation: 'command', request });
      const entropy = serverEntropy(); const newGameId = randomUUID(); const now = Date.now();
      const online = request.command.type === 'claimHost' ? await repository.online(request.roomId) : new Set<string>();
      return mutate(request.roomId, uid, request.commandId, fingerprint, room => {
        requireRule(Object.hasOwn(room.members, uid), 'NOT_MEMBER', 'ไม่ได้อยู่ในห้อง');
        const member = room.members[uid]; const command = request.command;
        requireRule(request.gameId === (room.game?.gameId ?? null), 'STALE_GAME', 'เกมเปลี่ยนแล้ว กรุณารอข้อมูลล่าสุด');
        requireRule(member.sessionGeneration === request.sessionGeneration, 'STALE_SESSION', 'แท็บอื่นรับสิทธิ์ควบคุมแล้ว');
        if (command.type === 'claimControl') {
          if (member.controlClientId !== request.clientId) { member.controlClientId = request.clientId; member.sessionGeneration++; }
          return room;
        }
        requireRule(member.controlClientId === request.clientId, 'CONTROL_REQUIRED', 'แท็บนี้อ่านได้ แต่ยังไม่มีสิทธิ์ควบคุม');
        const hostOnly = () => requireRule(room.hostId === uid, 'HOST_REQUIRED', 'เฉพาะผู้จัดห้องเท่านั้น');
        switch (command.type) {
          case 'setReady':
            requireRule(room.lifecycle === 'LOBBY', 'WRONG_PHASE', 'ตั้งพร้อมได้เฉพาะล็อบบี้'); member.ready = command.ready; break;
          case 'startGame':
            hostOnly(); requireRule(room.lifecycle === 'LOBBY', 'WRONG_PHASE', 'เกมเริ่มแล้ว');
            requireRule(room.seatOrder.length >= 4 && room.seatOrder.every(id => room.members[id].ready), 'NOT_READY', 'ต้องมีผู้เล่น 4–6 คนและทุกคนพร้อม');
            room.game = startGame(newGameId, room.seatOrder, entropy); room.lifecycle = 'PLAYING'; break;
          case 'claimHost': {
            requireRule(room.lifecycle === 'LOBBY', 'WRONG_PHASE', 'รับตำแหน่งผู้จัดห้องได้เฉพาะล็อบบี้');
            requireRule(!online.has(room.hostId) && now - room.members[room.hostId].joinedAt >= 10000, 'HOST_ONLINE', 'ผู้จัดห้องยังเชื่อมต่ออยู่หรือเพิ่งสร้างห้อง');
            requireRule(room.seatOrder.find(id => id !== room.hostId && online.has(id)) === uid, 'HOST_SUCCESSOR_REQUIRED', 'ให้สมาชิกที่เชื่อมต่อคนถัดไปตามที่นั่งรับตำแหน่ง');
            room.hostId = uid; break;
          }
          case 'abortGame':
            hostOnly(); requireRule(room.lifecycle === 'PLAYING', 'WRONG_PHASE', 'ยุติได้เฉพาะเกมที่กำลังเล่น'); room.lifecycle = 'ABORTED'; break;
          case 'requestRematch':
            hostOnly(); requireRule(room.lifecycle === 'FINISHED' || room.lifecycle === 'ABORTED', 'WRONG_PHASE', 'ต้องจบหรือยุติเกมก่อน');
            room.game = null; room.lifecycle = 'LOBBY'; room.processed = { [room.creation.receipt.commandId]: room.creation };
            for (const member of Object.values(room.members)) { member.ready = false; member.sessionGeneration++; }
            break;
          default:
            requireRule(room.lifecycle === 'PLAYING' && room.game !== null, 'WRONG_PHASE', 'ไม่มีเกมที่กำลังเล่น');
            room.game = applyGameCommand(room.game, command, { actorId: uid, commandId: request.commandId, entropy });
            if (room.game.phase === 'GAME_OVER') room.lifecycle = 'FINISHED';
        }
        return room;
      });
    },
    async resume(uid: string, roomId: string): Promise<CommandReceipt> {
      const room = await repository.touch(roomId, uid);
      requireRule(room !== null, 'ROOM_NOT_FOUND', 'ไม่พบห้อง');
      requireRule(Object.hasOwn(room.members, uid), 'NOT_MEMBER', 'ไม่ได้อยู่ในห้อง');
      return receipt(room, room.creation.receipt.commandId);
    },
  };
}
