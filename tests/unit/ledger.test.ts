import { describe, expect, it } from 'vitest';
import { GameRuleError } from '../../src/lib/game/errors';
import { assertFinancialState, cashTotal, createFinancialState, pay } from '../../src/lib/game/ledger';
import type { Debt, FinancialState } from '../../src/lib/game/types';

function fixture(cash: Record<string, number>, debts: Debt[] = []): FinancialState {
  return { cash, debts, ledger: [], nextOrder: Math.max(0, ...debts.map(debt => debt.createdOrder)) + 1 };
}
function debt(id: string, debtor: string, creditor: string, outstanding: number, createdOrder: number): Debt {
  return { id, debtor, creditor, outstanding, createdOrder };
}

describe('cash and FIFO debt ledger', () => {
  it('initializes the approved 50 coins each without aliasing', () => {
    const state = createFinancialState(['a', 'b', 'c', 'd'], 50);
    expect(state.cash).toEqual({ a: 50, b: 50, c: 50, d: 50 });
    expect(cashTotal(state)).toBe(200);
    expect(state.debts).toEqual([]);
    expect(() => createFinancialState(['a', 'a'], 50)).toThrow(GameRuleError);
  });

  it('transfers a bribe once with no new debt or input mutation', () => {
    const state = createFinancialState(['a', 'b', 'c', 'd'], 50);
    const before = structuredClone(state);
    Object.freeze(state.cash);
    Object.freeze(state.debts);
    Object.freeze(state.ledger);
    Object.freeze(state);
    const result = pay(state, 'a', 'b', 7, 'BRIBE');
    expect(result.state.cash).toEqual({ a: 43, b: 57, c: 50, d: 50 });
    expect(result.state.ledger).toEqual([{ order: 1, from: 'a', to: 'b', amount: 7, kind: 'BRIBE', debtId: null }]);
    expect(result.debtCreated).toBe(0);
    expect(state).toEqual(before);
    expect(JSON.parse(JSON.stringify(result.state))).toEqual(result.state);
  });

  it('records a compulsory shortfall after paying all available cash', () => {
    const state = fixture({ a: 3, b: 97 });
    const result = pay(state, 'a', 'b', 12, 'FINE');
    expect(result.paid).toBe(3);
    expect(result.debtCreated).toBe(9);
    expect(result.state.cash).toEqual({ a: 0, b: 100 });
    expect(result.state.debts).toEqual([debt('debt-2', 'a', 'b', 9, 2)]);
    expect(cashTotal(result.state)).toBe(100);
  });

  it('records compensation debt when the sheriff has no cash', () => {
    const result = pay(fixture({ a: 0, b: 100 }), 'a', 'b', 13, 'COMPENSATION');
    expect(result.state.debts).toEqual([debt('debt-1', 'a', 'b', 13, 1)]);
    expect(result.state.ledger).toEqual([]);
    expect(result.state.cash).toEqual({ a: 0, b: 100 });
  });

  it('settles oldest debt first even when the array order differs', () => {
    const state = fixture({ a: 0, b: 10, c: 10, d: 10 }, [
      debt('later', 'a', 'b', 8, 2), debt('oldest', 'a', 'c', 6, 1),
    ]);
    const result = pay(state, 'd', 'a', 10, 'BRIBE').state;
    expect(result.cash).toEqual({ a: 0, b: 14, c: 16, d: 0 });
    expect(result.debts).toEqual([debt('later', 'a', 'b', 4, 2)]);
    expect(result.ledger.map(entry => [entry.to, entry.amount])).toEqual([['a', 10], ['c', 6], ['b', 4]]);
  });

  it('forwards receipts along a chain and keeps only the remainder spendable', () => {
    const state = fixture({ a: 0, b: 0, c: 0, d: 30 }, [
      debt('ab', 'a', 'b', 8, 1), debt('bc', 'b', 'c', 6, 2), debt('cd', 'c', 'd', 4, 3),
    ]);
    const result = pay(state, 'd', 'a', 10, 'BRIBE').state;
    expect(result.cash).toEqual({ a: 2, b: 2, c: 2, d: 24 });
    expect(result.debts).toEqual([]);
    expect(cashTotal(result)).toBe(30);
  });

  it('terminates a debt cycle by reducing obligations before forwarding the same coin', () => {
    const state = fixture({ a: 0, b: 0, c: 0, d: 1 }, [
      debt('ab', 'a', 'b', 5, 1), debt('bc', 'b', 'c', 5, 2), debt('ca', 'c', 'a', 5, 3),
    ]);
    const result = pay(state, 'd', 'a', 1, 'BRIBE').state;
    expect(result.debts).toEqual([]);
    expect(result.cash).toEqual({ a: 1, b: 0, c: 0, d: 0 });
    expect(result.ledger).toHaveLength(16);
    expect(cashTotal(result)).toBe(1);
    expect(state.debts.map(item => item.outstanding)).toEqual([5, 5, 5]);
  });

  it('does not net reciprocal debts without a real receipt', () => {
    const state = fixture({ a: 0, b: 0, c: 50 }, [debt('ab', 'a', 'b', 9, 1), debt('ba', 'b', 'a', 9, 2)]);
    expect(pay(state, 'c', 'a', 0, 'BRIBE').state).toEqual(state);
  });

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])('rejects invalid amount %s atomically', amount => {
    const state = createFinancialState(['a', 'b'], 50);
    const before = structuredClone(state);
    expect(() => pay(state, 'a', 'b', amount, 'FINE')).toThrow(GameRuleError);
    expect(state).toEqual(before);
  });

  it('rejects borrowing for bribes, unknown players, self-payment and inconsistent accounts', () => {
    const state = createFinancialState(['a', 'b'], 50);
    expect(() => pay(state, 'a', 'b', 51, 'BRIBE')).toThrow(GameRuleError);
    expect(() => pay(state, 'a', 'missing', 1, 'FINE')).toThrow(GameRuleError);
    expect(() => pay(state, 'a', 'a', 1, 'FINE')).toThrow(GameRuleError);
    expect(() => assertFinancialState(fixture({ a: 1, b: 0 }, [debt('ab', 'a', 'b', 1, 1)]))).toThrow(GameRuleError);
    expect(() => assertFinancialState(fixture({ a: 0, b: 0 }, [debt('ab', 'a', 'b', 1, 1), debt('ba', 'b', 'a', 1, 1)]))).toThrow(GameRuleError);
  });

  it.each([4, 5, 6])('conserves cash through 600 deterministic mixed payments with %i players', count => {
    const ids = Array.from({ length: count }, (_, index) => `p${index}`);
    const simulate = () => {
      let state = createFinancialState(ids, 50);
      for (let turn = 0; turn < 600; turn++) {
        const from = ids[(turn * 7 + Math.floor(turn / 3)) % count];
        const to = ids[(ids.indexOf(from) + 1 + (turn % (count - 1))) % count];
        const kind = turn % 3 === 0 ? 'BRIBE' : turn % 3 === 1 ? 'FINE' : 'COMPENSATION';
        const amount = kind === 'BRIBE' ? Math.min(state.cash[from], turn % 11) : 1 + (turn * 13) % 31;
        state = pay(state, from, to, amount, kind).state;
        expect(cashTotal(state)).toBe(count * 50);
        expect(Object.values(state.cash).every(cash => cash >= 0)).toBe(true);
        expect(() => assertFinancialState(state)).not.toThrow();
      }
      return state;
    };
    expect(simulate()).toEqual(simulate());
  });
});
