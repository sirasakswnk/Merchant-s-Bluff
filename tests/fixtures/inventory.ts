import assert from 'node:assert/strict';
import type { GameState, ProductId } from '../../src/lib/game/types';

export const APPROVED_COUNTS = { apple: 84, bread: 72, cheese: 60, cloth: 54, moonshine: 36, crossbow: 30, cannabis_leaf: 24 };
export function activeCards(state: GameState) {
  return [...state.deck, ...state.discard, ...state.seatOrder.flatMap(id => [
    ...state.players[id].hand, ...state.players[id].bag, ...state.players[id].stash,
  ])];
}
export function inventorySummary(state: GameState) {
  const cards = activeCards(state);
  return {
    total: cards.length, unique: new Set(cards.map(card => card.instanceId)).size,
    deck: state.deck.length, discard: state.discard.length,
    hand: state.seatOrder.reduce((sum, id) => sum + state.players[id].hand.length, 0),
    bag: state.seatOrder.reduce((sum, id) => sum + state.players[id].bag.length, 0),
    stash: state.seatOrder.reduce((sum, id) => sum + state.players[id].stash.length, 0),
    products: Object.fromEntries((Object.keys(APPROVED_COUNTS) as ProductId[]).map(id => [id, cards.filter(card => card.productId === id).length])),
  };
}
/** Independent of engine assertions: compare every active instance with the initial inventory. */
export function assertApprovedInventory(state: GameState, initialIds: readonly string[]) {
  const summary = inventorySummary(state);
  assert.equal(summary.total, 360); assert.equal(summary.unique, 360);
  assert.deepEqual(summary.products, APPROVED_COUNTS);
  assert.deepEqual(activeCards(state).map(card => card.instanceId).sort(), [...initialIds].sort());
  return summary;
}
