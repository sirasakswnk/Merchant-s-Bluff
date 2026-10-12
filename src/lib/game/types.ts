export type LegalProductId = 'apple' | 'bread' | 'cheese' | 'cloth';
export type ContrabandProductId = 'moonshine' | 'crossbow' | 'cannabis_leaf';
export type ProductId = LegalProductId | ContrabandProductId;
export type PlayerId = string;
export type GameId = string;
export type Phase = 'LOBBY' | 'PREPARE' | 'PACK_AND_DECLARE' | 'NEGOTIATE' | 'RESOLUTION' | 'ROUND_SUMMARY' | 'GAME_OVER';
export type PlayerCount = 4 | 5 | 6;
export interface ProductConfig {
  readonly id: ProductId; readonly name: string; readonly category: 'legal' | 'contraband';
  readonly value: number; readonly compensation: number; readonly fine: number; readonly count: number;
}
export interface CardInstance { readonly instanceId: string; readonly productId: ProductId }
export interface RulesSnapshot {
  readonly rulesVersion: string; readonly products: Readonly<Record<ProductId, ProductConfig>>;
  readonly minPlayers: 4; readonly maxPlayers: 6; readonly startingCash: 50; readonly handSize: 6;
  readonly maxExchange: 3; readonly minBagSize: 1; readonly maxBagSize: 5;
  readonly sheriffTurnsPerPlayer: 2; readonly legalMajorityBonus: 8;
  /** Stored per game: existing rules 0.1 snapshots retain their 120-card deck. */
  readonly totalCards: number;
}
export interface Offer { readonly submitted: boolean; readonly amount: number; readonly version: number }
export interface Declaration { readonly productId: LegalProductId; readonly count: number }
export interface Debt {
  readonly id: string; readonly debtor: PlayerId; readonly creditor: PlayerId;
  readonly outstanding: number; readonly createdOrder: number;
}
export type PaymentKind = 'BRIBE' | 'COMPENSATION' | 'FINE';
export interface LedgerEntry {
  readonly order: number; readonly from: PlayerId; readonly to: PlayerId; readonly amount: number;
  readonly kind: PaymentKind | 'DEBT_PAYMENT'; readonly debtId: string | null;
}
export interface FinancialState {
  readonly cash: Readonly<Record<PlayerId, number>>;
  readonly debts: readonly Debt[];
  readonly ledger: readonly LedgerEntry[];
  /** Server-assigned sequence shared by debt creation and actual transfers. */
  readonly nextOrder: number;
}
export interface PaymentOutcome {
  readonly state: FinancialState;
  readonly paid: number;
  /** Initial shortfall, before any subsequent FIFO settlement in this transaction. */
  readonly debtCreated: number;
}
/** Authoritative-only: contains secret card IDs; never use as a public/API response. */
export interface BagResolution {
  readonly action: 'PASS' | 'INSPECT'; readonly bagCount: number;
  readonly passed: readonly CardInstance[]; readonly confiscated: readonly CardInstance[];
  readonly revealed: readonly CardInstance[] | null; readonly contrabandPassed: boolean;
  readonly paymentKind: PaymentKind; readonly paymentAmount: number;
  readonly finances: FinancialState;
}
export interface ScorePlayer { readonly id: PlayerId; readonly stash: readonly CardInstance[] }
export interface ScoreRow {
  readonly playerId: PlayerId; readonly rank: number; readonly cash: number;
  readonly counts: Readonly<Record<ProductId, number>>; readonly goodsValue: number;
  readonly bonusByProduct: Readonly<Record<LegalProductId, number>>; readonly bonus: number;
  readonly receivable: number; readonly debt: number; readonly legalCount: number; readonly total: number;
}
export interface GameScores { readonly standings: readonly ScoreRow[]; readonly winners: readonly PlayerId[] }
export interface CommandEnvelope<TPayload> {
  readonly commandId: string; readonly gameId: GameId; readonly sessionGeneration: number; readonly payload: TPayload;
}
export interface PlayerGameState {
  readonly hand: readonly CardInstance[]; readonly bag: readonly CardInstance[]; readonly stash: readonly CardInstance[];
  readonly prepared: boolean; readonly declaration: Declaration | null; readonly offer: Offer;
  readonly decisionId: string | null;
}
/** Secret authoritative event. M2 must project it before publishing. */
export interface DecisionRecord {
  readonly id: string; readonly roundIndex: number; readonly merchantId: PlayerId; readonly sheriffId: PlayerId;
  readonly acceptedOfferVersion: number; readonly result: Omit<BagResolution, 'finances'>;
}
export interface GameState {
  readonly gameId: GameId; readonly rules: RulesSnapshot; readonly seatOrder: readonly PlayerId[];
  readonly sheriffStartSeat: number; readonly sheriffId: PlayerId; readonly roundIndex: number;
  readonly phase: Exclude<Phase, 'LOBBY'>; readonly revision: number;
  readonly deck: readonly CardInstance[]; readonly discard: readonly CardInstance[];
  readonly players: Readonly<Record<PlayerId, PlayerGameState>>; readonly finances: FinancialState;
  readonly selectedMerchantId: PlayerId | null; readonly currentResolution: DecisionRecord | null;
  readonly history: readonly DecisionRecord[]; readonly scores: GameScores | null;
}
export type GameplayCommand = { readonly roundIndex: number } & (
  | { readonly type: 'prepareGoods'; readonly cardIds: readonly string[] }
  | { readonly type: 'lockBag'; readonly cardIds: readonly string[]; readonly declaredProductId: LegalProductId }
  | { readonly type: 'setOffer'; readonly amount: number; readonly expectedOfferVersion: number }
  | { readonly type: 'selectMerchant'; readonly merchantId: PlayerId }
  | { readonly type: 'resolveMerchant'; readonly merchantId: PlayerId; readonly action: 'PASS' | 'INSPECT'; readonly expectedOfferVersion: number }
  | { readonly type: 'acknowledgeResolution'; readonly resolutionId: string }
  | { readonly type: 'endRound' }
);
export interface GameCommandContext {
  readonly actorId: PlayerId; readonly commandId: string;
  /** Fixed server-generated samples, created before a transaction; test seeds stay in fixtures. */
  readonly entropy: readonly number[];
}
