import type { RulesSnapshot } from '../../src/lib/game/types';

/** Historical 0.1 snapshot only. Never imported by application code or migrated. */
export const LEGACY_RULES: RulesSnapshot = {
  rulesVersion: '0.1', minPlayers: 4, maxPlayers: 6, startingCash: 50, handSize: 6,
  maxExchange: 3, minBagSize: 1, maxBagSize: 5, sheriffTurnsPerPlayer: 2,
  legalMajorityBonus: 8, totalCards: 120,
  products: {
    apple: { id: 'apple', name: 'แอปเปิล', category: 'legal', value: 2, compensation: 2, fine: 0, count: 28 },
    bread: { id: 'bread', name: 'ขนมปัง', category: 'legal', value: 3, compensation: 2, fine: 0, count: 24 },
    cheese: { id: 'cheese', name: 'ชีส', category: 'legal', value: 4, compensation: 3, fine: 0, count: 20 },
    cloth: { id: 'cloth', name: 'ผ้า', category: 'legal', value: 5, compensation: 3, fine: 0, count: 18 },
    moonshine: { id: 'moonshine', name: 'เหล้าเถื่อน', category: 'contraband', value: 8, compensation: 0, fine: 4, count: 12 },
    crossbow: { id: 'crossbow', name: 'หน้าไม้', category: 'contraband', value: 10, compensation: 0, fine: 5, count: 10 },
    cannabis_leaf: { id: 'cannabis_leaf', name: 'ใบกัญชา', category: 'contraband', value: 12, compensation: 0, fine: 6, count: 8 },
  },
};
