import { describe, expect, it } from 'vitest';
import { RULES } from '../../src/lib/game/config';
import { GameRuleError } from '../../src/lib/game/errors';
import { createFinancialState, pay } from '../../src/lib/game/ledger';
import { scoreGame } from '../../src/lib/game/scoring';
import type { FinancialState, ProductId, ScorePlayer } from '../../src/lib/game/types';

function players(stashes: ProductId[][]): ScorePlayer[] {
  return stashes.map((products, seat) => ({
    id: `p${seat}`, stash: products.map((productId, index) => ({ instanceId: `test-${seat}-${index}`, productId })),
  }));
}
function score(stashes: ProductId[][], finances?: FinancialState) {
  const seats = players(stashes);
  return scoreGame(seats, finances ?? createFinancialState(seats.map(player => player.id), 50), RULES);
}

describe('final scoring, legal bonuses and ties', () => {
  it('awards no bonus when nobody has that legal product', () => {
    const result = score([[], [], [], []]);
    expect(result.standings.every(row => row.bonus === 0 && row.total === 50)).toBe(true);
    expect(result.winners).toEqual(['p0', 'p1', 'p2', 'p3']);
    expect(result.standings.map(row => row.rank)).toEqual([1, 1, 1, 1]);
  });

  it('includes every stored product value and bonuses for legal products only', () => {
    const result = score([['apple', 'bread', 'cheese', 'cloth', 'moonshine', 'crossbow', 'cannabis_leaf'], [], [], []]);
    const winner = result.standings[0];
    expect(winner.goodsValue).toBe(44);
    expect(winner.legalCount).toBe(4);
    expect(winner.bonusByProduct).toEqual({ apple: 8, bread: 8, cheese: 8, cloth: 8 });
    expect(winner.bonus).toBe(32);
    expect(winner.total).toBe(126);
    expect(result.winners).toEqual(['p0']);
  });

  it.each([2, 3, 6])('splits 8 bonus points between %i leaders and discards the remainder', leaders => {
    const count = Math.max(4, leaders);
    const result = score(Array.from({ length: count }, (_, index) => index < leaders ? ['apple'] : []));
    const shares = result.standings.filter(row => row.counts.apple > 0).map(row => row.bonusByProduct.apple);
    expect(shares).toEqual(Array<number>(leaders).fill(Math.floor(8 / leaders)));
    expect(result.standings.reduce((total, row) => total + row.bonus, 0)).toBe(leaders * Math.floor(8 / leaders));
  });

  it('calculates each legal majority separately', () => {
    const result = score([['apple', 'apple'], ['apple', 'bread'], ['bread'], []]);
    const byId = Object.fromEntries(result.standings.map(row => [row.playerId, row]));
    expect(byId.p0.bonusByProduct).toEqual({ apple: 8, bread: 0, cheese: 0, cloth: 0 });
    expect(byId.p1.bonusByProduct.bread).toBe(4);
    expect(byId.p2.bonusByProduct.bread).toBe(4);
  });

  it('includes outstanding receivables and debts with no score or cash created', () => {
    let finances = createFinancialState(['p0', 'p1', 'p2', 'p3'], 50);
    finances = pay(finances, 'p0', 'p1', 60, 'FINE').state;
    const result = score([[], [], [], []], finances);
    const byId = Object.fromEntries(result.standings.map(row => [row.playerId, row]));
    expect(byId.p0).toMatchObject({ cash: 0, receivable: 0, debt: 10, total: -10 });
    expect(byId.p1).toMatchObject({ cash: 100, receivable: 10, debt: 0, total: 110 });
    expect(result.standings.reduce((total, row) => total + row.receivable - row.debt, 0)).toBe(0);
    expect(result.standings.reduce((total, row) => total + row.total, 0)).toBe(200);
  });

  it('uses legal count to break equal total scores, then allows shared winners', () => {
    const finances: FinancialState = { cash: { p0: 40, p1: 44, p2: 50, p3: 50 }, debts: [], ledger: [], nextOrder: 1 };
    const result = score([['apple', 'apple'], ['moonshine'], [], []], finances);
    expect(result.standings.map(row => [row.playerId, row.total, row.legalCount, row.rank])).toEqual([
      ['p0', 52, 2, 1], ['p1', 52, 0, 2], ['p2', 50, 0, 3], ['p3', 50, 0, 3],
    ]);
    expect(result.winners).toEqual(['p0']);
  });

  it('keeps stable seat order among exact ties, but does not use it to select a sole winner', () => {
    const finances: FinancialState = { cash: { p0: 40, p1: 40, p2: 40, p3: 0 }, debts: [], ledger: [], nextOrder: 1 };
    const result = score([['apple', 'apple'], ['apple', 'apple'], ['moonshine'], []], finances);
    expect(result.standings.map(row => [row.playerId, row.total, row.legalCount, row.rank])).toEqual([
      ['p0', 48, 2, 1], ['p1', 48, 2, 1], ['p2', 48, 0, 3], ['p3', 0, 0, 4],
    ]);
    expect(result.winners).toEqual(['p0', 'p1']);
  });

  it('rejects missing accounts or duplicate card instances across stashes', () => {
    const seats = players([['apple'], ['apple'], [], []]);
    const finances = createFinancialState(seats.map(player => player.id), 50);
    const duplicate = [seats[0], { ...seats[1], stash: seats[0].stash }, seats[2], seats[3]];
    expect(() => scoreGame(duplicate, finances, RULES)).toThrow(GameRuleError);
    expect(() => scoreGame(seats, createFinancialState(['p0', 'p1', 'p2'], 50), RULES)).toThrow(GameRuleError);
  });

  it('returns JSON-safe results and leaves stashes, accounts and rules untouched', () => {
    const seats = players([['apple'], ['bread'], ['crossbow'], []]);
    const finances = createFinancialState(seats.map(player => player.id), 50);
    const before = structuredClone({ seats, finances, rules: RULES });
    const result = scoreGame(seats, finances, RULES);
    expect({ seats, finances, rules: RULES }).toEqual(before);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
