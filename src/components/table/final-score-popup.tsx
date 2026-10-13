'use client';
import { useEffect, useRef } from 'react';
import type { GameScores } from '@/lib/game/types';
import type { PublicPlayer } from '@/lib/shared/rooms';
import { CharacterAvatar } from '../lobby/character-avatar';
import { GamePanel } from './game-panel';
import styles from './final-score-popup.module.css';

export function FinalScorePopup({ scores, players, isHost, disabled, onRematch }: {
  scores: GameScores; players: readonly PublicPlayer[]; isHost: boolean; disabled: boolean; onRematch: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reopen = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const modal = dialog.current;
    if (modal && !modal.open) modal.showModal();
    return () => { if (modal?.open) modal.close(); };
  }, []);
  const profiles = new Map(players.map(player => [player.id, player]));
  return <>
    <button ref={reopen} type="button" className={styles.openButton} onClick={() => dialog.current?.showModal()}>ดูอันดับอีกครั้ง</button>
    <dialog ref={dialog} className={styles.dialog} data-score-popup aria-labelledby="score-title" onClose={() => reopen.current?.focus()}
      onKeyDown={event => {
        if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <GamePanel className={styles.content}>
        <div className={styles.heading}>
          <h2 id="score-title">คะแนนสุดท้าย</h2>
          <button type="button" className={styles.closeButton} aria-label="ปิดสรุปอันดับ" onClick={() => dialog.current?.close()}>×</button>
        </div>
        <ol className={`scores ${styles.rankingList}`} aria-label="อันดับพ่อค้า">
          {scores.standings.map(score => {
            const player = profiles.get(score.playerId);
            return <li key={score.playerId} className={`player ${styles.rankRow}`} data-score-player={score.playerId} data-rank={score.rank} data-cash={score.cash}>
              <span className={styles.rank}><span className={styles.srOnly}>อันดับ </span>{score.rank}</span>
              <span className={styles.portrait}><CharacterAvatar avatarId={player?.avatarId ?? 0} className={styles.avatar} /></span>
              <span className={styles.name}>{player?.displayName ?? 'ผู้เล่น'}</span>
              <span className={styles.money}><span className={styles.coin} aria-hidden="true" /><strong>{score.cash}</strong><small>เหรียญ</small></span>
            </li>;
          })}
        </ol>
        {isHost ? <button className={styles.rematchButton} type="button" disabled={disabled} onClick={() => void onRematch()}>กลับล็อบบี้เพื่อเล่นใหม่</button> : null}
      </GamePanel>
    </dialog>
  </>;
}
