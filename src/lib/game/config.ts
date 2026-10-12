import type { CardInstance, ProductConfig, ProductId, RulesSnapshot } from './types';

export const RULES_VERSION = '0.2' as const;
export const GAME_NAME = 'พ่อค้าหน้าประตู';
export const PRODUCTS: Readonly<Record<ProductId, ProductConfig>> = Object.freeze({
  apple: Object.freeze({ id: 'apple', name: 'แอปเปิล', category: 'legal', value: 2, compensation: 2, fine: 0, count: 84 }),
  bread: Object.freeze({ id: 'bread', name: 'ขนมปัง', category: 'legal', value: 3, compensation: 2, fine: 0, count: 72 }),
  cheese: Object.freeze({ id: 'cheese', name: 'ชีส', category: 'legal', value: 4, compensation: 3, fine: 0, count: 60 }),
  cloth: Object.freeze({ id: 'cloth', name: 'ผ้า', category: 'legal', value: 5, compensation: 3, fine: 0, count: 54 }),
  moonshine: Object.freeze({ id: 'moonshine', name: 'เหล้าเถื่อน', category: 'contraband', value: 8, compensation: 0, fine: 4, count: 36 }),
  crossbow: Object.freeze({ id: 'crossbow', name: 'หน้าไม้', category: 'contraband', value: 10, compensation: 0, fine: 5, count: 30 }),
  cannabis_leaf: Object.freeze({ id: 'cannabis_leaf', name: 'ใบกัญชา', category: 'contraband', value: 12, compensation: 0, fine: 6, count: 24 }),
});
export const LEGAL_PRODUCT_IDS = ['apple', 'bread', 'cheese', 'cloth'] as const;
export const PRODUCT_IDS = [...LEGAL_PRODUCT_IDS, 'moonshine', 'crossbow', 'cannabis_leaf'] as const;
export const RULES: RulesSnapshot = Object.freeze({
  rulesVersion: RULES_VERSION, products: PRODUCTS, minPlayers: 4, maxPlayers: 6,
  startingCash: 50, handSize: 6, maxExchange: 3, minBagSize: 1, maxBagSize: 5,
  sheriffTurnsPerPlayer: 2, legalMajorityBonus: 8, totalCards: 360,
});

/** Pure construction only. Shuffle/entropy belongs to the server, never the UI. */
export function createDeck(rules: RulesSnapshot = RULES): CardInstance[] {
  return PRODUCT_IDS.flatMap((productId) =>
    Array.from({ length: rules.products[productId].count }, (_, index) => ({
      instanceId: productId + '-' + String(index + 1).padStart(3, '0'), productId,
    })),
  );
}

/** Store this serializable copy with each new game; later config changes cannot alter it. */
export function createRulesSnapshot(): RulesSnapshot {
  return structuredClone(RULES);
}
