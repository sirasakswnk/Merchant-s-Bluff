import { describe, expect, it } from 'vitest';
import { createDeck, RULES } from '../../src/lib/game/config';
import { applyGameCommand, assertGameState, startGame } from '../../src/lib/game/engine';
import { GameRuleError } from '../../src/lib/game/errors';
import { cashTotal } from '../../src/lib/game/ledger';
import type { GameState, GameplayCommand, PlayerGameState, ProductId } from '../../src/lib/game/types';
import { arrangeHand, gameFixture, negotiate, prepareAll, seededEntropy, step, type CommandInput } from '../fixtures/game';
import { LEGACY_RULES } from '../fixtures/legacy-rules';

// The distributive alias keeps the command fields type-checked in tests as well as production.
function execute(state: GameState, actor: string, command: CommandInput): GameState {
  return step(state, actor, command);
}
function merchantIds(state: GameState) { return state.seatOrder.filter(id => id !== state.sheriffId); }
function submitAll(state: GameState, amount = 0): GameState {
  for (const id of merchantIds(state)) state = execute(state, id, {
    type: 'setOffer', amount: Math.min(amount, state.finances.cash[id]), expectedOfferVersion: state.players[id].offer.version,
  });
  return state;
}
function decide(state: GameState, merchantId: string, action: 'PASS' | 'INSPECT'): GameState {
  state = execute(state, state.sheriffId, { type: 'selectMerchant', merchantId });
  return execute(state, state.sheriffId, { type: 'resolveMerchant', merchantId, action, expectedOfferVersion: state.players[merchantId].offer.version });
}

describe('dealing, phases and validation', () => {
  it.each([4, 5, 6])('deals six cards and 50 coins to %i players, including the first sheriff', count => {
    const state = gameFixture(count);
    expect(state.phase).toBe('PREPARE');
    expect(state.seatOrder.every(id => state.players[id].hand.length === 6 && state.finances.cash[id] === 50)).toBe(true);
    expect(state.deck).toHaveLength(360 - count * 6);
    expect(() => assertGameState(state)).not.toThrow();
  });

  it('requires 4–6 unique seats and valid fixed entropy', () => {
    expect(() => gameFixture(3)).toThrow(GameRuleError);
    expect(() => gameFixture(7)).toThrow(GameRuleError);
    expect(() => startGame('x', ['a', 'b', 'c', 'c'], seededEntropy(1))).toThrow(GameRuleError);
    expect(() => startGame('x', ['a', 'b', 'c', 'd'], [1])).toThrow(GameRuleError);
    expect(() => startGame('x', ['a', 'b', 'c', 'd'], [])).toThrow(GameRuleError);
  });

  it('waits for all merchants, exchanges once, and leaves the sheriff hand unchanged', () => {
    let state = gameFixture();
    const sheriffHand = structuredClone(state.players[state.sheriffId].hand);
    const ids = merchantIds(state);
    const discarded = state.players[ids[0]].hand.slice(0, 3).map(card => card.instanceId);
    state = execute(state, ids[0], { type: 'prepareGoods', cardIds: discarded });
    expect(state.phase).toBe('PREPARE');
    expect(state.players[ids[0]].hand).toHaveLength(6);
    expect(state.players[ids[0]].hand.some(card => discarded.includes(card.instanceId))).toBe(false);
    expect(() => execute(state, ids[0], { type: 'prepareGoods', cardIds: [] })).toThrow(GameRuleError);
    expect(() => execute(state, state.sheriffId, { type: 'prepareGoods', cardIds: [] })).toThrow(GameRuleError);
    for (const id of ids.slice(1)) state = execute(state, id, { type: 'prepareGoods', cardIds: [] });
    expect(state.phase).toBe('PACK_AND_DECLARE');
    expect(state.players[state.sheriffId].hand).toEqual(sheriffHand);
  });

  it('rejects more than 3 exchanges, duplicates and cards from another player', () => {
    const state = gameFixture(); const id = merchantIds(state)[0]; const own = state.players[id].hand;
    expect(() => execute(state, id, { type: 'prepareGoods', cardIds: own.slice(0, 4).map(card => card.instanceId) })).toThrow(GameRuleError);
    expect(() => execute(state, id, { type: 'prepareGoods', cardIds: [own[0].instanceId, own[0].instanceId] })).toThrow(GameRuleError);
    expect(() => execute(state, id, { type: 'prepareGoods', cardIds: [state.players[state.sheriffId].hand[0].instanceId] })).toThrow(GameRuleError);
  });

  it('refills only from discard when deck is empty, excluding the current exchange', () => {
    const input = gameFixture(); const state = structuredClone(input);
    const mutable = state as { deck: typeof state.deck; discard: typeof state.discard };
    mutable.discard = state.deck; mutable.deck = [];
    const id = merchantIds(state)[0];
    const before = state.players[id].hand.slice(0, 3).map(card => card.instanceId);
    const result = execute(state, id, { type: 'prepareGoods', cardIds: before });
    expect(result.players[id].hand.some(card => before.includes(card.instanceId))).toBe(false);
    expect(result.discard.map(card => card.instanceId)).toEqual(before);
    expect(result.deck).toHaveLength(333);
    expect(() => assertGameState(result)).not.toThrow();
  });

  it('keeps state unchanged when available draw/discard cannot cover an exchange', () => {
    const state = structuredClone(gameFixture()); const id = merchantIds(state)[0];
    const mutable = state as { deck: typeof state.deck; players: Record<string, PlayerGameState> };
    mutable.players[state.sheriffId] = { ...state.players[state.sheriffId], stash: state.deck };
    mutable.deck = [];
    const before = structuredClone(state);
    expect(() => execute(state, id, { type: 'prepareGoods', cardIds: [state.players[id].hand[0].instanceId] })).toThrow(GameRuleError);
    expect(state).toEqual(before);
    expect(() => assertGameState(state)).not.toThrow();
  });

  it.each([0, 6])('rejects bags with %i cards', size => {
    const state = prepareAll(gameFixture()); const id = merchantIds(state)[0];
    expect(() => execute(state, id, { type: 'lockBag', cardIds: state.players[id].hand.slice(0, size).map(card => card.instanceId), declaredProductId: 'apple' })).toThrow(GameRuleError);
  });

  it.each([1, 5])('locks %i cards atomically and derives the declared count', size => {
    let state = prepareAll(gameFixture()); const ids = merchantIds(state); const first = ids[0];
    state = execute(state, first, { type: 'lockBag', cardIds: state.players[first].hand.slice(0, size).map(card => card.instanceId), declaredProductId: 'cloth' });
    expect(state.players[first].hand).toHaveLength(6 - size);
    expect(state.players[first].declaration).toEqual({ productId: 'cloth', count: size });
    expect(state.phase).toBe('PACK_AND_DECLARE');
    expect(() => execute(state, first, { type: 'lockBag', cardIds: [], declaredProductId: 'apple' })).toThrow(GameRuleError);
    for (const id of ids.slice(1)) state = execute(state, id, { type: 'lockBag', cardIds: [state.players[id].hand[0].instanceId], declaredProductId: 'apple' });
    expect(state.phase).toBe('NEGOTIATE');
  });

  it('rejects invalid declarations, foreign cards, non-member and stale-round commands without mutation', () => {
    const state = prepareAll(gameFixture()); const id = merchantIds(state)[0]; const before = structuredClone(state);
    expect(() => execute(state, id, { type: 'lockBag', cardIds: [state.players[id].hand[0].instanceId], declaredProductId: 'moonshine' as 'apple' })).toThrow(GameRuleError);
    expect(() => execute(state, id, { type: 'lockBag', cardIds: [state.players[state.sheriffId].hand[0].instanceId], declaredProductId: 'apple' })).toThrow(GameRuleError);
    const command: GameplayCommand = { type: 'endRound', roundIndex: 2 };
    expect(() => applyGameCommand(state, command, { actorId: id, commandId: 'stale', entropy: [] })).toThrow(GameRuleError);
    expect(() => execute(state, 'intruder', { type: 'endRound' })).toThrow(GameRuleError);
    expect(state).toEqual(before);
  });

  it('detects duplicate, missing, forged and changed-product cards', () => {
    for (const kind of ['duplicate', 'missing', 'forged', 'product']) {
      const state = structuredClone(gameFixture()); const deck = state.deck as { instanceId: string; productId: ProductId }[];
      if (kind === 'duplicate') deck[0] = { ...deck[1] };
      if (kind === 'missing') deck.pop();
      if (kind === 'forged') deck[0].instanceId = 'fake';
      if (kind === 'product') deck[0].productId = deck[0].productId === 'apple' ? 'bread' : 'apple';
      expect(() => assertGameState(state)).toThrow(GameRuleError);
    }
    expect(createDeck()).toHaveLength(RULES.totalCards);
  });
});

describe('negotiation and manual resolution', () => {
  it('allows all unresolved merchants to offer and select in any order; distinguishes missing from zero', () => {
    let state = negotiate(gameFixture()); const ids = merchantIds(state);
    state = execute(state, state.sheriffId, { type: 'selectMerchant', merchantId: ids.at(-1)! });
    expect(() => execute(state, state.sheriffId, { type: 'resolveMerchant', merchantId: ids.at(-1)!, action: 'PASS', expectedOfferVersion: 0 })).toThrow(GameRuleError);
    state = submitAll(state);
    state = execute(state, state.sheriffId, { type: 'selectMerchant', merchantId: ids[0] });
    expect(state.selectedMerchantId).toBe(ids[0]);
    state = decide(state, ids.at(-1)!, 'PASS');
    expect(state.currentResolution?.merchantId).toBe(ids.at(-1));
    expect(state.currentResolution?.result.paymentAmount).toBe(0);
    expect(state.phase).toBe('RESOLUTION');
    state = execute(state, ids[0], { type: 'setOffer', amount: 1, expectedOfferVersion: state.players[ids[0]].offer.version });
    expect(state.phase).toBe('RESOLUTION');
    expect(state.players[ids[0]].offer.amount).toBe(1);
  });

  it('rejects stale offers instead of charging a silently changed amount', () => {
    let state = submitAll(negotiate(gameFixture()), 2); const id = merchantIds(state)[0];
    state = execute(state, state.sheriffId, { type: 'selectMerchant', merchantId: id });
    const oldVersion = state.players[id].offer.version;
    state = execute(state, id, { type: 'setOffer', amount: 7, expectedOfferVersion: oldVersion });
    const before = structuredClone(state);
    expect(() => execute(state, state.sheriffId, { type: 'resolveMerchant', merchantId: id, action: 'PASS', expectedOfferVersion: oldVersion })).toThrow(GameRuleError);
    expect(state).toEqual(before);
    expect(() => execute(state, id, { type: 'setOffer', amount: 1, expectedOfferVersion: oldVersion })).toThrow(GameRuleError);
  });

  it('allows only the current sheriff to select, decide, acknowledge or end round', () => {
    const state = submitAll(negotiate(gameFixture())); const id = merchantIds(state)[0];
    expect(() => execute(state, id, { type: 'selectMerchant', merchantId: id })).toThrow(GameRuleError);
    expect(() => execute(state, id, { type: 'resolveMerchant', merchantId: id, action: 'PASS', expectedOfferVersion: 1 })).toThrow(GameRuleError);
    const result = decide(state, id, 'PASS');
    expect(() => execute(result, id, { type: 'acknowledgeResolution', resolutionId: result.currentResolution!.id })).toThrow(GameRuleError);
    expect(() => execute(result, result.sheriffId, { type: 'endRound' })).toThrow(GameRuleError);
  });

  it('commits an inspection once, conserves cards, and waits for a matching manual acknowledgement', () => {
    let state = gameFixture(); const id = merchantIds(state)[0];
    state = arrangeHand(state, id, ['apple', 'apple', 'cannabis_leaf', 'cannabis_leaf']);
    state = prepareAll(state);
    for (const merchant of merchantIds(state)) state = execute(state, merchant, {
      type: 'lockBag', cardIds: state.players[merchant].hand.slice(0, merchant === id ? 4 : 1).map(card => card.instanceId), declaredProductId: 'cloth',
    });
    state = submitAll(state, 9);
    state = decide(state, id, 'INSPECT');
    expect(state.players[id].stash.map(card => card.productId)).toEqual(['apple', 'apple']);
    expect(state.discard.map(card => card.productId)).toEqual(['cannabis_leaf', 'cannabis_leaf']);
    expect(state.finances.cash[id]).toBe(38);
    expect(state.phase).toBe('RESOLUTION');
    const before = structuredClone(state);
    expect(() => execute(state, state.sheriffId, { type: 'resolveMerchant', merchantId: id, action: 'INSPECT', expectedOfferVersion: 1 })).toThrow(GameRuleError);
    expect(() => execute(state, state.sheriffId, { type: 'acknowledgeResolution', resolutionId: 'old-result' })).toThrow(GameRuleError);
    expect(state).toEqual(before);
    state = execute(state, state.sheriffId, { type: 'acknowledgeResolution', resolutionId: state.currentResolution!.id });
    expect(state.phase).toBe('NEGOTIATE');
    expect(() => execute(state, id, { type: 'setOffer', amount: 0, expectedOfferVersion: 1 })).toThrow(GameRuleError);
  });

  it('ends a round only after every merchant is resolved and preserves next sheriff hand', () => {
    let state = submitAll(negotiate(gameFixture())); const oldSheriff = state.sheriffId;
    for (const id of merchantIds(state).reverse()) {
      state = decide(state, id, 'PASS');
      state = execute(state, state.sheriffId, { type: 'acknowledgeResolution', resolutionId: state.currentResolution!.id });
    }
    expect(state.phase).toBe('ROUND_SUMMARY');
    const nextSheriff = state.seatOrder[(state.sheriffStartSeat + 1) % 4];
    const hand = structuredClone(state.players[nextSheriff].hand);
    expect(() => execute(state, merchantIds(state)[0], { type: 'endRound' })).toThrow(GameRuleError);
    state = execute(state, oldSheriff, { type: 'endRound' });
    expect(state.roundIndex).toBe(2); expect(state.phase).toBe('PREPARE');
    expect(state.players[nextSheriff].hand).toEqual(hand);
    expect(merchantIds(state).every(id => state.players[id].hand.length === 6)).toBe(true);
    expect(state.seatOrder.every(id => !state.players[id].offer.submitted && state.players[id].declaration === null)).toBe(true);
  });
});

describe('complete deterministic games', () => {
  it.each([4, 5, 6])('plays all %i-player rounds with inspect/pass and conserved cards/cash', count => {
    const simulate = () => {
      let state = gameFixture(count, 73);
      const sheriffTurns = Object.fromEntries(state.seatOrder.map(id => [id, 0]));
      const merchantTurns = { ...sheriffTurns };
      let rounds = 0;
      while (state.phase !== 'GAME_OVER') {
        rounds++; sheriffTurns[state.sheriffId]++;
        state = prepareAll(state, 3);
        for (const id of merchantIds(state)) {
          merchantTurns[id]++;
          state = execute(state, id, { type: 'lockBag', cardIds: [state.players[id].hand[0].instanceId], declaredProductId: 'apple' });
        }
        state = submitAll(state, 2);
        for (const [index, id] of merchantIds(state).reverse().entries()) {
          state = decide(state, id, (state.roundIndex + index) % 2 === 0 ? 'PASS' : 'INSPECT');
          expect(state.phase).toBe('RESOLUTION');
          expect(cashTotal(state.finances)).toBe(count * 50);
          expect(() => assertGameState(state)).not.toThrow();
          state = execute(state, state.sheriffId, { type: 'acknowledgeResolution', resolutionId: state.currentResolution!.id });
        }
        expect(state.phase).toBe('ROUND_SUMMARY');
        state = execute(state, state.sheriffId, { type: 'endRound' });
      }
      expect(rounds).toBe(count * 2);
      expect(Object.values(sheriffTurns)).toEqual(Array<number>(count).fill(2));
      expect(Object.values(merchantTurns)).toEqual(Array<number>(count).fill((count - 1) * 2));
      expect(state.history).toHaveLength(count * 2 * (count - 1));
      expect(state.scores?.standings).toHaveLength(count);
      expect(state.scores!.winners.length).toBeGreaterThan(0);
      expect(() => assertGameState(state)).not.toThrow();
      expect(JSON.parse(JSON.stringify(state))).toEqual(state);
      return state;
    };
    expect(simulate()).toEqual(simulate());
  });

  it('is retry-safe for repeated transaction evaluation with fixed entropy', () => {
    const state = gameFixture(); const actorId = merchantIds(state)[0];
    const command: GameplayCommand = { type: 'prepareGoods', roundIndex: 1, cardIds: state.players[actorId].hand.slice(0, 3).map(card => card.instanceId) };
    const context = { actorId, commandId: 'stable', entropy: seededEntropy(333) };
    const before = structuredClone(state);
    expect(applyGameCommand(state, command, context)).toEqual(applyGameCommand(state, command, context));
    expect(state).toEqual(before);
  });

  it('preserves the 0.1 snapshot and its finite-deck limit without adding cards to an existing game', () => {
    let state: GameState = JSON.parse(JSON.stringify(gameFixture(4, 42, LEGACY_RULES)));
    let rejected = false;
    while (state.phase !== 'GAME_OVER') {
      state = submitAll(negotiate(state, 5));
      for (const id of merchantIds(state)) {
        state = decide(state, id, 'PASS');
        state = execute(state, state.sheriffId, { type: 'acknowledgeResolution', resolutionId: state.currentResolution!.id });
      }
      const before = structuredClone(state);
      try {
        state = execute(state, state.sheriffId, { type: 'endRound' });
      } catch (error) {
        expect(error).toBeInstanceOf(GameRuleError);
        expect((error as GameRuleError).code).toBe('INSUFFICIENT_CARDS');
        expect(state).toEqual(before);
        expect(state.phase).toBe('ROUND_SUMMARY');
        rejected = true;
        break;
      }
    }
    expect(rejected).toBe(true);
    expect(state.roundIndex).toBe(7);
    expect(state.rules).toEqual(LEGACY_RULES);
    expect(() => assertGameState(state)).not.toThrow();
  });
});
