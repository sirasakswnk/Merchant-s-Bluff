'use client';
import Image from 'next/image';
import Link from 'next/link';
import { GAME_NAME } from '@/lib/game/config';
import type { RulesSnapshot } from '@/lib/game/types';
import type { PrivateRoomView, PublicRoomView, RoomCommandRequest } from '@/lib/shared/rooms';
import { RulesSummary } from './rules-summary';
import { MerchantControls, SheriffControls } from './game-controls';
import { LobbyView } from './lobby/lobby-view';
import { RoomStatus } from './room-status';

export interface RoomViewState {
  readonly network:boolean; readonly connected:boolean; readonly synced:boolean; readonly minimumRevision:number;
  readonly busy:boolean; readonly controlled:boolean; readonly disabled:boolean; readonly available:boolean;
  readonly error:string; readonly pending:boolean; readonly copied:boolean;
}
export interface RoomViewProps {
  readonly room:PublicRoomView; readonly own:PrivateRoomView; readonly playerId:string;
  readonly onlinePlayers:ReadonlySet<string>; readonly animateResult:boolean; readonly state:RoomViewState;
  readonly dispatch:(command?:RoomCommandRequest['command'])=>Promise<void>;
  readonly copyLink:()=>void; readonly abortGame:()=>void; readonly inviteLink:string;
  readonly homeHref?:string; readonly persistDraft?:boolean; readonly resultReplayKey?:number;
}
const PHASE_LABELS = { LOBBY: 'ล็อบบี้', PREPARE: 'เตรียมสินค้า', PACK_AND_DECLARE: 'จัดกระเป๋าและแจ้งสินค้า', NEGOTIATE: 'เจรจา',
  RESOLUTION: 'ผลการตัดสิน', ROUND_SUMMARY: 'สรุปรอบ', GAME_OVER: 'จบเกม' } as const;
function names(ids: readonly string[], room: PublicRoomView): string {
  return ids.map(id => room.players.find(player => player.id === id)?.displayName ?? 'ผู้เล่น').join(', ');
}
function listGoods(goods: readonly string[], rules: RulesSnapshot): string {
  return Object.values(rules.products).flatMap(product => { const count = goods.filter(id => id === product.id).length; return count ? [`${product.name} ${count} ใบ`] : []; }).join(', ') || 'ไม่มีสินค้า';
}

export function RoomLoading({error='',homeHref='/'}:{error?:string;homeHref?:string}) {
  return <main id="main" tabIndex={-1} className="loading-page"><h1>{GAME_NAME}</h1><p aria-live="polite">กำลังเชื่อมต่อห้อง…</p>{error ? <p role="alert" className="notice">{error}</p> : null}<Link className="button secondary" href={homeHref}>กลับหน้าแรก</Link></main>;
}
/** Shared presentation. All network/storage actions are supplied by the caller. */
export function RoomView({room,own,playerId,onlinePlayers,animateResult,state,dispatch,copyLink,abortGame,inviteLink,homeHref='/',persistDraft=true,resultReplayKey}:RoomViewProps) {
  const {busy,controlled,disabled,pending}=state;
  const PRODUCTS = room.rules.products;
  const goodsList = (goods: readonly string[]) => listGoods(goods, room.rules);
  const isSheriff = room.sheriffId === playerId; const isHost = room.hostId === playerId;
  const draftKey = `${room.gameId}:${room.roundIndex}:${room.phase}`;
  const result = room.result;
  if (room.lifecycle === 'LOBBY') return <LobbyView room={room} playerId={playerId} onlinePlayers={onlinePlayers} state={state} dispatch={dispatch} copyLink={copyLink} inviteLink={inviteLink} homeHref={homeHref} />;
  return <main id="main" tabIndex={-1} className="room-table" data-phase={room.phase} data-round={room.roundIndex} data-revision={room.revision} data-own-role={isSheriff ? 'sheriff' : 'merchant'}>
    <header className="room-header"><div><p className="eyebrow">{GAME_NAME}</p><h1>ห้อง <span data-testid="room-code">{room.code}</span></h1></div>
      <Link className="button secondary" href={homeHref}>หน้าแรก</Link></header>
    <RoomStatus room={room} state={state} dispatch={dispatch} />
    <section className="panel"><h2>{PHASE_LABELS[room.phase]}{room.gameId ? ` · รอบ ${room.roundIndex}/${room.totalRounds}` : ''}</h2>
      {room.sheriffId ? <p>นายด่าน: <strong>{names([room.sheriffId], room)}</strong> · คุณเป็น{isSheriff ? 'นายด่าน' : 'พ่อค้า'}</p> : <p>คุยกับเพื่อนผ่านแอปที่คุณใช้ แล้วเล่นบนหน้านี้ ต้องมี 4–6 คนและทุกคนพร้อม</p>}
      <div className="players">{room.players.map(player => <article className={`player ${player.id === room.selectedMerchantId ? 'selected' : ''}`} key={player.id} data-player-id={player.id}>
        <h3>{player.displayName}{player.id === playerId ? ' (คุณ)' : ''}</h3>
        <p>{player.id === room.hostId ? 'ผู้จัดห้อง · ' : ''}{player.id === room.sheriffId ? 'นายด่าน · ' : ''}{onlinePlayers.has(player.id) ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อมต่อ'}</p>
        <p>{room.lifecycle === 'LOBBY' ? player.ready ? 'พร้อมแล้ว' : 'ยังไม่พร้อม' : `เงิน ${player.cash} เหรียญ`}</p>
        {room.phase === 'PREPARE' && player.id !== room.sheriffId ? <p>{player.prepared ? 'เตรียมแล้ว' : 'กำลังเตรียม'}</p> : null}
        {room.phase === 'PACK_AND_DECLARE' && player.id !== room.sheriffId ? <p>{player.bagLocked ? 'ปิดกระเป๋าแล้ว' : 'กำลังจัดกระเป๋า'}</p> : null}
        {player.declaration ? <p>แจ้งสินค้า {PRODUCTS[player.declaration.productId].name} {player.declaration.count} ใบ</p> : null}
        {player.offer ? <p>{player.offer.submitted ? player.offer.amount === 0 ? 'ไม่เสนอเงิน' : `เสนอ ${player.offer.amount} เหรียญ` : 'ยังไม่เลือกข้อเสนอ'}{player.decisionId ? ' · ตัดสินแล้ว' : ''}</p> : null}
      </article>)}</div>
      {room.debts.length > 0 ? <details><summary>หนี้คงค้าง</summary><ul>{room.debts.map(debt => <li key={debt.id}>{names([debt.debtor], room)} → {names([debt.creditor], room)}: {debt.outstanding} เหรียญ</li>)}</ul></details> : null}
    </section>
    {room.lifecycle === 'ABORTED' ? <section className="panel"><h2>ยุติเกมแล้ว</h2><p>เกมนี้ไม่มีผู้ชนะ ผู้จัดห้องสามารถเปิดให้ทุกคนพร้อมใหม่ได้</p>{isHost ? <button disabled={disabled} onClick={() => void dispatch({ type: 'requestRematch' })}>กลับล็อบบี้เพื่อเล่นใหม่</button> : null}</section>
      : room.lifecycle === 'FINISHED' ? <section className="panel" aria-labelledby="score-title"><h2 id="score-title">คะแนนสุดท้าย</h2><p>ผู้ชนะ: <strong>{names(room.scores!.winners, room)}</strong></p>
        <div className="scores">{room.scores!.standings.map(score => <article className="player" key={score.playerId}><h3>อันดับ {score.rank} · {names([score.playerId], room)}</h3>
          <p><strong>{score.total} คะแนน</strong> · สินค้าถูกกฎหมาย {score.legalCount} ใบ</p>
          <dl>{[['เงินสด', score.cash], ['มูลค่าสินค้า', score.goodsValue], ['โบนัสการค้า', score.bonus], ['ลูกหนี้คงค้าง', score.receivable], ['หนี้คงค้าง', score.debt]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p>{Object.values(PRODUCTS).map(product => `${product.name} ${score.counts[product.id]} ใบ`).join(' · ')}</p></article>)}</div>
        {isHost ? <button disabled={disabled} onClick={() => void dispatch({ type: 'requestRematch' })}>กลับล็อบบี้เพื่อเล่นใหม่</button> : null}</section>
      : isSheriff ? <SheriffControls key={draftKey} room={room} disabled={disabled} send={dispatch} />
        : <MerchantControls key={draftKey} room={room} own={own} disabled={disabled} draftDisabled={!controlled || busy || !!pending} persistDraft={persistDraft} send={dispatch} />}
    {result && room.lifecycle === 'PLAYING' ? <section className="panel result" data-result-id={result.id} aria-labelledby="result-title"><h2 id="result-title">ผลของ {names([result.merchantId], room)}</h2>
      <div key={resultReplayKey} className={`result-bag ${result.contrabandPassed && animateResult ? 'glow' : ''}`} aria-hidden="true"><Image unoptimized src="/art/bag.svg" alt="" width={80} height={80} /></div>
      <p>{result.action === 'PASS' ? `ให้ผ่าน กระเป๋า ${result.bagCount} ใบเข้าคลัง จ่ายข้อเสนอ ${result.paymentAmount} เหรียญ` : `ตรวจสินค้า: ${goodsList(result.revealed!)}`}</p>
      {result.action === 'INSPECT' ? <><p>ผ่าน: {goodsList(result.passed!)} · ยึด: {goodsList(result.confiscated!)}</p><p>{result.paymentKind === 'FINE' ? 'ค่าปรับ' : 'ค่าชดเชย'} {result.paymentAmount} เหรียญ · ไม่โอนเงินข้อเสนอ</p></> : null}
      {result.contrabandPassed ? <p className="contraband-note">มีของต้องห้ามผ่านด่าน!</p> : null}</section> : null}
    {room.gameId && room.lifecycle === 'PLAYING' ? <details className="panel"><summary>มือและคลังสินค้าของฉัน</summary><p>มือ: {goodsList(own.hand.map(card => card.productId))}</p><p>กระเป๋าที่ปิด: {goodsList(own.bag.map(card => card.productId))}</p>
      <p>คลัง: {goodsList(own.stash.map(card => card.productId))}</p><p>มูลค่าสินค้าในคลัง {own.goodsValue} คะแนน · โบนัสคิดเมื่อจบเกม</p></details> : null}
    {room.history.length > 0 ? <details className="panel"><summary>ประวัติผลที่เปิดเผย</summary><ol>{room.history.map(event => <li key={event.id}>รอบ {event.roundIndex} · {names([event.merchantId], room)} · {event.action === 'PASS' ? 'ให้ผ่าน' : 'ตรวจ'}
      {event.action === 'INSPECT' ? ` · ${goodsList(event.revealed!)}` : event.contrabandPassed ? ' · มีของต้องห้ามผ่านด่าน!' : ''} · {event.paymentAmount} เหรียญ</li>)}</ol></details> : null}
    <RulesSummary rules={room.rules} />
    {isHost && room.lifecycle === 'PLAYING' ? <footer><button className="secondary" disabled={disabled} onClick={abortGame}>ยุติเกมนี้</button></footer> : null}
  </main>;
}
