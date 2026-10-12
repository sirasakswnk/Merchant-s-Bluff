import { applyGameCommand, startGame } from '../../src/lib/game/engine';
import { RULES } from '../../src/lib/game/config';
import type { CardInstance, GameState, GameplayCommand, ProductId, RulesSnapshot } from '../../src/lib/game/types';

/** Fixed samples only for tests; actual server entropy must come from Node crypto. */
export function seededEntropy(seed: number, count = RULES.totalCards): number[] {
  let state = seed >>> 0;
  return Array.from({ length: count }, () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  });
}
export function gameFixture(count = 4, seed = 42, rules: RulesSnapshot = RULES): GameState {
  return startGame('test-game', Array.from({ length: count }, (_, index) => `p${index}`), seededEntropy(seed, rules.totalCards), rules);
}
export type CommandInput = GameplayCommand extends infer Command ? Command extends GameplayCommand ? Omit<Command, 'roundIndex'> : never : never;
export function step(state: GameState, actorId: string, command: CommandInput, sequence = state.revision): GameState {
  return applyGameCommand(state, { ...command, roundIndex: state.roundIndex } as GameplayCommand,
    { actorId, commandId: `test-command-${sequence}`, entropy: seededEntropy(sequence) });
}
export function prepareAll(state: GameState, exchange = 0): GameState {
  for (const id of state.seatOrder.filter(id => id !== state.sheriffId)) {
    state = step(state, id, { type: 'prepareGoods', cardIds: state.players[id].hand.slice(0, exchange).map(card => card.instanceId) });
  }
  return state;
}
export function negotiate(state: GameState, bagSize = 1): GameState {
  state = prepareAll(state);
  for (const id of state.seatOrder.filter(id => id !== state.sheriffId)) {
    state = step(state, id, { type: 'lockBag', cardIds: state.players[id].hand.slice(0, bagSize).map(card => card.instanceId), declaredProductId: 'apple' });
  }
  return state;
}
/** Swap real catalog instances between active zones; never mint fixture cards. */
export function arrangeHand(input: GameState, playerId: string, products: readonly ProductId[]): GameState {
  const state = structuredClone(input);
  const own = state.players[playerId].hand as CardInstance[];
  const zones = [state.deck, state.discard, ...state.seatOrder.map(id => state.players[id].hand)] as CardInstance[][];
  for (let index = 0; index < products.length; index++) {
    const zone = zones.find(cards => cards.some((card, position) => card.productId === products[index] && (cards !== own || position >= index)))!;
    const position = zone.findIndex((card, position) => card.productId === products[index] && (zone !== own || position >= index));
    [own[index], zone[position]] = [zone[position], own[index]];
  }
  return state;
}
