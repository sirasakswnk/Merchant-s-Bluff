import { createDeck, createRulesSnapshot } from './config';
import { requireAmount, requireRule } from './errors';
import { assertFinancialState, cashTotal, createFinancialState } from './ledger';
import { resolveBag } from './resolution';
import { scoreGame } from './scoring';
import type { CardInstance, DecisionRecord, GameCommandContext, GameState, GameplayCommand, PlayerGameState, RulesSnapshot } from './types';

type MutablePlayer = { -readonly [Key in keyof PlayerGameState]: PlayerGameState[Key] };
type WorkingGame = { -readonly [Key in keyof Omit<GameState, 'deck' | 'discard' | 'players' | 'history'>]: GameState[Key] } & {
  deck: CardInstance[]; discard: CardInstance[]; players: Record<string, MutablePlayer>; history: DecisionRecord[];
};

function sampler(entropy: readonly number[]): () => number {
  let cursor = 0;
  return () => {
    const sample = entropy[cursor++];
    requireRule(typeof sample === 'number' && Number.isFinite(sample) && sample >= 0 && sample < 1,
      'INVALID_ENTROPY', 'ข้อมูลสุ่มฝั่งเซิร์ฟเวอร์ไม่เพียงพอ');
    return sample;
  };
}

function shuffle(cards: readonly CardInstance[], random: () => number): CardInstance[] {
  const shuffled = cards.map(card => ({ ...card }));
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function merchants(state: GameState): string[] {
  return state.seatOrder.filter(id => id !== state.sheriffId);
}

function draw(state: WorkingGame, count: number, random: () => number): CardInstance[] {
  requireRule(state.deck.length + state.discard.length >= count, 'INSUFFICIENT_CARDS', 'ไพ่ในกองจั่วและกองทิ้งไม่พอ ไม่สามารถนำไพ่ในคลังกลับมาจั่วได้');
  const drawn: CardInstance[] = [];
  while (drawn.length < count) {
    if (state.deck.length === 0) {
      state.deck = shuffle(state.discard, random);
      state.discard = [];
    }
    drawn.push(state.deck.shift()!);
  }
  return drawn;
}

export function assertGameState(state: GameState): void {
  const ids = state.seatOrder;
  requireRule(ids.length >= state.rules.minPlayers && ids.length <= state.rules.maxPlayers && new Set(ids).size === ids.length,
    'INVALID_PLAYERS', 'จำนวนผู้เล่นต้องเป็น 4–6 คนและไม่ซ้ำ');
  requireRule(Object.keys(state.players).length === ids.length && ids.every(id => Object.hasOwn(state.players, id)),
    'INVALID_PLAYERS', 'ที่นั่งและสถานะผู้เล่นไม่ตรงกัน');
  requireRule(Object.keys(state.finances.cash).length === ids.length && ids.every(id => Object.hasOwn(state.finances.cash, id)),
    'INVALID_PLAYERS', 'บัญชีและที่นั่งไม่ตรงกัน');
  requireRule(Number.isSafeInteger(state.roundIndex) && state.roundIndex >= 1 && state.roundIndex <= ids.length * state.rules.sheriffTurnsPerPlayer,
    'INVALID_ROUND', 'รอบไม่ถูกต้อง');
  requireRule(Number.isSafeInteger(state.sheriffStartSeat) && state.sheriffStartSeat >= 0 && state.sheriffStartSeat < ids.length
    && state.sheriffId === ids[(state.sheriffStartSeat + state.roundIndex - 1) % ids.length], 'INVALID_SHERIFF', 'ลำดับนายด่านไม่ถูกต้อง');
  const expected = createDeck(state.rules);
  const zones = [...state.deck, ...state.discard, ...ids.flatMap(id => [
    ...state.players[id].hand, ...state.players[id].bag, ...state.players[id].stash,
  ])];
  const catalog = new Map(expected.map(card => [card.instanceId, card.productId]));
  requireRule(expected.length === state.rules.totalCards && zones.length === state.rules.totalCards
    && new Set(zones.map(card => card.instanceId)).size === zones.length
    && zones.every(card => catalog.get(card.instanceId) === card.productId), 'CARD_CONSERVATION', `ไพ่ต้องครบ ${state.rules.totalCards} ใบตามกติกาของเกมนี้และไม่ซ้ำหรือหาย`);
  for (const id of ids) {
    const player = state.players[id];
    requireRule(player.hand.length <= state.rules.handSize && player.bag.length <= state.rules.maxBagSize,
      'INVALID_CARDS', 'จำนวนไพ่ของผู้เล่นไม่ถูกต้อง');
    requireRule(id !== state.sheriffId || player.bag.length === 0, 'INVALID_SHERIFF', 'นายด่านจัดกระเป๋าไม่ได้');
    if (player.bag.length > 0) {
      requireRule(player.declaration !== null && player.declaration.count === player.bag.length,
        'INVALID_DECLARATION', 'จำนวนคำแจ้งต้องมาจากกระเป๋าจริง');
    }
    requireAmount(player.offer.amount);
    requireRule(Number.isSafeInteger(player.offer.version) && player.offer.version >= 0, 'INVALID_OFFER', 'เวอร์ชันข้อเสนอไม่ถูกต้อง');
    requireRule(player.decisionId !== null || !player.offer.submitted || player.offer.amount <= state.finances.cash[id],
      'INVALID_OFFER', 'ข้อเสนอที่จ่ายไม่ได้ต้องยืนยันใหม่');
  }
  assertFinancialState(state.finances);
  requireRule(cashTotal(state.finances) === ids.length * state.rules.startingCash, 'CASH_CONSERVATION', 'เงินสดรวมต้องคงที่');
  requireRule(state.phase !== 'GAME_OVER' || state.scores !== null, 'INVALID_PHASE', 'เกมจบต้องมีคะแนน');
  requireRule(state.phase !== 'RESOLUTION' || state.currentResolution !== null, 'INVALID_PHASE', 'เฟสผลต้องมีผลที่ตัดสินแล้ว');
}

/**
 * Cards in the shared supply (draw pile + discard). Secret exchanges draw then discard the same number,
 * so this total never reveals how many cards one merchant exchanged; separate pile sizes would.
 */
export function supplyCount(state: GameState): number { return state.deck.length + state.discard.length; }
export function startGame(gameId: string, seatOrder: readonly string[], entropy: readonly number[], rules: RulesSnapshot = createRulesSnapshot()): GameState {
  requireRule(gameId.length > 0 && seatOrder.length >= rules.minPlayers && seatOrder.length <= rules.maxPlayers
    && new Set(seatOrder).size === seatOrder.length && seatOrder.every(id => id.length > 0), 'INVALID_PLAYERS', 'เริ่มเกมต้องมีผู้เล่น 4–6 คนไม่ซ้ำ');
  const random = sampler(entropy);
  const sheriffStartSeat = Math.floor(random() * seatOrder.length);
  const state: WorkingGame = {
    gameId, rules: structuredClone(rules), seatOrder: [...seatOrder], sheriffStartSeat,
    sheriffId: seatOrder[sheriffStartSeat], roundIndex: 1, phase: 'PREPARE', revision: 1,
    deck: shuffle(createDeck(rules), random), discard: [], players: {},
    finances: createFinancialState(seatOrder, rules.startingCash), selectedMerchantId: null,
    currentResolution: null, history: [], scores: null,
  };
  state.players = Object.fromEntries(seatOrder.map(id => [id, {
    hand: draw(state, rules.handSize, random), bag: [], stash: [], prepared: false,
    declaration: null, offer: { submitted: false, amount: 0, version: 0 }, decisionId: null,
  }]));
  assertGameState(state);
  return state;
}

function selectedCards(player: MutablePlayer, cardIds: readonly string[]): CardInstance[] {
  requireRule(new Set(cardIds).size === cardIds.length, 'DUPLICATE_CARDS', 'เลือกไพ่ซ้ำไม่ได้');
  const chosen = cardIds.map(id => player.hand.find(card => card.instanceId === id));
  requireRule(chosen.every(card => card !== undefined), 'CARD_NOT_OWNED', 'ต้องเลือกไพ่ในมือของตัวเอง');
  return chosen as CardInstance[];
}

/** Retry-safe given the same state, command and fixed entropy; M2 owns authentication/dedup. */
export function applyGameCommand(input: GameState, command: GameplayCommand, context: GameCommandContext): GameState {
  assertGameState(input);
  requireRule(Object.hasOwn(input.players, context.actorId), 'NOT_MEMBER', 'ไม่ได้อยู่ในเกม');
  requireRule(context.commandId.length > 0, 'INVALID_COMMAND', 'ต้องมีรหัสคำสั่ง');
  requireRule(command.roundIndex === input.roundIndex, 'STALE_ROUND', 'รอบเกมเปลี่ยนแล้ว');
  const state = structuredClone(input) as WorkingGame;
  const player = state.players[context.actorId];
  const isSheriff = context.actorId === state.sheriffId;
  const random = sampler(context.entropy);
  const requireSheriff = () => requireRule(isSheriff, 'SHERIFF_REQUIRED', 'เฉพาะนายด่านเท่านั้น');
  const requireMerchant = () => requireRule(!isSheriff, 'MERCHANT_REQUIRED', 'นายด่านขนสินค้าไม่ได้');
  const requirePhase = (phase: GameState['phase']) => requireRule(state.phase === phase, 'WRONG_PHASE', 'คำสั่งไม่ตรงกับเฟสปัจจุบัน');
  switch (command.type) {
    case 'prepareGoods': {
      requirePhase('PREPARE'); requireMerchant();
      requireRule(!player.prepared, 'ALREADY_PREPARED', 'เปลี่ยนไพ่ได้ครั้งเดียวต่อรอบ');
      requireRule(command.cardIds.length <= state.rules.maxExchange, 'INVALID_EXCHANGE', 'เปลี่ยนได้ไม่เกิน 3 ใบ');
      const discarded = selectedCards(player, command.cardIds);
      // Current discards are unavailable until replacement drawing has completed.
      const replacements = draw(state, discarded.length, random);
      player.hand = [...player.hand.filter(card => !command.cardIds.includes(card.instanceId)), ...replacements];
      state.discard.push(...discarded);
      player.prepared = true;
      if (merchants(state).every(id => state.players[id].prepared)) state.phase = 'PACK_AND_DECLARE';
      break;
    }
    case 'lockBag': {
      requirePhase('PACK_AND_DECLARE'); requireMerchant();
      requireRule(player.declaration === null, 'BAG_LOCKED', 'ปิดกระเป๋าแล้วแก้ไม่ได้');
      requireRule(command.cardIds.length >= state.rules.minBagSize && command.cardIds.length <= state.rules.maxBagSize,
        'INVALID_BAG_SIZE', 'กระเป๋าต้องมี 1–5 ใบ');
      requireRule(Object.hasOwn(state.rules.products, command.declaredProductId)
        && state.rules.products[command.declaredProductId].category === 'legal', 'INVALID_DECLARATION', 'แจ้งสินค้าถูกกฎหมายชนิดเดียว');
      player.bag = selectedCards(player, command.cardIds);
      player.hand = player.hand.filter(card => !command.cardIds.includes(card.instanceId));
      player.declaration = { productId: command.declaredProductId, count: player.bag.length };
      if (merchants(state).every(id => state.players[id].declaration !== null)) state.phase = 'NEGOTIATE';
      break;
    }
    case 'setOffer': {
      requireRule(state.phase === 'NEGOTIATE' || state.phase === 'RESOLUTION', 'WRONG_PHASE', 'ยังไม่อยู่ในช่วงเจรจา'); requireMerchant();
      requireRule(player.decisionId === null, 'ALREADY_RESOLVED', 'ข้อเสนอล็อกหลังการตัดสิน');
      requireRule(command.expectedOfferVersion === player.offer.version, 'STALE_OFFER', 'ข้อเสนอเปลี่ยนแล้ว');
      requireAmount(command.amount);
      requireRule(command.amount <= state.finances.cash[context.actorId], 'INSUFFICIENT_CASH', 'ห้ามกู้เพื่อเสนอเงิน');
      player.offer = { submitted: true, amount: command.amount, version: player.offer.version + 1 };
      break;
    }
    case 'selectMerchant': {
      requirePhase('NEGOTIATE'); requireSheriff();
      requireRule(merchants(state).includes(command.merchantId) && state.players[command.merchantId].decisionId === null,
        'INVALID_TARGET', 'เลือกพ่อค้าที่ยังไม่ถูกตัดสิน');
      state.selectedMerchantId = command.merchantId;
      break;
    }
    case 'resolveMerchant': {
      requirePhase('NEGOTIATE'); requireSheriff();
      requireRule(command.merchantId === state.selectedMerchantId && merchants(state).includes(command.merchantId),
        'INVALID_TARGET', 'ต้องเลือกพ่อค้าคนนี้ก่อนตัดสิน');
      const merchant = state.players[command.merchantId];
      requireRule(merchant.decisionId === null, 'ALREADY_RESOLVED', 'ตัดสินกระเป๋าได้ครั้งเดียว');
      requireRule(command.expectedOfferVersion === merchant.offer.version, 'STALE_OFFER', 'ข้อเสนอเปลี่ยนแล้ว กรุณายืนยันยอดล่าสุด');
      requireRule(merchant.declaration !== null, 'INVALID_DECLARATION', 'ยังไม่แจ้งสินค้า');
      const { finances, ...result } = resolveBag({
        cards: merchant.bag, declaredProductId: merchant.declaration.productId, action: command.action,
        merchantId: command.merchantId, sheriffId: state.sheriffId, offer: merchant.offer, finances: state.finances, rules: state.rules,
      });
      const record: DecisionRecord = { id: context.commandId, roundIndex: state.roundIndex,
        merchantId: command.merchantId, sheriffId: state.sheriffId, acceptedOfferVersion: merchant.offer.version, result };
      merchant.stash = [...merchant.stash, ...result.passed];
      merchant.bag = []; merchant.decisionId = record.id;
      state.discard.push(...result.confiscated);
      state.finances = finances;
      for (const id of merchants(state)) {
        const other = state.players[id];
        if (other.decisionId === null && other.offer.submitted && other.offer.amount > finances.cash[id]) {
          other.offer = { submitted: false, amount: 0, version: other.offer.version + 1 };
        }
      }
      state.history.push(record); state.currentResolution = record; state.phase = 'RESOLUTION';
      break;
    }
    case 'acknowledgeResolution': {
      requirePhase('RESOLUTION'); requireSheriff();
      requireRule(command.resolutionId === state.currentResolution?.id, 'STALE_RESULT', 'ผลการตัดสินเปลี่ยนแล้ว');
      state.currentResolution = null; state.selectedMerchantId = null;
      state.phase = merchants(state).every(id => state.players[id].decisionId !== null) ? 'ROUND_SUMMARY' : 'NEGOTIATE';
      break;
    }
    case 'endRound': {
      requirePhase('ROUND_SUMMARY'); requireSheriff();
      if (state.roundIndex === state.seatOrder.length * state.rules.sheriffTurnsPerPlayer) {
        state.phase = 'GAME_OVER';
        state.scores = scoreGame(state.seatOrder.map(id => ({ id, stash: state.players[id].stash })), state.finances, state.rules);
      } else {
        state.roundIndex++;
        state.sheriffId = state.seatOrder[(state.sheriffStartSeat + state.roundIndex - 1) % state.seatOrder.length];
        for (const id of state.seatOrder) {
          const next = state.players[id];
          next.prepared = false; next.declaration = null; next.decisionId = null;
          next.offer = { submitted: false, amount: 0, version: 0 };
          if (id !== state.sheriffId) next.hand = [...next.hand, ...draw(state, state.rules.handSize - next.hand.length, random)];
        }
        state.phase = 'PREPARE';
      }
      break;
    }
    default: requireRule(false, 'INVALID_COMMAND', 'ไม่รู้จักคำสั่งเกม');
  }
  state.revision++;
  assertGameState(state);
  return state;
}
