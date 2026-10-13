import styles from '../lobby/lobby.module.css';

export function GateSeal({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
    <path d="M8 53V21h12v8h24v-8h12v32M6 53h52M8 21V11h4v5h4v-5h4v10M44 21V11h4v5h4v-5h4v10" />
    <path d="M24 53V40a8 8 0 0 1 16 0v13M29 53V41M35 53V41M14 30v8M50 30v8" />
    <path d="m32 5 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="currentColor" stroke="none" />
  </svg>;
}
export function HostFlag() {
  return <span className={styles.hostFlag} title="ผู้จัดห้อง"><span className={styles.srOnly}>ผู้จัดห้อง</span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7 4 4 4-7 4 7 4-4-2 12H6Z" fill="currentColor" /><path d="M6 19h12" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
  </span>;
}
export function TableSurface({ className = '', game = false }: { className?: string; game?: boolean }) {
  return <div className={`${styles.table} ${className}`} data-lobby-table={game ? undefined : true} data-game-table={game ? true : undefined} aria-hidden="true">
    <div className={styles.tableGrain} /><span className={styles.tableStuds} /><div className={styles.cardStack}><i /><i /><i /></div><div className={styles.coins}><i /><i /><i /></div>
  </div>;
}
