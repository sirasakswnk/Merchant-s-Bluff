'use client';
import { useState } from 'react';
import Image from 'next/image';
import { LEGAL_PRODUCT_IDS } from '@/lib/game/config';
import type { LegalProductId } from '@/lib/game/types';
import type { PrivateRoomView, PublicRoomView, RoomCommandRequest } from '@/lib/shared/rooms';

export type SendCommand = (command: RoomCommandRequest['command']) => Promise<void>;
function useDraft<T>(key: string, initial: T, persist: boolean) {
  const [value, setValue] = useState<T>(() => { if (!persist) return initial; try { return JSON.parse(sessionStorage.getItem(key) ?? 'null') ?? initial; } catch { return initial; } });
  return [value, (next: T) => { if (persist) sessionStorage.setItem(key, JSON.stringify(next)); setValue(next); }] as const;
}
export function MerchantControls({ room, own, disabled, draftDisabled, send, persistDraft = true }: { room: PublicRoomView; own: PrivateRoomView; disabled: boolean; draftDisabled: boolean; send: SendCommand; persistDraft?: boolean }) {
  const PRODUCTS = room.rules.products;
  const key = `merchant-draft:${room.roomId}:${own.playerId}:${room.gameId}:${room.roundIndex}:${room.phase}`;
  const [selection, setSelection] = useDraft<string[]>(key, [], persistDraft);
  const [declaration, setDeclaration] = useDraft<LegalProductId>(key + ':declaration', 'apple', persistDraft);
  const [amount, setAmount] = useDraft<string>(key + ':offer', '0', persistDraft);
  const packing = room.phase === 'PACK_AND_DECLARE'; const maximum = packing ? room.rules.maxBagSize : room.rules.maxExchange;
  if (room.phase === 'PREPARE' || packing) {
    if (own.prepared && !packing || packing && own.declaration) return <section className="panel"><h2>รอเพื่อน</h2><p>{packing ? 'ปิดกระเป๋าแล้ว แก้สินค้าและคำแจ้งไม่ได้' : 'เตรียมสินค้าแล้ว รอพ่อค้าทุกคนพร้อม'}</p></section>;
    return <section className="panel" aria-labelledby="hand-title">
      <h2 id="hand-title">{packing ? 'จัดกระเป๋าและแจ้งสินค้า' : 'เตรียมสินค้า'}</h2>
      <p>{packing ? `ใส่สินค้า ${room.rules.minBagSize}–${room.rules.maxBagSize} ใบ แจ้งสินค้าถูกกฎหมายชนิดเดียว จำนวนมาจากของจริง` : `เลือกเปลี่ยน 0–${room.rules.maxExchange} ใบได้หนึ่งครั้งต่อรอบ หรือพร้อมโดยไม่เปลี่ยนไพ่`}</p>
      <p aria-live="polite">เลือกแล้ว {selection.length}/{maximum} ใบ</p>
      <div className="hand">{own.hand.map(card => {
        const product = PRODUCTS[card.productId]; const selected = selection.includes(card.instanceId);
        return <button type="button" className={`card ${product.category}`} key={card.instanceId} aria-pressed={selected} data-card-id={card.instanceId} data-product={card.productId}
          disabled={draftDisabled || !selected && selection.length >= maximum} onClick={() => setSelection(selected ? selection.filter(id => id !== card.instanceId) : [...selection, card.instanceId])}>
          <Image unoptimized src={`/art/g-${card.productId}.svg`} alt="" width={48} height={48} /><strong>{product.name}</strong>
          <span>{product.category === 'legal' ? 'ถูกกฎหมาย' : 'ของต้องห้าม'}</span><span>มูลค่า {product.value}</span>
          <span>{product.category === 'legal' ? `ชดเชย ${product.compensation}` : `ค่าปรับ ${product.fine}`}</span><span>{selected ? '✓ เลือกแล้ว' : 'เลือกไพ่'}</span>
        </button>;
      })}</div>
      {packing ? <label>แจ้งสินค้า<select value={declaration} disabled={draftDisabled} onChange={event => setDeclaration(event.target.value as LegalProductId)}>
        {LEGAL_PRODUCT_IDS.map(id => <option key={id} value={id}>{PRODUCTS[id].name}</option>)}</select></label> : null}
      <button disabled={disabled || packing && selection.length < 1} onClick={() => void send(packing
        ? { type: 'lockBag', roundIndex: room.roundIndex, cardIds: selection, declaredProductId: declaration }
        : { type: 'prepareGoods', roundIndex: room.roundIndex, cardIds: selection })}>{packing ? 'ปิดกระเป๋าและยืนยัน' : 'พร้อมจัดกระเป๋า'}</button>
    </section>;
  }
  const player = room.players.find(player => player.id === own.playerId)!;
  if ((room.phase === 'NEGOTIATE' || room.phase === 'RESOLUTION') && !player.decisionId) {
    const valid = Number.isSafeInteger(Number(amount)) && amount.trim() !== '' && Number(amount) >= 0 && Number(amount) <= (player.cash ?? 0);
    return <section className="panel"><h2>เจรจาและข้อเสนอ</h2><p>เงินใช้ได้ {player.cash} เหรียญ ข้อเสนอนี้จ่ายเฉพาะให้นายด่านให้ผ่านโดยไม่ตรวจ</p>
      <p>{own.offer.submitted ? `ยืนยันล่าสุด: ${own.offer.amount === 0 ? 'ไม่เสนอเงิน' : `${own.offer.amount} เหรียญ`}` : 'ยังไม่เลือกข้อเสนอ'}</p>
      <form onSubmit={event => { event.preventDefault(); if (valid) void send({ type: 'setOffer', roundIndex: room.roundIndex, amount: Number(amount), expectedOfferVersion: own.offer.version }); }}>
        <label>ยอดเสนอเงิน<input type="number" min={0} max={player.cash ?? 0} step={1} inputMode="numeric" value={amount} disabled={draftDisabled} onChange={event => setAmount(event.target.value)} /></label>
        <div className="button-row"><button disabled={disabled || !valid} type="submit">เสนอเงิน</button><button className="secondary" type="button" disabled={disabled}
          onClick={() => void send({ type: 'setOffer', roundIndex: room.roundIndex, amount: 0, expectedOfferVersion: own.offer.version })}>ไม่เสนอเงิน</button></div>
      </form></section>;
  }
  return <section className="panel"><h2>รอผลและรอบถัดไป</h2><p>นายด่านเป็นผู้กดเดินรอบ ไม่มีตัวนับเวลา</p></section>;
}
export function SheriffControls({ room, disabled, send }: { room: PublicRoomView; disabled: boolean; send: SendCommand }) {
  const PRODUCTS = room.rules.products;
  const [confirmation, setConfirmation] = useState<{ merchantId: string; action: 'PASS' | 'INSPECT'; version: number; amount: number } | null>(null);
  if (room.phase === 'RESOLUTION') return <section className="panel"><h2>ผลตัดสินแล้ว</h2><button disabled={disabled}
    onClick={() => void send({ type: 'acknowledgeResolution', roundIndex: room.roundIndex, resolutionId: room.result!.id })}>
    {room.players.filter(player => player.id !== room.sheriffId).every(player => player.decisionId) ? 'สรุปรอบ' : 'เลือกพ่อค้าคนต่อไป'}</button></section>;
  if (room.phase === 'ROUND_SUMMARY') return <section className="panel"><h2>จบรอบ</h2><button disabled={disabled} onClick={() => void send({ type: 'endRound', roundIndex: room.roundIndex })}>
    {room.roundIndex === room.totalRounds ? 'ยืนยันจบรอบสุดท้ายและดูคะแนน' : 'จบรอบ / ส่งต่อตำแหน่งนายด่าน'}</button></section>;
  if (room.phase !== 'NEGOTIATE') return <section className="panel"><h2>คุณเป็นนายด่าน</h2><p>รอพ่อค้าเตรียมและปิดกระเป๋า มือของคุณเก็บไว้ตามเดิม เลือกพ่อค้าคนใดก่อนก็ได้เมื่อเริ่มเจรจา</p></section>;
  const target = room.players.find(player => player.id === room.selectedMerchantId);
  const confirmationTarget = room.players.find(player => player.id === confirmation?.merchantId);
  const changed = confirmation && (confirmationTarget?.offer?.version !== confirmation.version || room.selectedMerchantId !== confirmation.merchantId);
  return <section className="panel"><h2>เลือกพ่อค้าและตัดสิน</h2>
    <div className="button-row">{room.players.filter(player => player.id !== room.sheriffId && !player.decisionId).map(player =>
      <button className="secondary" key={player.id} aria-pressed={player.id === room.selectedMerchantId} disabled={disabled}
        onClick={() => { setConfirmation(null); void send({ type: 'selectMerchant', roundIndex: room.roundIndex, merchantId: player.id }); }}>เลือก {player.displayName}</button>)}</div>
    {target ? <div><h3>กำลังคุย: {target.displayName}</h3><p>แจ้งสินค้า {target.declaration ? `${PRODUCTS[target.declaration.productId].name} ${target.declaration.count} ใบ` : '—'}</p>
      <p>ข้อเสนอ {target.offer?.submitted ? `${target.offer.amount} เหรียญ` : 'ยังไม่เลือก'}</p>
      <div className="button-row"><button disabled={disabled || !target.offer?.submitted} onClick={() => setConfirmation({ merchantId: target.id, action: 'PASS', version: target.offer!.version, amount: target.offer!.amount })}>ให้ผ่าน</button>
        <button className="secondary" disabled={disabled || !target.offer?.submitted} onClick={() => setConfirmation({ merchantId: target.id, action: 'INSPECT', version: target.offer!.version, amount: target.offer!.amount })}>ตรวจ</button></div>
    </div> : <p>เลือกพ่อค้าที่ยังไม่ถูกตัดสิน ไม่จำเป็นต้องตามลำดับที่นั่ง</p>}
    {confirmation ? <section className="confirmation" aria-labelledby="confirm-title"><h3 id="confirm-title">ยืนยัน{confirmation.action === 'PASS' ? 'ให้ผ่าน' : 'ตรวจ'} {confirmationTarget?.displayName}</h3>
      <p>{confirmation.action === 'PASS' ? `สินค้าเข้าคลังโดยไม่เปิดตรวจ และจ่ายข้อเสนอ ${confirmation.amount} เหรียญ` : 'เปิดตรวจตามของจริง ไม่รับเงินข้อเสนอ'}</p>
      {changed ? <p role="alert">ข้อเสนอหรือพ่อค้าที่เลือกเปลี่ยนแล้ว กรุณายกเลิกและเปิดยืนยันใหม่</p> : null}
      <div className="button-row"><button disabled={disabled || !!changed} onClick={() => void send({ type: 'resolveMerchant', roundIndex: room.roundIndex,
        merchantId: confirmation.merchantId, action: confirmation.action, expectedOfferVersion: confirmation.version })}>ยืนยัน{confirmation.action === 'PASS' ? 'ให้ผ่าน' : 'ตรวจ'}</button>
        <button className="secondary" type="button" disabled={disabled} onClick={() => setConfirmation(null)}>ยกเลิก</button></div></section> : null}
  </section>;
}
