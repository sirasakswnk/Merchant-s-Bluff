'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { anonymousUser } from '@/lib/client/firebase';
import { ApiError, PENDING_KEY, postRoom, resumeRoom, tabClientId, watchPresence, watchRoom, type PendingRequest } from '@/lib/client/rooms';
import { GAME_NAME } from '@/lib/game/config';
import type { RulesSnapshot } from '@/lib/game/types';
import { clientUuid } from '@/lib/client/uuid';
import { RulesSummary } from './rules-summary';
import type { PrivateRoomView, PublicRoomView, RoomCommandRequest } from '@/lib/shared/rooms';
import { MerchantControls, SheriffControls } from './game-controls';

const PHASE_LABELS = { LOBBY: 'ล็อบบี้', PREPARE: 'เตรียมสินค้า', PACK_AND_DECLARE: 'จัดกระเป๋าและแจ้งสินค้า', NEGOTIATE: 'เจรจา',
  RESOLUTION: 'ผลการตัดสิน', ROUND_SUMMARY: 'สรุปรอบ', GAME_OVER: 'จบเกม' } as const;
function names(ids: readonly string[], room: PublicRoomView): string {
  return ids.map(id => room.players.find(player => player.id === id)?.displayName ?? 'ผู้เล่น').join(', ');
}
function listGoods(goods: readonly string[], rules: RulesSnapshot): string {
  return Object.values(rules.products).flatMap(product => { const count = goods.filter(id => id === product.id).length; return count ? [`${product.name} ${count} ใบ`] : []; }).join(', ') || 'ไม่มีสินค้า';
}
export function RoomClient({ roomId }: { roomId: string }) {
  const [identity, setIdentity] = useState<{ uid: string; clientId: string } | null>(null);
  const [views, setViews] = useState<{ room: PublicRoomView; own: PrivateRoomView; animateResult: boolean } | null>(null);
  const [connected, setConnected] = useState(false); const [network, setNetwork] = useState(true); const [synced, setSynced] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<ReadonlySet<string>>(new Set());
  const [minimumRevision, setMinimumRevision] = useState(0);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<PendingRequest | null>(null); const busyRef = useRef(false);
  useEffect(() => {
    let active = true; let stopViews = () => {}; let stopPresence = () => {}; let received = false; let lastResult = '';
    const onNetwork = () => setNetwork(navigator.onLine);
    window.addEventListener('online', onNetwork); window.addEventListener('offline', onNetwork);
    void (async () => {
      try {
        const user = await anonymousUser(); const resumed = await resumeRoom(roomId); if (!active) return;
        setMinimumRevision(resumed.revision);
        const clientId = tabClientId(); setIdentity({ uid: user.uid, clientId }); setNetwork(navigator.onLine);
        localStorage.setItem('merchant-active-room', JSON.stringify({ roomId, uid: user.uid }));
        const saved = sessionStorage.getItem(PENDING_KEY);
        if (saved) { try { const value = JSON.parse(saved) as PendingRequest; if (value.uid === user.uid && value.body.roomId === roomId) { setPending(value); setError('มีคำสั่งที่ยังยืนยันผลไม่ได้ กรุณาลองคำสั่งเดิม'); } } catch { sessionStorage.removeItem(PENDING_KEY); } }
        stopViews = watchRoom(roomId, user.uid, (room, own) => {
          if (!active) return;
          const resultId = room.result?.id ?? '';
          const key = `merchant-last-result:${roomId}:${user.uid}`;
          const animateResult = received && resultId !== '' && resultId !== lastResult && resultId !== sessionStorage.getItem(key);
          received = true; lastResult = resultId;
          if (resultId) sessionStorage.setItem(key, resultId);
          // Keep the one-shot CSS event attached to this result through unrelated view updates.
          setViews(previous => ({ room, own, animateResult: previous?.room.result?.id === resultId ? previous.animateResult : animateResult }));
        }, error => { if (active) { setError(error.message); setSynced(false); } }, ready => { if (active) setSynced(ready); });
        stopPresence = watchPresence(roomId, user.uid, value => { if (active) setConnected(value); }, value => { if (active) setOnlinePlayers(value); });
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'เชื่อมต่อห้องไม่ได้'); }
    })();
    return () => { active = false; stopViews(); stopPresence(); window.removeEventListener('online', onNetwork); window.removeEventListener('offline', onNetwork); };
  }, [roomId]);
  const controlled = identity !== null && views?.own.controlClientId === identity.clientId;
  const available = connected && network && synced && !!views && views.room.revision >= minimumRevision && !!identity;
  const disabled = !available || !controlled || busy || !!pending;
  async function dispatch(command?: RoomCommandRequest['command']) {
    if (!identity || !views || !available || busyRef.current) return;
    if (!pending && !command) return;
    const request: PendingRequest = pending ?? {
      uid: identity.uid, path: '/api/rooms/command', body: { roomId, commandId: clientUuid(), clientId: identity.clientId,
        sessionGeneration: views.own.sessionGeneration, gameId: views.room.gameId, command },
    };
    busyRef.current = true; setBusy(true); setError(''); sessionStorage.setItem(PENDING_KEY, JSON.stringify(request));
    try {
      const receipt = await postRoom(request); setMinimumRevision(previous => Math.max(previous, receipt.revision)); sessionStorage.removeItem(PENDING_KEY); setPending(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ส่งคำสั่งไม่สำเร็จ');
      if (error instanceof ApiError && !error.uncertain && error.code !== 'OFFLINE') { sessionStorage.removeItem(PENDING_KEY); setPending(null); }
      else setPending(request);
    } finally { busyRef.current = false; setBusy(false); }
  }
  if (!views || !identity) return <main id="main" tabIndex={-1} className="loading-page"><h1>{GAME_NAME}</h1><p aria-live="polite">กำลังเชื่อมต่อห้อง…</p>{error ? <p role="alert" className="notice">{error}</p> : null}<Link className="button secondary" href="/">กลับหน้าแรก</Link></main>;
  const { room, own, animateResult } = views;
  const PRODUCTS = room.rules.products;
  const goodsList = (goods: readonly string[]) => listGoods(goods, room.rules);
  const me = room.players.find(player => player.id === identity.uid)!; const isSheriff = room.sheriffId === identity.uid; const isHost = room.hostId === identity.uid;
  const draftKey = `${room.gameId}:${room.roundIndex}:${room.phase}`;
  const nextHost = room.players.find(player => player.id !== room.hostId && onlinePlayers.has(player.id));
  const result = room.result;
  return <main id="main" tabIndex={-1} className="room-table" data-phase={room.phase} data-round={room.roundIndex} data-revision={room.revision} data-own-role={isSheriff ? 'sheriff' : 'merchant'}>
    <header className="room-header"><div><p className="eyebrow">{GAME_NAME}</p><h1>ห้อง <span data-testid="room-code">{room.code}</span></h1></div>
      <Link className="button secondary" href="/">หน้าแรก</Link></header>
    <p className="connection-state" role="status">{!network || !connected ? 'กำลังเชื่อมต่อใหม่ · ปุ่มส่งคำสั่งปิดชั่วคราว' : !synced || room.revision < minimumRevision ? 'กำลังรอข้อมูลล่าสุด' : busy ? 'กำลังยืนยันคำสั่ง…' : 'เชื่อมต่อแล้ว'}{!controlled ? ' · แท็บนี้อ่านอย่างเดียว' : ''}</p>
    {error ? <p className="notice" role="alert">{error}</p> : null}
    {pending ? <section className="panel"><h2>ยังยืนยันผลคำสั่งไม่ได้</h2><p>คำสั่งอาจสำเร็จแล้ว ลองคำสั่งเดิมเพื่อตรวจผลก่อนทำรายการใหม่</p><button disabled={!available || busy} onClick={() => void dispatch()}>ลองคำสั่งเดิมอีกครั้ง</button></section> : null}
    {!controlled && !pending ? <section className="panel"><h2>เลือกแท็บควบคุม</h2><p>อีกแท็บกำลังควบคุมที่นั่งนี้ คุณยังอ่านข้อมูลของตัวเองได้</p>
      <button disabled={!available || busy} onClick={() => void dispatch({ type: 'claimControl' })}>ใช้แท็บนี้ควบคุม</button></section> : null}
    <section className="panel"><h2>{PHASE_LABELS[room.phase]}{room.gameId ? ` · รอบ ${room.roundIndex}/${room.totalRounds}` : ''}</h2>
      {room.sheriffId ? <p>นายด่าน: <strong>{names([room.sheriffId], room)}</strong> · คุณเป็น{isSheriff ? 'นายด่าน' : 'พ่อค้า'}</p> : <p>คุยกับเพื่อนผ่านแอปที่คุณใช้ แล้วเล่นบนหน้านี้ ต้องมี 4–6 คนและทุกคนพร้อม</p>}
      <div className="players">{room.players.map(player => <article className={`player ${player.id === room.selectedMerchantId ? 'selected' : ''}`} key={player.id} data-player-id={player.id}>
        <h3>{player.displayName}{player.id === identity.uid ? ' (คุณ)' : ''}</h3>
        <p>{player.id === room.hostId ? 'ผู้จัดห้อง · ' : ''}{player.id === room.sheriffId ? 'นายด่าน · ' : ''}{onlinePlayers.has(player.id) ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อมต่อ'}</p>
        <p>{room.lifecycle === 'LOBBY' ? player.ready ? 'พร้อมแล้ว' : 'ยังไม่พร้อม' : `เงิน ${player.cash} เหรียญ`}</p>
        {room.phase === 'PREPARE' && player.id !== room.sheriffId ? <p>{player.prepared ? 'เตรียมแล้ว' : 'กำลังเตรียม'}</p> : null}
        {room.phase === 'PACK_AND_DECLARE' && player.id !== room.sheriffId ? <p>{player.bagLocked ? 'ปิดกระเป๋าแล้ว' : 'กำลังจัดกระเป๋า'}</p> : null}
        {player.declaration ? <p>แจ้งสินค้า {PRODUCTS[player.declaration.productId].name} {player.declaration.count} ใบ</p> : null}
        {player.offer ? <p>{player.offer.submitted ? player.offer.amount === 0 ? 'ไม่เสนอเงิน' : `เสนอ ${player.offer.amount} เหรียญ` : 'ยังไม่เลือกข้อเสนอ'}{player.decisionId ? ' · ตัดสินแล้ว' : ''}</p> : null}
      </article>)}</div>
      {room.debts.length > 0 ? <details><summary>หนี้คงค้าง</summary><ul>{room.debts.map(debt => <li key={debt.id}>{names([debt.debtor], room)} → {names([debt.creditor], room)}: {debt.outstanding} เหรียญ</li>)}</ul></details> : null}
    </section>
    {room.lifecycle === 'LOBBY' ? <section className="panel"><h2>เตรียมเข้าตลาด</h2><p>รหัสห้อง <strong>{room.code}</strong></p>
      <label>ลิงก์ชวนเพื่อน<input readOnly value={`${typeof location === 'undefined' ? '' : location.origin}/?room=${room.code}`} /></label>
      <div className="button-row"><button className="secondary" onClick={() => {
        if (!navigator.clipboard) { setError('เลือกลิงก์ชวนเพื่อน แล้วคัดลอกด้วยเมนูของเครื่องได้'); return; }
        void navigator.clipboard.writeText(`${location.origin}/?room=${room.code}`).then(() => setCopied(true)).catch(() => setError('คัดลอกไม่ได้ เลือกลิงก์แล้วคัดลอกเองได้'));
      }}>คัดลอกลิงก์</button>
        <button disabled={disabled} onClick={() => void dispatch({ type: 'setReady', ready: !me.ready })}>{me.ready ? 'ยกเลิกพร้อม' : 'พร้อม'}</button>
        {isHost ? <button disabled={disabled || room.players.length < 4 || room.players.some(player => !player.ready)} onClick={() => void dispatch({ type: 'startGame' })}>เริ่มเกม</button> : null}
        {!onlinePlayers.has(room.hostId) && nextHost?.id === identity.uid ? <button className="secondary" disabled={disabled} onClick={() => void dispatch({ type: 'claimHost' })}>รับตำแหน่งผู้จัดห้อง</button> : null}</div>
      {copied ? <p aria-live="polite">คัดลอกลิงก์แล้ว</p> : null}</section>
      : room.lifecycle === 'ABORTED' ? <section className="panel"><h2>ยุติเกมแล้ว</h2><p>เกมนี้ไม่มีผู้ชนะ ผู้จัดห้องสามารถเปิดให้ทุกคนพร้อมใหม่ได้</p>{isHost ? <button disabled={disabled} onClick={() => void dispatch({ type: 'requestRematch' })}>กลับล็อบบี้เพื่อเล่นใหม่</button> : null}</section>
      : room.lifecycle === 'FINISHED' ? <section className="panel" aria-labelledby="score-title"><h2 id="score-title">คะแนนสุดท้าย</h2><p>ผู้ชนะ: <strong>{names(room.scores!.winners, room)}</strong></p>
        <div className="scores">{room.scores!.standings.map(score => <article className="player" key={score.playerId}><h3>อันดับ {score.rank} · {names([score.playerId], room)}</h3>
          <p><strong>{score.total} คะแนน</strong> · สินค้าถูกกฎหมาย {score.legalCount} ใบ</p>
          <dl>{[['เงินสด', score.cash], ['มูลค่าสินค้า', score.goodsValue], ['โบนัสการค้า', score.bonus], ['ลูกหนี้คงค้าง', score.receivable], ['หนี้คงค้าง', score.debt]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p>{Object.values(PRODUCTS).map(product => `${product.name} ${score.counts[product.id]} ใบ`).join(' · ')}</p></article>)}</div>
        {isHost ? <button disabled={disabled} onClick={() => void dispatch({ type: 'requestRematch' })}>กลับล็อบบี้เพื่อเล่นใหม่</button> : null}</section>
      : isSheriff ? <SheriffControls key={draftKey} room={room} disabled={disabled} send={dispatch} />
        : <MerchantControls key={draftKey} room={room} own={own} disabled={disabled} draftDisabled={!controlled || busy || !!pending} send={dispatch} />}
    {result && room.lifecycle === 'PLAYING' ? <section className="panel result" data-result-id={result.id} aria-labelledby="result-title"><h2 id="result-title">ผลของ {names([result.merchantId], room)}</h2>
      <div className={`result-bag ${result.contrabandPassed && animateResult ? 'glow' : ''}`} aria-hidden="true"><Image unoptimized src="/art/bag.svg" alt="" width={80} height={80} /></div>
      <p>{result.action === 'PASS' ? `ให้ผ่าน กระเป๋า ${result.bagCount} ใบเข้าคลัง จ่ายข้อเสนอ ${result.paymentAmount} เหรียญ` : `ตรวจสินค้า: ${goodsList(result.revealed!)}`}</p>
      {result.action === 'INSPECT' ? <><p>ผ่าน: {goodsList(result.passed!)} · ยึด: {goodsList(result.confiscated!)}</p><p>{result.paymentKind === 'FINE' ? 'ค่าปรับ' : 'ค่าชดเชย'} {result.paymentAmount} เหรียญ · ไม่โอนเงินข้อเสนอ</p></> : null}
      {result.contrabandPassed ? <p className="contraband-note">มีของต้องห้ามผ่านด่าน!</p> : null}</section> : null}
    {room.gameId && room.lifecycle === 'PLAYING' ? <details className="panel"><summary>มือและคลังสินค้าของฉัน</summary><p>มือ: {goodsList(own.hand.map(card => card.productId))}</p><p>กระเป๋าที่ปิด: {goodsList(own.bag.map(card => card.productId))}</p>
      <p>คลัง: {goodsList(own.stash.map(card => card.productId))}</p><p>มูลค่าสินค้าในคลัง {own.goodsValue} คะแนน · โบนัสคิดเมื่อจบเกม</p></details> : null}
    {room.history.length > 0 ? <details className="panel"><summary>ประวัติผลที่เปิดเผย</summary><ol>{room.history.map(event => <li key={event.id}>รอบ {event.roundIndex} · {names([event.merchantId], room)} · {event.action === 'PASS' ? 'ให้ผ่าน' : 'ตรวจ'}
      {event.action === 'INSPECT' ? ` · ${goodsList(event.revealed!)}` : event.contrabandPassed ? ' · มีของต้องห้ามผ่านด่าน!' : ''} · {event.paymentAmount} เหรียญ</li>)}</ol></details> : null}
    <RulesSummary rules={room.rules} />
    {isHost && room.lifecycle === 'PLAYING' ? <footer><button className="secondary" disabled={disabled} onClick={() => { if (window.confirm('ยุติเกมนี้โดยไม่มีผู้ชนะ? ทุกคนจะกลับมาเปิดเกมใหม่ได้')) void dispatch({ type: 'abortGame' }); }}>ยุติเกมนี้</button></footer> : null}
  </main>;
}
