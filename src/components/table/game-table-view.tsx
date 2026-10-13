'use client';
import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GAME_NAME } from '@/lib/game/config';
import type { RulesSnapshot } from '@/lib/game/types';
import type { PublicPlayer, PublicRoomView } from '@/lib/shared/rooms';
import type { RoomViewProps } from '../room-view';
import { MerchantControls, SheriffControls } from '../game-controls';
import { OfferDisplay } from '../offers/offer-display';
import { RoomStatus } from '../room-status';
import { RulesSummary } from '../rules-summary';
import { CharacterAvatar } from '../lobby/character-avatar';
import lobby from '../lobby/lobby.module.css';
import { GateSeal, TableSurface } from './art';
import { tableFonts } from './fonts';
import { gameSeatOrder, gameSeatPositions, topSeatIndex } from './game-seats';
import { GamePanel } from './game-panel';
import { FinalScorePopup } from './final-score-popup';
import styles from './game-table.module.css';

const PHASE_LABELS = { LOBBY: 'ยุติเกม', PREPARE: 'เตรียมสินค้า', PACK_AND_DECLARE: 'จัดกระเป๋าและแจ้งสินค้า', NEGOTIATE: 'เจรจา', RESOLUTION: 'ผลการตัดสิน', ROUND_SUMMARY: 'สรุปรอบ', GAME_OVER: 'จบเกม' } as const;
const ROUND_STEPS = ['PREPARE', 'PACK_AND_DECLARE', 'NEGOTIATE', 'RESOLUTION', 'ROUND_SUMMARY'] as const;
function names(ids: readonly string[], room: PublicRoomView) { return ids.map(id => room.players.find(player => player.id === id)?.displayName ?? 'ผู้เล่น').join(', '); }
function goodsList(goods: readonly string[], rules: RulesSnapshot) { return Object.values(rules.products).flatMap(product => { const count = goods.filter(id => id === product.id).length; return count ? [`${product.name} ${count} ใบ`] : []; }).join(', ') || 'ไม่มีสินค้า'; }
function playerProgress(player: PublicPlayer, room: PublicRoomView) {
  if (room.lifecycle === 'FINISHED') return 'จบเกมแล้ว';
  if (room.lifecycle === 'ABORTED') return 'ยุติเกมแล้ว';
  if (player.id === room.sheriffId) return 'นายด่าน';
  if (player.decisionId) return 'ตัดสินแล้ว';
  if (room.phase === 'PREPARE') return player.prepared ? 'เตรียมแล้ว' : 'กำลังเตรียม';
  if (room.phase === 'PACK_AND_DECLARE') return player.bagLocked ? 'ปิดกระเป๋าแล้ว' : 'กำลังจัดกระเป๋า';
  if (room.phase === 'ROUND_SUMMARY') return 'รอรอบถัดไป';
  return player.offer?.submitted ? 'ยื่นข้อเสนอแล้ว' : 'ยังไม่เลือกข้อเสนอ';
}
type GameProps = Omit<RoomViewProps, 'copyLink' | 'inviteLink'>;

export function GameTableView({ room, own, playerId, onlinePlayers, animateResult, state, dispatch, abortGame, homeHref = '/', persistDraft = true, resultReplayKey }: GameProps) {
  const isSheriff = room.sheriffId === playerId, isHost = room.hostId === playerId;
  const key = `${room.roomId}:${room.gameId}:${playerId}:${room.players.map(player => player.id).join(',')}`;
  const ids = room.players.map(player => player.id);
  const [layout, setLayout] = useState(() => ({ key, sheriffId: room.sheriffId, order: gameSeatOrder(ids, playerId, room.sheriffId) }));
  let currentLayout = layout;
  if (layout.key !== key || layout.sheriffId !== room.sheriffId) {
    currentLayout = { key, sheriffId: room.sheriffId, order: gameSeatOrder(ids, playerId, room.sheriffId, layout.key === key ? layout.order : undefined) };
    setLayout(currentLayout);
  }
  const positions = gameSeatPositions(room.players.length);
  const PRODUCTS = room.rules.products, result = room.result;
  const target = room.players.find(player => player.id === (result?.merchantId ?? room.selectedMerchantId));
  const draftKey = `${room.gameId}:${room.roundIndex}:${room.phase}`;
  const roundProgress = room.phase === 'PREPARE' ? room.players.filter(player => player.id !== room.sheriffId && player.prepared).length : room.players.filter(player => player.id !== room.sheriffId && player.bagLocked).length;
  const showOffers = room.lifecycle === 'PLAYING' && (room.phase === 'NEGOTIATE' || room.phase === 'RESOLUTION');
  return <main id="main" tabIndex={-1} className={`room-table ${lobby.room} ${styles.room} ${tableFonts}`} data-phase={room.phase} data-round={room.roundIndex} data-revision={room.revision} data-own-role={isSheriff ? 'sheriff' : 'merchant'} data-game-viewer={playerId}>
    <header className={lobby.header}><div className={lobby.brand}><GateSeal /><div><p>{GAME_NAME}</p><h1 className={styles.roomTitle}>ห้อง <span data-testid="room-code">{room.code}</span></h1></div></div><Link className={`button secondary ${lobby.homeLink}`} href={homeHref}>หน้าแรก <span aria-hidden="true">↗</span></Link></header>
    <div className={lobby.connection}><RoomStatus room={room} state={state} dispatch={dispatch} /></div>
    <section className={styles.phaseHeading} aria-labelledby="phase-title"><div><p className={lobby.eyebrow}>{room.gameId ? `รอบ ${room.roundIndex}/${room.totalRounds}` : 'โต๊ะพ่อค้า'}</p><h2 id="phase-title">{room.lifecycle === 'ABORTED' ? 'ยุติเกม' : PHASE_LABELS[room.phase]}</h2><p className={styles.roleLine}>{room.sheriffId && room.lifecycle !== 'ABORTED' ? <>นายด่าน: <strong>{names([room.sheriffId], room)}</strong> · คุณเป็น{isSheriff ? 'นายด่าน' : 'พ่อค้า'}</> : 'เกมนี้ไม่มีผู้ชนะ'}</p></div><a className={`button secondary ${styles.jumpLink}`} href="#your-turn">ไพ่และปุ่มของฉัน <span aria-hidden="true">↓</span></a></section>
    {room.lifecycle === 'PLAYING' ? <ol className={styles.phaseTrack} aria-label="ขั้นตอนของรอบ">{ROUND_STEPS.map((phase, index) => <li key={phase} aria-current={room.phase === phase ? 'step' : undefined}><span aria-hidden="true">{index + 1}</span>{PHASE_LABELS[phase]}</li>)}</ol> : null}
    <section id="table-top" className={styles.boardSection} aria-label="โต๊ะเล่นเกม">
      <div className={`${lobby.stage} ${styles.stage} ${showOffers ? styles.offerStage : ''}`} data-game-stage>
        <TableSurface game />
        <div className={`${styles.tableCenter} ${room.phase === 'NEGOTIATE' ? styles.negotiationCenter : ''}`} data-table-center>
          {room.lifecycle === 'PLAYING' && target && (room.phase === 'NEGOTIATE' || room.phase === 'RESOLUTION') ? <>
            <p className={styles.centerTag}>{result ? result.action === 'PASS' ? 'ให้ผ่าน' : 'เปิดตรวจ' : 'กระเป๋าที่กำลังเจรจา'}</p><h3>{target.displayName}</h3>
            <div key={`${result?.id ?? 'sealed'}:${resultReplayKey ?? ''}`} className={`result-bag ${styles.bag} ${result?.contrabandPassed && animateResult ? 'glow' : ''}`} aria-hidden="true"><Image unoptimized src="/art/bag.svg" alt="" width={64} height={64} /></div>
            {result ? <><p>{result.paymentKind === 'FINE' ? 'ค่าปรับ' : result.paymentKind === 'COMPENSATION' ? 'ค่าชดเชย' : 'ข้อเสนอ'} {result.paymentAmount} เหรียญ</p>{result.contrabandPassed ? <p className={styles.contrabandMark}>มีของต้องห้ามผ่านด่าน!</p> : null}<a className={styles.resultLink} href="#result-title">ดูผลตัดสิน ↓</a></> : <><p>{target.declaration ? `แจ้ง${PRODUCTS[target.declaration.productId].name} · ${target.declaration.count} ใบ` : 'ยังไม่ได้แจ้งสินค้า'}</p><OfferDisplay key={target.id} offer={target.offer} variant="tray" /></>}
          </> : <><GateSeal className={lobby.seal} /><p className={styles.centerTag}>{room.lifecycle === 'ABORTED' ? 'ยุติเกมแล้ว' : room.lifecycle === 'FINISHED' ? 'ปิดตลาด' : PHASE_LABELS[room.phase]}</p><p>{room.lifecycle !== 'PLAYING' ? 'ดูรายละเอียดด้านล่าง' : room.phase === 'PREPARE' || room.phase === 'PACK_AND_DECLARE' ? `${roundProgress}/${room.players.length - 1} พ่อค้าพร้อม` : room.phase === 'NEGOTIATE' ? 'รอนายด่านเลือกพ่อค้า' : room.phase === 'ROUND_SUMMARY' ? 'รอนายด่านส่งต่อรอบ' : 'ดูรายละเอียดด้านล่าง'}</p></>}
        </div>
        <div className={`players ${lobby.seats}`} role="group" aria-label="ผู้เล่นรอบโต๊ะ">{room.players.map(player => {
          const index = currentLayout.order.indexOf(player.id), position = positions[index];
          const selected = player.id === room.selectedMerchantId;
          return <article key={player.id} className={`player ${lobby.seat} ${styles.seat} ${player.id === playerId ? lobby.ownSeat : ''} ${selected ? styles.selected : ''}`} style={{ '--seat-x': position.x, '--seat-y': position.y } as CSSProperties} data-player-id={player.id} data-seat-index={index} data-own-seat={player.id === playerId} data-sheriff-seat={player.id === room.sheriffId} data-top-seat={index === topSeatIndex(room.players.length)}>
            <div className={`${lobby.portrait} ${selected ? styles.selectedPortrait : ''}`}><CharacterAvatar avatarId={player.avatarId} className={lobby.avatar} />{player.id === room.sheriffId ? <span className={styles.sheriffBadge}>นายด่าน</span> : null}<span className={`${lobby.presence} ${onlinePlayers.has(player.id) ? lobby.isOnline : ''}`} data-online={onlinePlayers.has(player.id)} title={onlinePlayers.has(player.id) ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อมต่อ'}><span aria-hidden="true">{onlinePlayers.has(player.id) ? '' : '−'}</span><span className={lobby.srOnly}>{onlinePlayers.has(player.id) ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อมต่อ'}</span></span></div>
            <h3>{player.displayName}{player.id === playerId ? <span className={lobby.you}>คุณ</span> : null}</h3><p className={styles.cash}>เงิน {player.cash ?? 0} เหรียญ</p>{player.declaration ? <p className={styles.declaration}>แจ้งสินค้า {PRODUCTS[player.declaration.productId].name} {player.declaration.count} ใบ</p> : null}{!showOffers || player.id === room.sheriffId || player.decisionId ? <p className={`${lobby.readiness} ${styles.progress}`}>{playerProgress(player, room)}</p> : null}
            {showOffers && player.id !== room.sheriffId ? <OfferDisplay offer={player.offer} /> : null}
          </article>;
        })}</div>
      </div>
    </section>
    <div id="your-turn" tabIndex={-1} className={styles.yourTurn}><p className={styles.ownLabel}>พื้นที่ของคุณ · {isSheriff ? 'นายด่าน' : 'พ่อค้า'}</p>
      {room.lifecycle === 'ABORTED' ? <section className="panel"><h2>ยุติเกมแล้ว</h2><p>เกมนี้ไม่มีผู้ชนะ ผู้จัดห้องสามารถเปิดให้ทุกคนพร้อมใหม่ได้</p>{isHost ? <button disabled={state.disabled} onClick={() => void dispatch({ type: 'requestRematch' })}>กลับล็อบบี้เพื่อเล่นใหม่</button> : null}</section>
        : room.lifecycle === 'FINISHED' ? <FinalScorePopup key={room.gameId} scores={room.scores!} players={room.players} isHost={isHost} disabled={state.disabled} onRematch={() => dispatch({ type: 'requestRematch' })} />
          : isSheriff ? <SheriffControls key={draftKey} room={room} disabled={state.disabled} send={dispatch} /> : <MerchantControls key={draftKey} room={room} own={own} disabled={state.disabled} draftDisabled={!state.controlled || state.busy || state.pending} persistDraft={persistDraft} send={dispatch} />}
    </div>
    {result && room.lifecycle === 'PLAYING' ? <GamePanel className={`result ${styles.result}`} data-result-id={result.id} aria-labelledby="result-title"><h2 id="result-title">ผลของ {names([result.merchantId], room)}</h2><p>{result.action === 'PASS' ? `ให้ผ่าน กระเป๋า ${result.bagCount} ใบเข้าคลัง จ่ายข้อเสนอ ${result.paymentAmount} เหรียญ` : `ตรวจสินค้า: ${goodsList(result.revealed!, room.rules)}`}</p>{result.action === 'INSPECT' ? <><p>ผ่าน: {goodsList(result.passed!, room.rules)} · ยึด: {goodsList(result.confiscated!, room.rules)}</p><p>{result.paymentKind === 'FINE' ? 'ค่าปรับ' : 'ค่าชดเชย'} {result.paymentAmount} เหรียญ · ไม่โอนเงินข้อเสนอ</p></> : null}{result.contrabandPassed ? <p className="contraband-note">มีของต้องห้ามผ่านด่าน!</p> : null}</GamePanel> : null}
    {room.gameId && room.lifecycle === 'PLAYING' ? <details className="panel"><summary>มือและคลังสินค้าของฉัน</summary><p>มือ: {goodsList(own.hand.map(card => card.productId), room.rules)}</p><p>กระเป๋าที่ปิด: {goodsList(own.bag.map(card => card.productId), room.rules)}</p><p>คลัง: {goodsList(own.stash.map(card => card.productId), room.rules)}</p><p>มูลค่าสินค้าในคลัง {own.goodsValue} คะแนน · โบนัสคิดเมื่อจบเกม</p></details> : null}
    <details className="panel"><summary>ข้อมูลที่เปิดเผยของพ่อค้าทุกคน</summary><div className={styles.publicDetails}>{room.players.map(player => <article key={player.id}><h3>{player.displayName}{player.id === room.hostId ? ' · ผู้จัดห้อง' : ''}</h3>{player.offer ? <p>{player.offer.submitted ? player.offer.amount === 0 ? 'ไม่เสนอเงิน' : `เสนอ ${player.offer.amount} เหรียญ` : 'ยังไม่เลือกข้อเสนอ'}{player.decisionId ? ' · ตัดสินแล้ว' : ''}</p> : null}</article>)}</div>{room.debts.length > 0 ? <><h3>หนี้คงค้าง</h3><ul>{room.debts.map(debt => <li key={debt.id}>{names([debt.debtor], room)} → {names([debt.creditor], room)}: {debt.outstanding} เหรียญ</li>)}</ul></> : null}</details>
    {room.history.length > 0 ? <details className="panel"><summary>ประวัติผลที่เปิดเผย</summary><ol>{room.history.map(event => <li key={event.id}>รอบ {event.roundIndex} · {names([event.merchantId], room)} · {event.action === 'PASS' ? 'ให้ผ่าน' : 'ตรวจ'}{event.action === 'INSPECT' ? ` · ${goodsList(event.revealed!, room.rules)}` : event.contrabandPassed ? ' · มีของต้องห้ามผ่านด่าน!' : ''} · {event.paymentAmount} เหรียญ</li>)}</ol></details> : null}
    <RulesSummary rules={room.rules} />{isHost && room.lifecycle === 'PLAYING' ? <footer><button className="secondary" disabled={state.disabled} onClick={abortGame}>ยุติเกมนี้</button></footer> : null}
  </main>;
}
