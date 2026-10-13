'use client';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { GAME_NAME } from '@/lib/game/config';
import type { RoomViewProps } from '../room-view';
import { RoomStatus } from '../room-status';
import { RulesSummary } from '../rules-summary';
import { CharacterAvatar } from './character-avatar';
import { lobbySeats } from './seats';
import { GateSeal, HostFlag, TableSurface } from '../table/art';
import { tableFonts } from '../table/fonts';
import styles from './lobby.module.css';

type LobbyProps = Pick<RoomViewProps, 'room' | 'playerId' | 'onlinePlayers' | 'state' | 'dispatch' | 'copyLink' | 'inviteLink' | 'homeHref'>;

export function LobbyView({ room, playerId, onlinePlayers, state, dispatch, copyLink, inviteLink, homeHref = '/' }: LobbyProps) {
  const me = room.players.find(player => player.id === playerId)!;
  const isHost = room.hostId === playerId;
  const nextHost = room.players.find(player => player.id !== room.hostId && onlinePlayers.has(player.id));
  const readyCount = room.players.filter(player => player.ready).length;
  const enoughPlayers = room.players.length >= room.rules.minPlayers;
  const everyoneReady = room.players.every(player => player.ready);
  const startDisabled = state.disabled || !enoughPlayers || !everyoneReady;
  const startHint = !enoughPlayers ? `รอเพื่อนอีก ${room.rules.minPlayers - room.players.length} คน` : !everyoneReady ? 'รอทุกคนกดพร้อม' : isHost ? 'ทุกคนพร้อมแล้ว เปิดตลาดได้เลย' : 'รอผู้จัดห้องเริ่มเกม';
  const seats = lobbySeats(room.players, playerId, room.rules.minPlayers);
  return <main id="main" tabIndex={-1} className={`room-table ${styles.room} ${tableFonts}`}
    data-phase={room.phase} data-round={room.roundIndex} data-revision={room.revision} data-own-role="merchant" data-lobby-viewer={playerId}>
    <header className={styles.header}>
      <div className={styles.brand}><GateSeal /><div><p>{GAME_NAME}</p><span>โต๊ะพ่อค้า · ห้องรอเล่น</span></div></div>
      <Link className={`button secondary ${styles.homeLink}`} href={homeHref}>หน้าแรก <span aria-hidden="true">↗</span></Link>
    </header>
    <section className={styles.invitation} aria-labelledby="room-title">
      <div className={styles.roomTicket}><span className={styles.ticketMark} aria-hidden="true">ด่าน</span><div><p>ชวนเพื่อนมานั่งที่โต๊ะ</p><h1 id="room-title">ห้อง <span data-testid="room-code">{room.code}</span></h1></div></div>
      <div className={styles.inviteActions}><button className={styles.copyButton} type="button" onClick={copyLink}><span aria-hidden="true">⧉</span> คัดลอกลิงก์</button>
        <details className={styles.inviteDetails} open={state.error.includes('คัดลอก')}><summary>ดูลิงก์ชวนเพื่อน</summary><label>ลิงก์ชวนเพื่อน<input readOnly value={inviteLink} onFocus={event => event.currentTarget.select()} /></label></details>
        {state.copied ? <p className={styles.copied} aria-live="polite">คัดลอกลิงก์แล้ว</p> : null}
      </div>
    </section>
    <div className={styles.connection}><RoomStatus room={room} state={state} dispatch={dispatch} /></div>
    <section className={styles.boardSection} aria-labelledby="lobby-title">
      <div className={styles.boardHeading}><div><p className={styles.eyebrow}>หาที่นั่ง แล้วเตรียมเข้าตลาด</p><h2 id="lobby-title">ล็อบบี้</h2></div>
        <p className={styles.playerCount}><span aria-hidden="true">●</span> {room.players.length}/{room.rules.maxPlayers} คน</p>
      </div>
      <div className={styles.stage} data-seat-count={seats.length}>
        <TableSurface />
        <div className={styles.tableCenter}><GateSeal className={styles.seal} /><p className={styles.tableTitle}>เตรียมเข้าตลาด</p><p className={styles.readyCount}>พร้อม {readyCount}/{room.players.length} คน</p>
          {isHost ? <button className={styles.startButton} type="button" disabled={startDisabled} aria-describedby="lobby-start-hint" onClick={() => void dispatch({ type: 'startGame' })}>เริ่มเกม <span aria-hidden="true">→</span></button> : <p className={styles.waitHost}>รอผู้จัดห้อง<br />เปิดตลาด</p>}
        </div>
        <div className={`players ${styles.seats}`} role="group" aria-label="ผู้เล่นรอบโต๊ะ">
          {seats.map(seat => <article key={seat.player?.id ?? `empty-${seat.index}`} className={`player ${styles.seat} ${seat.player?.id === playerId ? styles.ownSeat : ''} ${!seat.player ? styles.emptySeat : ''}`}
            style={{ '--seat-x': seat.x, '--seat-y': seat.y } as CSSProperties} data-player-id={seat.player?.id} data-seat-index={seat.index} data-own-seat={seat.player?.id === playerId}>
            {seat.player ? <>
              <div className={`${styles.portrait} ${seat.player.ready ? styles.readyPortrait : ''}`}><CharacterAvatar avatarId={seat.player.avatarId} className={styles.avatar} />
                {seat.player.id === room.hostId ? <HostFlag /> : null}<span className={`${styles.presence} ${onlinePlayers.has(seat.player.id) ? styles.isOnline : ''}`} data-online={onlinePlayers.has(seat.player.id)} title={onlinePlayers.has(seat.player.id) ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อมต่อ'}><span aria-hidden="true">{onlinePlayers.has(seat.player.id) ? '' : '−'}</span><span className={styles.srOnly}>{onlinePlayers.has(seat.player.id) ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อมต่อ'}</span></span>
              </div>
              <h3>{seat.player.displayName}{seat.player.id === playerId ? <span className={styles.you}>คุณ</span> : null}</h3>
              <p className={`${styles.readiness} ${seat.player.ready ? styles.isReady : ''}`}><span aria-hidden="true">{seat.player.ready ? '✓' : '·'}</span> {seat.player.ready ? 'พร้อมแล้ว' : 'ยังไม่พร้อม'}</p>
            </> : <><div className={styles.emptyPortrait} aria-hidden="true">+</div><p>รอเพื่อน</p></>}
          </article>)}
        </div>
      </div>
      <div className={styles.ownActions}><p>ที่นั่งของคุณอยู่ด้านล่างโต๊ะเสมอ</p><button className={`${styles.readyButton} ${me.ready ? styles.cancelReady : ''}`} type="button" disabled={state.disabled} onClick={() => void dispatch({ type: 'setReady', ready: !me.ready })}><span aria-hidden="true">{me.ready ? '✓' : '◇'}</span> {me.ready ? 'ยกเลิกพร้อม' : 'พร้อม'}</button></div>
      <p id="lobby-start-hint" className={styles.startHint} aria-live="polite">{startHint}</p>
      {!onlinePlayers.has(room.hostId) && nextHost?.id === playerId ? <div className={styles.claimHost}><p>ผู้จัดห้องไม่ได้เชื่อมต่อ คุณรับหน้าที่ต่อได้</p><button className="secondary" disabled={state.disabled} onClick={() => void dispatch({ type: 'claimHost' })}>รับตำแหน่งผู้จัดห้อง</button></div> : null}
    </section>
    <p className={styles.voiceHint}>คุยกับเพื่อนผ่านแอปที่คุณใช้ แล้วเล่นบนหน้านี้ · ต้องมี {room.rules.minPlayers}–{room.rules.maxPlayers} คนและทุกคนพร้อม</p>
    <RulesSummary rules={room.rules} />
  </main>;
}
