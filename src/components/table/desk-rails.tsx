import Image from 'next/image';
import type { ProductId, RulesSnapshot } from '@/lib/game/types';
import type { PrivateRoomView, PublicDecision, PublicRoomView } from '@/lib/shared/rooms';
import styles from './desk-rails.module.css';

/** Desktop side rails. Presentation only: reads the same public view and the viewer's own private view as the table. */
function nameOf(id: string, room: PublicRoomView) { return room.players.find(player => player.id === id)?.displayName ?? 'ผู้เล่น'; }
function countGoods(goods: readonly ProductId[], rules: RulesSnapshot) {
  return Object.values(rules.products).flatMap(product => { const count = goods.filter(id => id === product.id).length; return count ? [`${product.name} ${count}`] : []; }).join(' · ');
}
function Glyph({ productId, className = '' }: { productId: ProductId; className?: string }) {
  return <Image unoptimized className={`${styles.glyph} ${className}`} src={`/art/g-${productId}.svg`} alt="" width={28} height={28} aria-hidden="true" />;
}

function LedgerEntry({ event, room }: { event: PublicDecision; room: PublicRoomView }) {
  const merchant = nameOf(event.merchantId, room);
  if (event.action === 'PASS') return <li className={styles.entry} data-ledger-action="PASS">
    <p className={styles.entryLine}><span className={styles.stamp} data-stamp="pass">ผ่าน</span><strong>{merchant}</strong> · กระเป๋า {event.bagCount} ใบ</p>
    <p className={styles.entryMoney}>{event.paymentAmount > 0 ? `จ่ายข้อเสนอ ${event.paymentAmount} เหรียญ` : 'ไม่มีเงินข้อเสนอ'}</p>
    {event.contrabandPassed ? <p className={styles.smuggled}>มีของต้องห้ามผ่านด่าน!</p> : null}
  </li>;
  const seized = event.confiscated!.length > 0;
  return <li className={styles.entry} data-ledger-action="INSPECT">
    <p className={styles.entryLine}><span className={styles.stamp} data-stamp={seized ? 'seize' : 'inspect'}>{seized ? 'ยึด' : 'ตรวจ'}</span><strong>{merchant}</strong> · กระเป๋า {event.bagCount} ใบ</p>
    <p className={styles.entryGoods}>{countGoods(event.revealed!, room.rules)}</p>
    <p className={styles.entryMoney}>{seized ? `ยึด ${countGoods(event.confiscated!, room.rules)} · ปรับ ${event.paymentAmount} เหรียญ` : `นายด่านชดเชย ${event.paymentAmount} เหรียญ`}</p>
  </li>;
}

export function TableLedger({ room }: { room: PublicRoomView }) {
  const rounds = [...new Set(room.history.map(event => event.roundIndex))].sort((a, b) => b - a);
  return <section className={`${styles.paper} ${styles.ledger}`} aria-labelledby="ledger-title" data-table-ledger>
    <h2 id="ledger-title">สมุดบันทึกด่าน</h2>
    {rounds.length === 0 ? <p className={styles.empty}>ยังไม่มีการตัดสิน ผลที่เปิดเผยได้จะบันทึกที่นี่</p> : <ol className={styles.rounds} tabIndex={0} aria-label="บันทึกการตัดสินทุกรอบ">
      {rounds.map(round => { const events = room.history.filter(event => event.roundIndex === round); return <li key={round}>
        <h3>รอบ {round} · นายด่าน {nameOf(events[0].sheriffId, room)}</h3>
        <ol className={styles.entries}>{events.map(event => <LedgerEntry key={event.id} event={event} room={room} />)}</ol>
      </li>; })}
    </ol>}
  </section>;
}

export function PlayerAid({ rules }: { rules: RulesSnapshot }) {
  const products = Object.values(rules.products);
  return <section className={`${styles.paper} ${styles.aid}`} aria-labelledby="aid-title" data-player-aid>
    <h2 id="aid-title">การ์ดช่วยจำ</h2>
    <table className={styles.aidTable}>
      <thead><tr><th scope="col">สินค้า</th><th scope="col">มูลค่า</th><th scope="col">ชดเชย</th><th scope="col">ปรับ</th></tr></thead>
      <tbody>{products.map(product => <tr key={product.id} data-category={product.category}>
        <th scope="row"><Glyph productId={product.id} />{product.name}</th>
        <td>{product.value}</td><td>{product.compensation || '–'}</td><td>{product.fine || '–'}</td>
      </tr>)}</tbody>
    </table>
    <p className={styles.aidNote}>โบนัส +{rules.legalMajorityBonus} ต่อสินค้าถูกกฎหมายที่ถือมากสุด · ตรวจไม่โอนเงินข้อเสนอ</p>
  </section>;
}

export function MyWarehouse({ own, rules }: { own: PrivateRoomView; rules: RulesSnapshot }) {
  const products = Object.values(rules.products);
  return <section className={`${styles.paper} ${styles.warehouse}`} aria-labelledby="warehouse-title" data-my-warehouse>
    <h2 id="warehouse-title">โกดังของฉัน</h2>
    <ul className={styles.piles}>{products.map(product => { const count = own.stash.filter(card => card.productId === product.id).length; return <li key={product.id} className={styles.pile} data-empty={count === 0} data-category={product.category}>
      <span className={styles.pileStack} aria-hidden="true"><Glyph productId={product.id} /></span>
      <span className={styles.pileName}>{product.name}</span><strong>{count}</strong>
    </li>; })}</ul>
    <p className={styles.worth}><span>มูลค่าในคลัง</span><span><strong>{own.goodsValue}</strong> คะแนน</span></p>
    {own.bag.length > 0 ? <p className={styles.bagNote}>กระเป๋าที่ปิดอยู่: {countGoods(own.bag.map(card => card.productId), rules)}</p> : null}
    <p className={styles.private}>เห็นเฉพาะคุณ · โบนัสคิดเมื่อจบเกม</p>
  </section>;
}

export function DebtNotes({ room, playerId }: { room: PublicRoomView; playerId: string }) {
  return <section className={`${styles.paper} ${styles.debts}`} aria-labelledby="debts-title" data-debt-notes>
    <h2 id="debts-title">บัญชีหนี้</h2>
    {room.debts.length === 0 ? <p className={styles.empty}>ยังไม่มีหนี้คงค้าง</p> : <ul className={styles.notes}>
      {room.debts.map(debt => <li key={debt.id} className={styles.note} data-mine={debt.debtor === playerId || debt.creditor === playerId}>
        <span><strong>{nameOf(debt.debtor, room)}</strong> ติด <strong>{nameOf(debt.creditor, room)}</strong></span><span className={styles.noteAmount}>{debt.outstanding} เหรียญ</span>
      </li>)}
    </ul>}
  </section>;
}
