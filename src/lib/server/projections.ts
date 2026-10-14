import 'server-only';
import type { DecisionRecord } from '../game/types';
import type { PrivateRoomView, PublicDecision, PublicRoomView } from '../shared/rooms';
import type { RoomCore, StoredRoom } from './room-model';
import { createRulesSnapshot } from '../game/config';
import { supplyCount } from '../game/engine';

export function projectDecision(record: DecisionRecord): PublicDecision {
  const result = record.result;
  const inspected = result.action === 'INSPECT';
  return {
    id: record.id, roundIndex: record.roundIndex, merchantId: record.merchantId, sheriffId: record.sheriffId,
    action: result.action, bagCount: result.bagCount, paymentKind: result.paymentKind, paymentAmount: result.paymentAmount,
    contrabandPassed: result.contrabandPassed,
    revealed: inspected ? result.revealed!.map(card => card.productId) : null,
    passed: inspected ? result.passed.map(card => card.productId) : null,
    confiscated: inspected ? result.confiscated.map(card => card.productId) : null,
  };
}
export function publicView(room: RoomCore): PublicRoomView {
  const game = room.game;
  const declarationsVisible = game !== null && !['PREPARE', 'PACK_AND_DECLARE'].includes(game.phase);
  return {
    rules: game?.rules ?? createRulesSnapshot(),
    roomId: room.roomId, code: room.code, hostId: room.hostId, revision: room.revision, lifecycle: room.lifecycle,
    gameId: game?.gameId ?? null, phase: game?.phase ?? 'LOBBY', roundIndex: game?.roundIndex ?? 0,
    totalRounds: game ? room.seatOrder.length * game.rules.sheriffTurnsPerPlayer : 0, sheriffId: game?.sheriffId ?? null,
    players: room.seatOrder.map(id => ({
      id, displayName: room.members[id].displayName, avatarId: room.members[id].avatarId, ready: room.members[id].ready,
      prepared: game?.players[id].prepared ?? false, bagLocked: game?.players[id].declaration !== null && game !== null,
      declaration: declarationsVisible ? game!.players[id].declaration : null,
      offer: declarationsVisible ? game!.players[id].offer : null,
      decisionId: game?.players[id].decisionId ?? null, cash: game?.finances.cash[id] ?? null,
    })),
    debts: game?.finances.debts ?? [], selectedMerchantId: game?.selectedMerchantId ?? null,
    result: game?.currentResolution ? projectDecision(game.currentResolution) : null,
    history: game?.history.map(projectDecision) ?? [], scores: room.lifecycle === 'FINISHED' ? game?.scores ?? null : null,
    supplyCount: game ? supplyCount(game) : null,
  };
}
export function privateView(room: RoomCore, uid: string): PrivateRoomView {
  const member = room.members[uid]; const player = room.game?.players[uid];
  return {
    revision: room.revision, playerId: uid, controlClientId: member.controlClientId, sessionGeneration: member.sessionGeneration,
    hand: player?.hand ?? [], bag: player?.bag ?? [], stash: player?.stash ?? [], declaration: player?.declaration ?? null,
    offer: player?.offer ?? { submitted: false, amount: 0, version: 0 }, prepared: player?.prepared ?? false,
    goodsValue: player?.stash.reduce((value, card) => value + room.game!.rules.products[card.productId].value, 0) ?? 0,
  };
}
/** JSON strings preserve empty arrays/nulls that RTDB otherwise removes; views still contain only authorized fields. */
export function storeRoom(room: RoomCore): StoredRoom {
  return {
    authoritative: { snapshot: JSON.stringify(room) },
    members: Object.fromEntries(room.seatOrder.map(id => [id, true])),
    views: { public: JSON.stringify(publicView(room)), private: Object.fromEntries(room.seatOrder.map(id => [id, JSON.stringify(privateView(room, id))])) },
  };
}
export function loadRoom(stored: StoredRoom): RoomCore {
  return JSON.parse(stored.authoritative.snapshot) as RoomCore;
}
