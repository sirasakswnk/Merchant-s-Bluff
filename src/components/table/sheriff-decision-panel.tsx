'use client';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { PublicPlayer } from '@/lib/shared/rooms';
import { CharacterAvatar } from '../lobby/character-avatar';
import { GamePanel } from './game-panel';
import styles from './sheriff-decision-panel.module.css';

const mobileQuery = '(max-width: 600px), (max-height: 500px) and (pointer: coarse)';
function subscribeMobile(notify: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const serverSnapshot = () => false;

/** Presentation only: commands and confirmation versions stay with SheriffControls. */
export function SheriffDecisionPanel({ title, merchants = [], target, disabled, onSelect, onReset, status, mobileSummary, children }: {
  title: string; merchants?: readonly PublicPlayer[]; target?: PublicPlayer; disabled: boolean;
  onSelect?: (id: string) => void; onReset?: () => void; status?: ReactNode; mobileSummary?: ReactNode; children: ReactNode;
}) {
  const mobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverSnapshot);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null), opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const modal = dialog.current;
    if (mobile && modal && !modal.open) modal.showModal();
    return () => { if (modal?.open) modal.close(); };
  }, [mobile]);
  const choosing = !!onSelect;
  const choices = <div className={styles.choices} data-sheriff-choices>
    {merchants.map(player => <button type="button" className={`secondary ${styles.merchantButton}`} key={player.id}
      data-merchant-choice={player.id} aria-label={`เลือก ${player.displayName}`} aria-pressed={target?.id === player.id} disabled={disabled}
      onClick={() => { if (!disabled) { setViewingId(player.id); onSelect?.(player.id); } }}>
      <span className={styles.portrait}><CharacterAvatar avatarId={player.avatarId} className={styles.avatar} /></span>
      <span>{player.displayName}</span>
    </button>)}
  </div>;
  if (!mobile) return <GamePanel><h2>{title}</h2>{choosing ? choices : null}{children}</GamePanel>;
  return <>
    <button ref={opener} type="button" className={styles.launcher} data-sheriff-open onClick={() => dialog.current?.showModal()}>{title}</button>
    <dialog ref={dialog} className={styles.dialog} data-sheriff-popup data-step={choosing ? viewingId ? 'detail' : 'choose' : 'action'}
      aria-labelledby="sheriff-popup-title" onClose={() => { setViewingId(null); onReset?.(); opener.current?.focus({ preventScroll: true }); }}
      onKeyDown={event => {
        if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <GamePanel className={styles.content}>
        <div className={styles.heading}><h2 id="sheriff-popup-title">{choosing && viewingId ? 'ตัดสินพ่อค้า' : title}</h2>
          <button type="button" className={styles.closeButton} aria-label="ปิดหน้าตัดสินพ่อค้า" onClick={() => dialog.current?.close()}>×</button>
        </div>
        {choosing ? viewingId ? <>
          <button type="button" className={`secondary ${styles.backButton}`} onClick={() => { setViewingId(null); onReset?.(); }}>← กลับไปเลือกพ่อค้า</button>
          {target?.id === viewingId ? <div data-sheriff-detail>
            <div className={styles.targetProfile}><span className={styles.portrait}><CharacterAvatar avatarId={target.avatarId} className={styles.avatar} /></span><h3 aria-label={`กำลังคุย: ${target.displayName}`}>{target.displayName}</h3></div>
            {children}
          </div> : <p role="status">กำลังรอยืนยันพ่อค้าที่เลือก…</p>}
        </> : choices : <>{mobileSummary}{children}</>}
        {status ? <div className={styles.status}>{status}</div> : null}
      </GamePanel>
    </dialog>
  </>;
}
