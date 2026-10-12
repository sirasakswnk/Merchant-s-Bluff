import { LEGAL_PRODUCT_IDS, PRODUCT_IDS } from './config';
import { requireRule } from './errors';
import { assertFinancialState } from './ledger';
import type { FinancialState, GameScores, LegalProductId, ProductId, RulesSnapshot, ScorePlayer, ScoreRow } from './types';

type ScoreWork = { -readonly [Key in keyof Omit<ScoreRow, 'rank'>]: ScoreRow[Key] } & {
  bonusByProduct: Record<LegalProductId, number>;
};

/** Call only at GAME_OVER. This breakdown includes every player's secret stash. */
export function scoreGame(players: readonly ScorePlayer[], finances: FinancialState, rules: RulesSnapshot): GameScores {
  assertFinancialState(finances);
  const ids = new Set(players.map(player => player.id));
  requireRule(players.length >= rules.minPlayers && players.length <= rules.maxPlayers && ids.size === players.length
    && ids.size === Object.keys(finances.cash).length && players.every(player => Object.hasOwn(finances.cash, player.id)),
  'INVALID_PLAYERS', 'ผู้เล่นและบัญชีต้องตรงกันครบ 4–6 คน');
  const cards = players.flatMap(player => [...player.stash]);
  requireRule(new Set(cards.map(card => card.instanceId)).size === cards.length && cards.every(card =>
    card.instanceId.length > 0 && Object.hasOwn(rules.products, card.productId)), 'INVALID_CARDS', 'คลังสินค้ามีไพ่ซ้ำหรือไม่ถูกต้อง');
  const rows: ScoreWork[] = players.map(player => {
    const counts = Object.fromEntries(PRODUCT_IDS.map(id => [id, 0])) as Record<ProductId, number>;
    for (const card of player.stash) counts[card.productId]++;
    const goodsValue = PRODUCT_IDS.reduce((total, id) => total + counts[id] * rules.products[id].value, 0);
    const receivable = finances.debts.filter(debt => debt.creditor === player.id).reduce((total, debt) => total + debt.outstanding, 0);
    const debt = finances.debts.filter(debt => debt.debtor === player.id).reduce((total, debt) => total + debt.outstanding, 0);
    const cash = finances.cash[player.id];
    const legalCount = LEGAL_PRODUCT_IDS.reduce((total, id) => total + counts[id], 0);
    return {
      playerId: player.id, cash, counts, goodsValue,
      bonusByProduct: Object.fromEntries(LEGAL_PRODUCT_IDS.map(id => [id, 0])) as Record<LegalProductId, number>,
      bonus: 0, receivable, debt, legalCount, total: cash + goodsValue + receivable - debt,
    };
  });
  for (const id of LEGAL_PRODUCT_IDS) {
    const highest = Math.max(...rows.map(row => row.counts[id]));
    if (highest === 0) continue;
    const leaders = rows.filter(row => row.counts[id] === highest);
    const share = Math.floor(rules.legalMajorityBonus / leaders.length);
    for (const leader of leaders) {
      leader.bonusByProduct[id] = share;
      leader.bonus += share;
      leader.total += share;
    }
  }
  requireRule(rows.every(row => Number.isSafeInteger(row.total)), 'INVALID_SCORE', 'คะแนนเกินขอบเขตที่คำนวณได้');
  rows.sort((a, b) => b.total - a.total || b.legalCount - a.legalCount);
  let rank = 1;
  const standings: ScoreRow[] = rows.map((row, index) => {
    if (index > 0 && (row.total !== rows[index - 1].total || row.legalCount !== rows[index - 1].legalCount)) rank = index + 1;
    return { ...row, rank };
  });
  return { standings, winners: standings.filter(row => row.rank === 1).map(row => row.playerId) };
}
