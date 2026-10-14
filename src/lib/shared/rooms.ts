import { z } from 'zod';
import type { CardInstance, Declaration, Debt, GameScores, Offer, Phase, ProductId, RulesSnapshot } from '../game/types';

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const profileSchema = z.object({ displayName: z.string().trim().min(1).max(16), avatarId: z.number().int().min(0).max(7) });
const identifiers = { commandId: z.uuid(), clientId: z.uuid() };
export const createRoomSchema = profileSchema.extend(identifiers).strict();
export const joinRoomSchema = createRoomSchema.extend({ code: z.string().trim().toUpperCase().regex(/^[A-HJ-NP-Z2-9]{4}$/) }).strict();
const roundIndex = z.number().int().min(1).max(12);
const cardIds = z.array(z.string().min(1).max(48)).max(6);
const offerVersion = z.number().int().nonnegative();
export const roomActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('setReady'), ready: z.boolean() }).strict(),
  z.object({ type: z.literal('startGame') }).strict(),
  z.object({ type: z.literal('claimControl') }).strict(),
  z.object({ type: z.literal('claimHost') }).strict(),
  z.object({ type: z.literal('requestRematch') }).strict(),
  z.object({ type: z.literal('abortGame') }).strict(),
  z.object({ type: z.literal('prepareGoods'), roundIndex, cardIds }).strict(),
  z.object({ type: z.literal('lockBag'), roundIndex, cardIds, declaredProductId: z.enum(['apple', 'bread', 'cheese', 'cloth']) }).strict(),
  z.object({ type: z.literal('setOffer'), roundIndex, amount: z.number().int().nonnegative().max(300), expectedOfferVersion: offerVersion }).strict(),
  z.object({ type: z.literal('selectMerchant'), roundIndex, merchantId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/) }).strict(),
  z.object({ type: z.literal('resolveMerchant'), roundIndex, merchantId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
    action: z.enum(['PASS', 'INSPECT']), expectedOfferVersion: offerVersion }).strict(),
  z.object({ type: z.literal('acknowledgeResolution'), roundIndex, resolutionId: z.uuid() }).strict(),
  z.object({ type: z.literal('endRound'), roundIndex }).strict(),
]);
export const roomCommandSchema = z.object({ ...identifiers,
  roomId: z.string().regex(/^[a-f0-9]{32}$/), sessionGeneration: z.number().int().positive(),
  gameId: z.uuid().nullable(), command: roomActionSchema,
}).strict();
export type CreateRoomRequest = z.infer<typeof createRoomSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
export type RoomCommandRequest = z.infer<typeof roomCommandSchema>;
export interface CommandReceipt {
  readonly commandId: string; readonly roomId: string; readonly code: string; readonly revision: number; readonly gameId: string | null;
}
export interface PublicDecision {
  readonly id: string; readonly roundIndex: number; readonly merchantId: string; readonly sheriffId: string;
  readonly action: 'PASS' | 'INSPECT'; readonly bagCount: number; readonly paymentKind: string;
  readonly paymentAmount: number; readonly contrabandPassed: boolean;
  readonly revealed: readonly ProductId[] | null; readonly passed: readonly ProductId[] | null; readonly confiscated: readonly ProductId[] | null;
}
export interface PublicPlayer {
  readonly id: string; readonly displayName: string; readonly avatarId: number; readonly ready: boolean;
  readonly prepared: boolean; readonly bagLocked: boolean; readonly declaration: Declaration | null;
  readonly offer: Offer | null; readonly decisionId: string | null; readonly cash: number | null;
}
export interface PublicRoomView {
  readonly rules: RulesSnapshot;
  readonly revision: number; readonly roomId: string; readonly code: string; readonly hostId: string;
  readonly lifecycle: 'LOBBY' | 'PLAYING' | 'FINISHED' | 'ABORTED'; readonly phase: Phase;
  readonly gameId: string | null; readonly roundIndex: number; readonly totalRounds: number; readonly sheriffId: string | null;
  readonly players: readonly PublicPlayer[]; readonly debts: readonly Debt[];
  readonly selectedMerchantId: string | null; readonly result: PublicDecision | null;
  readonly history: readonly PublicDecision[]; readonly scores: GameScores | null;
  /** Draw pile + discard as one number (see supplyCount). Views stored before this field existed omit it. */
  readonly supplyCount?: number | null;
}
export interface PrivateRoomView {
  readonly revision: number; readonly playerId: string; readonly controlClientId: string; readonly sessionGeneration: number;
  readonly hand: readonly CardInstance[]; readonly bag: readonly CardInstance[]; readonly stash: readonly CardInstance[];
  readonly declaration: Declaration | null; readonly offer: Offer; readonly prepared: boolean;
  readonly goodsValue: number;
}
