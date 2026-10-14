'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { LEGAL_PRODUCT_IDS } from '@/lib/game/config';
import type { GameScores, RulesSnapshot, ScoreRow } from '@/lib/game/types';
import type { PublicPlayer } from '@/lib/shared/rooms';
import { CharacterAvatar } from '../lobby/character-avatar';
import { GamePanel } from './game-panel';
import styles from './final-score-popup.module.css';

/** Where a total came from; zero receivables/debts are left out to keep rows short. */
function Breakdown({ row }: { row: ScoreRow }) {
  const parts = [`เงินสด ${row.cash}`, `สินค้า ${row.goodsValue}`, `โบนัส ${row.bonus}`];
  if (row.receivable) parts.push(`ลูกหนี้ +${row.receivable}`);
  if (row.debt) parts.push(`หนี้ −${row.debt}`);
  return <span className={styles.breakdown}>{parts.join(' · ')}</span>;
}

export function FinalScorePopup({ scores, players, rules, isHost, disabled, onRematch }: {
  scores: GameScores; players: readonly PublicPlayer[]; rules: RulesSnapshot; isHost: boolean; disabled: boolean; onRematch: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reopen = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const modal = dialog.current;
    if (modal && !modal.open) modal.showModal();
    return () => { if (modal?.open) modal.close(); };
  }, []);
  const profiles = new Map(players.map(player => [player.id, player]));
  const nameOf = (id: string) => profiles.get(id)?.displayName ?? 'ผู้เล่น';
  // Equal totals ranked apart were split by legal goods count (scoreGame's tie-break).
  const tieBroken = scores.standings.some((row, index) => index > 0 && row.total === scores.standings[index - 1].total && row.rank !== scores.standings[index - 1].rank);
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
            return <li key={score.playerId} className={`player ${styles.rankRow}`} data-score-player={score.playerId} data-rank={score.rank} data-cash={score.cash} data-total={score.total}>
              <span className={styles.rank}><span className={styles.srOnly}>อันดับ </span>{score.rank}</span>
              <span className={styles.portrait}><CharacterAvatar avatarId={player?.avatarId ?? 0} className={styles.avatar} /></span>
              <span className={styles.identity}><span className={styles.name}>{player?.displayName ?? 'ผู้เล่น'}</span><Breakdown row={score} /></span>
              <span className={styles.total}><strong>{score.total}</strong><small>คะแนน</small></span>
            </li>;
          })}
        </ol>
        {tieBroken ? <p className={styles.tieNote}>คะแนนเท่ากันตัดสินด้วยจำนวนสินค้าถูกกฎหมายที่มากกว่า</p> : null}
        <section className={styles.leaders} aria-labelledby="market-leaders-title">
          <h3 id="market-leaders-title">เจ้าตลาด <span>โบนัส +{rules.legalMajorityBonus} ต่อชนิด แบ่งกันถ้าเสมอ</span></h3>
          <ul>{LEGAL_PRODUCT_IDS.map(id => {
            const winners = scores.standings.filter(row => row.bonusByProduct[id] > 0);
            return <li key={id}><Image unoptimized src={`/art/g-${id}.svg`} alt="" width={20} height={20} /><span className={styles.leaderProduct}>{rules.products[id].name}</span>
              <span className={styles.leaderNames}>{winners.length ? `${winners.map(row => `${nameOf(row.playerId)} ×${row.counts[id]}`).join(', ')} · +${winners[0].bonusByProduct[id]}` : 'ไม่มีใครถือ'}</span></li>;
          })}</ul>
        </section>
        <p className={styles.formula}>คะแนน = เงินสด + มูลค่าสินค้าในคลัง + โบนัสเจ้าตลาด + ลูกหนี้ − หนี้</p>
        {isHost ? <button className={styles.rematchButton} type="button" disabled={disabled} onClick={() => void onRematch()}>กลับล็อบบี้เพื่อเล่นใหม่</button> : null}
      </GamePanel>
    </dialog>
  </>;
}
