import { describe, expect, it } from 'vitest';
import { supplyCount } from '../../src/lib/game/engine';
import type { GameState } from '../../src/lib/game/types';
import { gameFixture, negotiate, prepareAll, step } from '../fixtures/game';

function cardsOutsideSupply(state: GameState) {
  return Object.values(state.players).reduce((sum, player) => sum + player.hand.length + player.bag.length + player.stash.length, 0);
}

describe('public supply count', () => {
  it('equals draw pile plus discard and conserves the whole deck', () => {
    for (const count of [4, 5, 6]) {
      const state = gameFixture(count);
      expect(supplyCount(state)).toBe(state.deck.length + state.discard.length);
      expect(supplyCount(state) + cardsOutsideSupply(state)).toBe(state.rules.totalCards);
    }
  });

  it('does not change while merchants exchange in secret, whatever each one exchanges', () => {
    const start = gameFixture(5);
    const before = supplyCount(start);
    let state = start;
    for (const [index, id] of start.seatOrder.filter(id => id !== start.sheriffId).entries()) {
      state = step(state, id, { type: 'prepareGoods', cardIds: state.players[id].hand.slice(0, index % 4).map(card => card.instanceId) });
      expect(supplyCount(state)).toBe(before);
    }
    expect(state.phase).toBe('PACK_AND_DECLARE');
    expect(supplyCount(prepareAll(gameFixture(5), 3))).toBe(before);
    expect(supplyCount(prepareAll(gameFixture(5), 0))).toBe(before);
  });

  it('is unchanged by packing bags', () => {
    const prepared = prepareAll(gameFixture(4));
    expect(supplyCount(negotiate(gameFixture(4), 5))).toBe(supplyCount(prepared));
  });
});
