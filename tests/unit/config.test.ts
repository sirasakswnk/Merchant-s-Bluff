import { describe, expect, it } from 'vitest';
import { createDeck, createRulesSnapshot, PRODUCTS, RULES } from '../../src/lib/game/config';
import { seededDeck } from '../fixtures/seeded';
import { connectionPath } from '../../src/lib/shared/health';
import { LEGACY_RULES } from '../fixtures/legacy-rules';

describe('approved rules 0.2', () => {
  it('preserves every approved product name and price', () => {
    expect(Object.values(PRODUCTS).map(p => [p.id, p.name, p.category, p.value, p.compensation, p.fine, p.count])).toEqual([
      ['apple', 'แอปเปิล', 'legal', 2, 2, 0, 84], ['bread', 'ขนมปัง', 'legal', 3, 2, 0, 72],
      ['cheese', 'ชีส', 'legal', 4, 3, 0, 60], ['cloth', 'ผ้า', 'legal', 5, 3, 0, 54],
      ['moonshine', 'เหล้าเถื่อน', 'contraband', 8, 0, 4, 36], ['crossbow', 'หน้าไม้', 'contraband', 10, 0, 5, 30],
      ['cannabis_leaf', 'ใบกัญชา', 'contraband', 12, 0, 6, 24],
    ]);
  });
  it('constructs the approved 360 unique instances with exact product counts', () => {
    const deck = createDeck();
    expect(RULES.rulesVersion).toBe('0.2');
    expect(RULES.totalCards).toBe(360);
    expect(deck).toHaveLength(360);
    expect(new Set(deck.map(c => c.instanceId)).size).toBe(360);
    for (const product of Object.values(PRODUCTS)) expect(deck.filter(c => c.productId === product.id)).toHaveLength(product.count);
  });
  it('changes only counts, total and rulesVersion compared with the existing 0.1 snapshot', () => {
    const { products, totalCards, rulesVersion, ...other } = RULES;
    const { products: previous, totalCards: oldTotal, rulesVersion: oldVersion, ...oldOther } = LEGACY_RULES;
    expect(other).toEqual(oldOther);
    expect(totalCards).toBe(oldTotal * 3); expect(rulesVersion).not.toBe(oldVersion);
    for (const id of Object.keys(products) as (keyof typeof products)[]) {
      const { count, ...product } = products[id]; const { count: oldCount, ...oldProduct } = previous[id];
      expect(product).toEqual(oldProduct); expect(count).toBe(oldCount * 3);
    }
  });
  it('snapshots are JSON-safe and isolated from future config edits', () => {
    const snapshot = createRulesSnapshot();
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(RULES);
    expect(snapshot.products).not.toBe(PRODUCTS);
    expect(snapshot.products.apple).not.toBe(PRODUCTS.apple);
    expect(Object.isFrozen(PRODUCTS.apple)).toBe(true);
  });
  it('seeds are deterministic and shuffle preserves all instances', () => {
    expect(seededDeck(42)).toEqual(seededDeck(42));
    expect(seededDeck(42)).not.toEqual(seededDeck(43));
    expect(seededDeck(42).map(c=>c.instanceId).sort()).toEqual(createDeck().map(c=>c.instanceId).sort());
  });
  it('rejects UID path injection', () => {
    expect(connectionPath('test_user-1')).toBe('healthChecks/test_user-1/latest');
    for (const uid of ['', '../other', 'a/b', 'a.b', 'a#b']) expect(() => connectionPath(uid)).toThrow();
  });
});
