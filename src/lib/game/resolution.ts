import { requireAmount, requireRule } from './errors';
import { assertFinancialState, pay } from './ledger';
import type { BagResolution, CardInstance, FinancialState, LegalProductId, Offer, PlayerId, RulesSnapshot } from './types';

interface ResolveBagInput {
  readonly cards: readonly CardInstance[];
  readonly declaredProductId: LegalProductId;
  readonly action: 'PASS' | 'INSPECT';
  readonly merchantId: PlayerId;
  readonly sheriffId: PlayerId;
  readonly offer: Offer;
  readonly finances: FinancialState;
  readonly rules: RulesSnapshot;
}

/** Internal calculation only. Phase/ownership/idempotency checks belong to the command engine. */
export function resolveBag(input: ResolveBagInput): BagResolution {
  const { cards, rules, finances, merchantId, sheriffId, offer, action } = input;
  assertFinancialState(finances);
  requireRule(action === 'PASS' || action === 'INSPECT', 'INVALID_ACTION', 'การตัดสินไม่ถูกต้อง');
  requireRule(Object.hasOwn(finances.cash, merchantId) && Object.hasOwn(finances.cash, sheriffId) && merchantId !== sheriffId,
    'INVALID_PLAYER', 'คู่กรณีไม่ถูกต้อง');
  requireRule(cards.length >= rules.minBagSize && cards.length <= rules.maxBagSize, 'INVALID_BAG_SIZE', 'กระเป๋าต้องมีสินค้า 1–5 ใบ');
  requireRule(new Set(cards.map(card => card.instanceId)).size === cards.length && cards.every(card =>
    card.instanceId.length > 0 && Object.hasOwn(rules.products, card.productId)), 'INVALID_CARDS', 'ไพ่ซ้ำหรือไม่อยู่ในสินค้า');
  requireRule(Object.hasOwn(rules.products, input.declaredProductId) && rules.products[input.declaredProductId].category === 'legal',
    'INVALID_DECLARATION', 'แจ้งสินค้าได้เฉพาะสินค้าถูกกฎหมาย');
  requireRule(offer.submitted && Number.isSafeInteger(offer.version) && offer.version > 0,
    'OFFER_REQUIRED', 'พ่อค้าต้องยืนยันเสนอเงินหรือไม่เสนอเงินก่อน');
  requireAmount(offer.amount);
  requireRule(offer.amount <= finances.cash[merchantId], 'INSUFFICIENT_CASH', 'ข้อเสนอเกินเงินใช้ได้ ต้องยืนยันใหม่');
  const contraband = cards.filter(card => rules.products[card.productId].category === 'contraband');
  const confiscated = action === 'INSPECT' ? contraband : [];
  const passed = cards.filter(card => !confiscated.includes(card));
  const paymentKind = action === 'PASS' ? 'BRIBE' : contraband.length > 0 ? 'FINE' : 'COMPENSATION';
  const paymentAmount = action === 'PASS' ? offer.amount : contraband.length > 0
    ? contraband.reduce((total, card) => total + rules.products[card.productId].fine, 0)
    : cards.reduce((total, card) => total + rules.products[card.productId].compensation, 0);
  const payment = paymentKind === 'COMPENSATION'
    ? pay(finances, sheriffId, merchantId, paymentAmount, paymentKind)
    : pay(finances, merchantId, sheriffId, paymentAmount, paymentKind);
  return {
    action, bagCount: cards.length,
    passed: passed.map(card => ({ ...card })), confiscated: confiscated.map(card => ({ ...card })),
    revealed: action === 'INSPECT' ? cards.map(card => ({ ...card })) : null,
    contrabandPassed: action === 'PASS' && contraband.length > 0,
    paymentKind, paymentAmount, finances: payment.state,
  };
}
