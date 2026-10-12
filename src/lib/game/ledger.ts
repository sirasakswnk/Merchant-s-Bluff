import { requireAmount, requireRule } from './errors';
import type { FinancialState, PaymentKind, PaymentOutcome, PlayerId } from './types';

function hasPlayer(state: FinancialState, id: PlayerId): boolean {
  return Object.hasOwn(state.cash, id);
}

export function cashTotal(state: FinancialState): number {
  return Object.values(state.cash).reduce((total, cash) => total + cash, 0);
}

/** Valid committed states have no spendable cash left while their own debts remain. */
export function assertFinancialState(state: FinancialState): void {
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const cash of Object.values(state.cash)) requireAmount(cash);
  requireAmount(cashTotal(state));
  requireRule(Number.isSafeInteger(state.nextOrder) && state.nextOrder > 0, 'INVALID_LEDGER', 'ลำดับบัญชีไม่ถูกต้อง');
  for (const debt of state.debts) {
    requireRule(!ids.has(debt.id) && debt.id.length > 0, 'INVALID_LEDGER', 'รหัสหนี้ซ้ำ');
    requireRule(hasPlayer(state, debt.debtor) && hasPlayer(state, debt.creditor) && debt.debtor !== debt.creditor,
      'INVALID_LEDGER', 'คู่กรณีของหนี้ไม่ถูกต้อง');
    requireAmount(debt.outstanding);
    requireRule(debt.outstanding > 0, 'INVALID_LEDGER', 'เก็บเฉพาะหนี้คงค้าง');
    requireRule(Number.isSafeInteger(debt.createdOrder) && debt.createdOrder > 0 && debt.createdOrder < state.nextOrder,
      'INVALID_LEDGER', 'ลำดับหนี้ไม่ถูกต้อง');
    requireRule(!orders.has(debt.createdOrder), 'INVALID_LEDGER', 'ลำดับบัญชีซ้ำ');
    requireRule(state.cash[debt.debtor] === 0, 'UNSETTLED_DEBT', 'ต้องชำระหนี้ก่อนใช้เงิน');
    ids.add(debt.id);
    orders.add(debt.createdOrder);
  }
  let previousOrder = 0;
  for (const entry of state.ledger) {
    requireAmount(entry.amount);
    requireRule(entry.amount > 0 && hasPlayer(state, entry.from) && hasPlayer(state, entry.to) && entry.from !== entry.to,
      'INVALID_LEDGER', 'รายการโอนเงินไม่ถูกต้อง');
    requireRule(Number.isSafeInteger(entry.order) && entry.order > previousOrder && entry.order < state.nextOrder && !orders.has(entry.order),
      'INVALID_LEDGER', 'ลำดับรายการโอนไม่ถูกต้อง');
    requireRule(entry.kind === 'DEBT_PAYMENT' ? typeof entry.debtId === 'string' : entry.debtId === null,
      'INVALID_LEDGER', 'รายการชำระหนี้ไม่ถูกต้อง');
    previousOrder = entry.order;
    orders.add(entry.order);
  }
}

export function createFinancialState(playerIds: readonly PlayerId[], startingCash: number): FinancialState {
  requireAmount(startingCash);
  requireRule(playerIds.length > 0 && new Set(playerIds).size === playerIds.length && playerIds.every(id => id.length > 0),
    'INVALID_PLAYERS', 'รายชื่อผู้เล่นซ้ำหรือว่าง');
  const state: FinancialState = {
    cash: Object.fromEntries(playerIds.map(id => [id, startingCash])), debts: [], ledger: [], nextOrder: 1,
  };
  assertFinancialState(state);
  return state;
}

/** Pure transaction: transfer existing coins, record any compulsory shortfall, then settle FIFO. */
export function pay(state: FinancialState, from: PlayerId, to: PlayerId, amount: number, kind: PaymentKind): PaymentOutcome {
  assertFinancialState(state);
  requireAmount(amount);
  requireRule(hasPlayer(state, from) && hasPlayer(state, to) && from !== to, 'INVALID_PLAYER', 'คู่กรณีไม่ถูกต้อง');
  requireRule(['BRIBE', 'COMPENSATION', 'FINE'].includes(kind), 'INVALID_PAYMENT', 'ประเภทการจ่ายไม่ถูกต้อง');
  requireRule(kind !== 'BRIBE' || amount <= state.cash[from], 'INSUFFICIENT_CASH', 'ห้ามกู้เงินเพื่อเสนอเงิน');
  const next = {
    cash: { ...state.cash }, debts: state.debts.map(debt => ({ ...debt })),
    ledger: state.ledger.map(entry => ({ ...entry })), nextOrder: state.nextOrder,
  };
  const paid = Math.min(amount, next.cash[from]);
  const debtCreated = amount - paid;
  next.cash[from] -= paid;
  if (paid > 0) {
    next.ledger.push({ order: next.nextOrder++, from, to, amount: paid, kind, debtId: null });
  }
  if (debtCreated > 0) {
    const createdOrder = next.nextOrder++;
    next.debts.push({ id: `debt-${createdOrder}`, debtor: from, creditor: to, outstanding: debtCreated, createdOrder });
  }
  next.cash[to] += paid;

  const recipients: PlayerId[] = paid > 0 ? [to] : [];
  for (let cursor = 0; cursor < recipients.length; cursor++) {
    const debtor = recipients[cursor];
    while (next.cash[debtor] > 0) {
      const oldest = next.debts
        .filter(debt => debt.debtor === debtor)
        .reduce<(typeof next.debts)[number] | undefined>((current, debt) =>
          !current || debt.createdOrder < current.createdOrder ? debt : current, undefined);
      if (!oldest) break;
      const repayment = Math.min(next.cash[debtor], oldest.outstanding);
      // Reduce the obligation before forwarding cash, including when debts form a cycle.
      oldest.outstanding -= repayment;
      next.cash[debtor] -= repayment;
      if (oldest.outstanding === 0) next.debts = next.debts.filter(debt => debt.id !== oldest.id);
      next.ledger.push({
        order: next.nextOrder++, from: debtor, to: oldest.creditor, amount: repayment,
        kind: 'DEBT_PAYMENT', debtId: oldest.id,
      });
      next.cash[oldest.creditor] += repayment;
      recipients.push(oldest.creditor);
    }
  }
  assertFinancialState(next);
  requireRule(cashTotal(next) === cashTotal(state), 'CASH_CONSERVATION', 'จำนวนเงินสดเปลี่ยนระหว่างโอน');
  return { state: next, paid, debtCreated };
}
