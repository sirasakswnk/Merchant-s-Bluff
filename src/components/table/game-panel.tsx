import type { ComponentPropsWithoutRef } from 'react';
import styles from './game-panel.module.css';

/** Shared material for gameplay controls and public results; all behavior stays with callers. */
export function GamePanel({ className = '', children, ...props }: ComponentPropsWithoutRef<'section'>) {
  return <section {...props} className={`panel ${styles.canvasPanel} ${className}`} data-game-panel>
    {children}
  </section>;
}
