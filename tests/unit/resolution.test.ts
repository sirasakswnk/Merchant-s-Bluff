import { describe, expect, it } from 'vitest';
import { RULES } from '../../src/lib/game/config';
import { GameRuleError } from '../../src/lib/game/errors';
import { createFinancialState } from '../../src/lib/game/ledger';
import { resolveBag } from '../../src/lib/game/resolution';
import type { CardInstance, FinancialState, LegalProductId, Offer, ProductId } from '../../src/lib/game/types';

function cards(...products: ProductId[]): CardInstance[] {
  return products.map((productId, index) => ({ instanceId: `test-${index}`, productId }));
}
function resolve(products: ProductId[], options: {
  action?: 'PASS' | 'INSPECT'; declaration?: LegalProductId; amount?: number;
  finances?: FinancialState; offer?: Offer;
} = {}) {
  return resolveBag({
    cards: cards(...products), rules: RULES, merchantId: 'merchant', sheriffId: 'sheriff',
    finances: options.finances ?? createFinancialState(['merchant', 'sheriff', 'other1', 'other2'], 50),
    declaredProductId: options.declaration ?? 'apple', action: options.action ?? 'INSPECT',
    offer: options.offer ?? { submitted: true, amount: options.amount ?? 0, version: 1 },
  });
}

describe('mandatory inspection and pass rules', () => {
  it('passes two apples and three cheese; compensates 13 regardless of declaration', () => {
    const result = resolve(['apple', 'apple', 'cheese', 'cheese', 'cheese'], { declaration: 'cloth', amount: 7 });
    expect(result.passed).toHaveLength(5);
    expect(result.confiscated).toEqual([]);
    expect(result.paymentKind).toBe('COMPENSATION');
    expect(result.paymentAmount).toBe(13);
    expect(result.finances.cash).toMatchObject({ merchant: 63, sheriff: 37 });
    expect(result.finances.ledger).toHaveLength(1);
    expect(result.contrabandPassed).toBe(false);
    expect(result.revealed).toHaveLength(5);
  });

  it('passes two apples, confiscates two cannabis leaves and fines 12 with no compensation', () => {
    const result = resolve(['apple', 'apple', 'cannabis_leaf', 'cannabis_leaf'], { amount: 9 });
    expect(result.passed.map(card => card.productId)).toEqual(['apple', 'apple']);
    expect(result.confiscated.map(card => card.productId)).toEqual(['cannabis_leaf', 'cannabis_leaf']);
    expect(result.paymentKind).toBe('FINE');
    expect(result.paymentAmount).toBe(12);
    expect(result.finances.cash).toMatchObject({ merchant: 38, sheriff: 62 });
    expect(result.finances.ledger).toHaveLength(1);
    expect(result.contrabandPassed).toBe(false);
  });

  it('confiscates all five crossbows and fines 25', () => {
    const result = resolve(Array<ProductId>(5).fill('crossbow'));
    expect(result.passed).toEqual([]);
    expect(result.confiscated).toHaveLength(5);
    expect(result.paymentAmount).toBe(25);
    expect(result.finances.cash).toMatchObject({ merchant: 25, sheriff: 75 });
  });

  it('compensates legal goods when none match the declared product', () => {
    const result = resolve(['bread', 'cheese'], { declaration: 'apple' });
    expect(result.passed).toHaveLength(2);
    expect(result.paymentAmount).toBe(5);
  });

  it('PASS moves every product, pays exactly the offer and reveals only a boolean flag', () => {
    const result = resolve(['apple', 'crossbow', 'cannabis_leaf'], { action: 'PASS', amount: 11 });
    expect(result.passed).toHaveLength(3);
    expect(result.confiscated).toEqual([]);
    expect(result.revealed).toBeNull();
    expect(result.paymentKind).toBe('BRIBE');
    expect(result.paymentAmount).toBe(11);
    expect(result.finances.cash).toMatchObject({ merchant: 39, sheriff: 61 });
    expect(result.contrabandPassed).toBe(true);
  });

  it('legal-only PASS has no glow; confirmed zero offer transfers no money', () => {
    const result = resolve(['apple', 'bread'], { action: 'PASS' });
    expect(result.paymentAmount).toBe(0);
    expect(result.finances.ledger).toEqual([]);
    expect(result.contrabandPassed).toBe(false);
    expect(result.finances.cash).toMatchObject({ merchant: 50, sheriff: 50 });
  });

  it('keeps the public flag and payment independent of contraband type/count', () => {
    const one = resolve(['apple', 'apple', 'apple', 'crossbow'], { action: 'PASS', amount: 8 });
    const four = resolve(['moonshine', 'crossbow', 'cannabis_leaf', 'cannabis_leaf'], { action: 'PASS', amount: 8 });
    const permittedResult = (result: ReturnType<typeof resolve>) => ({
      bagCount: result.bagCount, contrabandPassed: result.contrabandPassed,
      revealed: result.revealed, paymentAmount: result.paymentAmount, cash: result.finances.cash,
    });
    expect(permittedResult(one)).toEqual(permittedResult(four));
    // Full RTDB/API/DOM privacy verification remains M2/M3, not this internal calculation.
  });

  it('creates compensation and fine debts for insufficient cash', () => {
    const compensation = resolve(['apple', 'apple', 'cheese', 'cheese', 'cheese'], {
      finances: { cash: { merchant: 97, sheriff: 3 }, debts: [], ledger: [], nextOrder: 1 },
    });
    expect(compensation.finances.cash).toEqual({ merchant: 100, sheriff: 0 });
    expect(compensation.finances.debts[0]).toMatchObject({ debtor: 'sheriff', creditor: 'merchant', outstanding: 10 });
    const fine = resolve(['cannabis_leaf', 'cannabis_leaf'], {
      finances: { cash: { merchant: 2, sheriff: 98 }, debts: [], ledger: [], nextOrder: 1 },
    });
    expect(fine.finances.cash).toEqual({ merchant: 0, sheriff: 100 });
    expect(fine.finances.debts[0]).toMatchObject({ debtor: 'merchant', creditor: 'sheriff', outstanding: 10 });
  });

  it.each(['PASS', 'INSPECT'] as const)('rejects %s before an offer choice, or after it exceeds current cash', action => {
    expect(() => resolve(['apple'], { action, offer: { submitted: false, amount: 0, version: 0 } })).toThrow(GameRuleError);
    expect(() => resolve(['apple'], { action, amount: 51 })).toThrow(GameRuleError);
  });

  it.each([0, 6])('rejects a bag with %i cards', count => {
    expect(() => resolve(Array<ProductId>(count).fill('apple'))).toThrow(GameRuleError);
  });

  it.each([1, 5])('accepts a bag with %i cards and derives its count', count => {
    expect(resolve(Array<ProductId>(count).fill('apple')).bagCount).toBe(count);
  });

  it('rejects duplicate instances and contraband declarations', () => {
    const base = {
      cards: cards('apple'), rules: RULES, merchantId: 'merchant', sheriffId: 'sheriff',
      finances: createFinancialState(['merchant', 'sheriff'], 50),
      declaredProductId: 'apple' as const, action: 'INSPECT' as const, offer: { submitted: true, amount: 0, version: 1 },
    };
    expect(() => resolveBag({ ...base, cards: [base.cards[0], base.cards[0]] })).toThrow(GameRuleError);
    expect(() => resolveBag({ ...base, declaredProductId: 'moonshine' as LegalProductId })).toThrow(GameRuleError);
    expect(() => resolveBag({ ...base, cards: [{ instanceId: 'x', productId: 'unknown' as ProductId }] })).toThrow(GameRuleError);
  });

  it('does not mutate the source bag, offer, rules or accounts', () => {
    const bag = cards('apple', 'crossbow');
    const finances = createFinancialState(['merchant', 'sheriff'], 50);
    const offer = { submitted: true, amount: 5, version: 1 };
    const before = structuredClone({ bag, finances, offer });
    const result = resolveBag({ cards: bag, finances, offer, rules: RULES,
      merchantId: 'merchant', sheriffId: 'sheriff', declaredProductId: 'cloth', action: 'PASS' });
    expect({ bag, finances, offer }).toEqual(before);
    expect(result.passed[0]).not.toBe(bag[0]);
  });
});
