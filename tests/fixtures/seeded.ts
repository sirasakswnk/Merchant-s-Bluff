import { createDeck } from '../../src/lib/game/config';
import type { CardInstance } from '../../src/lib/game/types';

/** Test-only PRNG. Never import fixtures into application/server production code. */
export function seededDeck(seed: number): CardInstance[] {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const deck = createDeck();
  for (let index = deck.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [deck[index], deck[target]] = [deck[target], deck[index]];
  }
  return deck;
}
