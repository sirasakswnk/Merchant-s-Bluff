import Image from 'next/image';
import type { ProductId, RulesSnapshot } from '@/lib/game/types';
import type { PrivateRoomView, PublicDecision, PublicRoomView } from '@/lib/shared/rooms';
import styles from './board-wings.module.css';

/** Desktop wings beside the round table. Presentation only: the same public view and the viewer's own private view as the table. */
function nameOf(id: string, room: PublicRoomView) { return room.players.find(player => player.id === id)?.displayName ?? 'ผู้เล่น'; }
function tally(goods: readonly ProductId[], rules: RulesSnapshot) {
  return Object.values(rules.products).flatMap(product => { const count = goods.filter(id => id === product.id).length; return count ? [`${product.name} ×${count}`] : []; }).join(', ');
}
function BrassPin() { return <span className={styles.brassPin} aria-hidden="true" />; }

export function PriceBoard({ rules }: { rules: RulesSnapshot }) {
  const products = Object.values(rules.products);
  const row = (product: (typeof products)[number]) => <li key={product.id} className={styles.tariffRow} data-category={product.category}>
    <span className={styles.goodIdentity}><Image unoptimized src={`/art/g-${product.id}.svg`} alt="" width={19} height={19} />{product.name}</span>
    {product.category === 'legal'
      ? <span className={styles.metrics}><span className={styles.valuePill}>มูลค่า {product.value}</span><span className={styles.metricNote}>ชดเชย {product.compensation}</span></span>
      : <span className={styles.metrics}><span className={styles.valuePill} data-contraband>มูลค่า {product.value}</span><span className={styles.fineNote}>ปรับ {product.fine}</span></span>}
  </li>;
  return <section className={styles.parchment} aria-labelledby="price-board-title" data-price-board>
    <header className={styles.boardHeader}><BrassPin /><div><p className={styles.kicker}>ประกาศประจำเมือง</p><h2 id="price-board-title">ป้ายราคาตลาดและค่าปรับ</h2></div><BrassPin /></header>
    <div className={styles.tariffGroup}>
      <p className={styles.groupHeading}><span className={styles.legalTag}>สินค้าถูกกฎหมาย</span><span className={styles.bonusNote}>เจ้าตลาด +{rules.legalMajorityBonus}</span></p>
      <ul className={styles.tariffList}>{products.filter(product => product.category === 'legal').map(row)}</ul>
    </div>
    <div className={styles.tariffGroup}>
      <p className={styles.groupHeading}><span className={styles.contrabandTag}>ของต้องห้าม (ยึดเมื่อตรวจพบ)</span></p>
      <ul className={styles.tariffList}>{products.filter(product => product.category === 'contraband').map(row)}</ul>
    </div>
    <p className={styles.boardNote}>มูลค่าสินค้าในคลัง = คะแนนตอนจบเกม รวมกับเงินสดและโบนัสเจ้าตลาด</p>
  </section>;
}

export function SupplyTray({ room }: { room: PublicRoomView }) {
  const sheriffIndex = room.players.findIndex(player => player.id === room.sheriffId);
  // Engine rotation: the sheriff of round r + 1 sits right after the sheriff of round r in seat order.
  const next = room.lifecycle !== 'PLAYING' ? 'จบเกมแล้ว' : room.roundIndex >= room.totalRounds ? 'รอบสุดท้ายแล้ว' : sheriffIndex < 0 ? '–' : room.players[(sheriffIndex + 1) % room.players.length].displayName;
  const supply = room.supplyCount ?? null;
  return <section className={styles.woodTray} aria-labelledby="supply-title" data-supply-tray>
    <header className={styles.trayHeader}><h2 id="supply-title">กองไพ่และคิวนายด่าน</h2><span className={styles.trayBadge}>สำรับ {room.rules.totalCards} ใบ</span></header>
    <div className={styles.propsRow} aria-hidden="true">
      <div className={styles.deckProp}><div className={styles.deckPile}><span /><span /><span /></div><small>กองจั่ว</small></div>
      <div className={styles.deckProp}><div className={styles.discardPile}><span /><span /></div><small>กองทิ้ง / ของยึด</small></div>
    </div>
    <dl className={styles.rotationMeta}>
      {supply !== null ? <div><dt>ไพ่ในกองกลาง</dt><dd data-supply-count={supply}>{supply} ใบ</dd></div> : null}
      <div><dt>รอบปัจจุบัน</dt><dd>{room.roundIndex} / {room.totalRounds}</dd></div>
      <div><dt>นายด่านรอบนี้</dt><dd>{room.sheriffId ? nameOf(room.sheriffId, room) : '–'}</dd></div>
      <div><dt>คิวถัดไป</dt><dd>{next}</dd></div>
    </dl>
    {supply !== null ? <p className={styles.trayNote}>กองกลาง = กองจั่วรวมกองทิ้ง</p> : null}
  </section>;
}

export function MyWarehouse({ own, rules }: { own: PrivateRoomView; rules: RulesSnapshot }) {
  return <section className={styles.parchment} aria-labelledby="warehouse-title" data-my-warehouse>
    <header className={styles.boardHeader}><BrassPin /><div><p className={styles.kicker}>แผงร้านค้าหน้าตัก · เห็นเฉพาะคุณ</p><h2 id="warehouse-title">คลังสินค้าของฉัน</h2></div><BrassPin /></header>
    <div className={styles.stashSummary}>
      <p><span>สินค้าผ่านด่านแล้ว</span><strong>{own.stash.length} ใบ</strong></p>
      <p data-score><span>คะแนนจากสินค้า</span><strong>{own.goodsValue} คะแนน</strong></p>
    </div>
    <ul className={styles.stashGrid}>{Object.values(rules.products).map(product => { const count = own.stash.filter(card => card.productId === product.id).length; return <li key={product.id} className={styles.stashSlot} data-active={count > 0} data-category={product.category}>
      <span className={styles.stashThumb} aria-hidden="true"><Image src={`/art/cards/${product.id}.webp`} alt="" width={1024} height={1536} sizes="3.5rem" draggable={false} /><span className={styles.countBadge}>×{count}</span></span>
      <span className={styles.stashName}>{product.name}<span className={styles.srOnly}> {count} ใบ</span></span>
    </li>; })}</ul>
    {own.bag.length > 0 ? <p className={styles.bagFootnote}>กระเป๋าที่ปิดรอบนี้ ({own.bag.length} ใบ): {tally(own.bag.map(card => card.productId), rules)}</p> : null}
  </section>;
}

function HistoryItem({ event, room }: { event: PublicDecision; room: PublicRoomView }) {
  const seized = event.action === 'INSPECT' && event.confiscated!.length > 0;
  return <li className={styles.historyItem} data-ledger-action={event.action}>
    <p className={styles.historyTop}><strong>รอบ {event.roundIndex} · {nameOf(event.merchantId, room)}</strong><span className={styles.stamp} data-stamp={event.action === 'PASS' ? 'pass' : 'inspect'}>{event.action === 'PASS' ? 'ให้ผ่าน' : 'เปิดตรวจ'}</span></p>
    <p className={styles.historyDetail}>{event.action === 'PASS'
      ? <>กระเป๋า {event.bagCount} ใบ · {event.paymentAmount > 0 ? `ข้อเสนอ ${event.paymentAmount} เหรียญ` : 'ไม่มีเงินข้อเสนอ'}{event.contrabandPassed ? <> · <span className={styles.smuggled}>มีของต้องห้ามผ่านด่าน!</span></> : null}</>
      : <>พบ: {tally(event.revealed!, room.rules)}{seized ? ` · ยึด: ${tally(event.confiscated!, room.rules)} (ปรับ ${event.paymentAmount} เหรียญ)` : ` (ชดเชย ${event.paymentAmount} เหรียญ)`}</>}</p>
  </li>;
}

export function LedgerTray({ room, playerId }: { room: PublicRoomView; playerId: string }) {
  const history = [...room.history].reverse();
  return <section className={styles.woodTray} aria-labelledby="ledger-title" data-table-ledger>
    <header className={styles.trayHeader}><h2 id="ledger-title">บันทึกหน้าด่านและตั๋วหนี้</h2><span className={styles.trayBadge}>{room.debts.length ? `หนี้ ${room.debts.length} รายการ` : 'ไม่มีหนี้'}</span></header>
    <div className={styles.ledgerSection}>
      <h3>ตั๋วหนี้คงค้าง (หักอัตโนมัติตามคิว)</h3>
      {room.debts.length === 0 ? <p className={styles.trayEmpty}>ยังไม่มีหนี้คงค้าง</p> : <ul className={styles.iouList}>{room.debts.map(debt =>
        <li key={debt.id} className={styles.iouTicket} data-mine={debt.debtor === playerId || debt.creditor === playerId}><span>{nameOf(debt.debtor, room)} → {nameOf(debt.creditor, room)}</span><strong>{debt.outstanding} เหรียญ</strong></li>)}</ul>}
    </div>
    <div className={styles.ledgerSection}>
      <h3>บันทึกผลการตัดสิน</h3>
      {history.length === 0 ? <p className={styles.trayEmpty}>ยังไม่มีการตัดสิน</p>
        : <ol className={styles.historyList} tabIndex={0} aria-label="ผลการตัดสินทุกครั้ง ใหม่สุดก่อน">{history.map(event => <HistoryItem key={event.id} event={event} room={room} />)}</ol>}
    </div>
  </section>;
}
