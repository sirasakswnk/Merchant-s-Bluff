import type { PhaseGuide } from './phase-guide';
import styles from './phase-plaque.module.css';

function Pips({ progress }: { progress: NonNullable<PhaseGuide['progress']> }) {
  return <p className={styles.pips}>
    <span className={styles.dots} aria-hidden="true">{Array.from({ length: progress.total }, (_, index) => <i key={index} data-filled={index < progress.done} />)}</span>
    <span><span className={styles.pipsLabel}>{progress.label} </span>{progress.done}/{progress.total}</span>
  </p>;
}

/** Large sign in the middle of the table for phases without a bag on the table. */
export function PhasePlaque({ guide }: { guide: PhaseGuide }) {
  return <div className={styles.plaque} data-phase-plaque data-your-move={guide.yourMove}>
    <p className={styles.step}><span aria-hidden="true">{guide.icon}</span> ขั้นที่ {guide.step}/{guide.totalSteps}</p>
    <p className={styles.title}>{guide.label}</p>
    <p className={styles.task}>{guide.yourMove ? <strong>ถึงตาคุณ: </strong> : <span aria-hidden="true">⌛ </span>}{guide.task}</p>
    <p className={styles.shortStatus} aria-hidden="true">{guide.yourMove ? 'ถึงตาคุณ!' : '⌛ รอคนอื่น'}</p>
    {guide.progress ? <Pips progress={guide.progress} /> : null}
    {guide.yourMove ? <a className={styles.cta} href="#your-turn">ทำเลย <span aria-hidden="true">↓</span></a> : null}
  </div>;
}

/** Slim bar that stays at the top while scrolling between the table and your own controls. */
export function TaskBar({ guide }: { guide: PhaseGuide }) {
  return <section className={styles.taskBar} data-task-bar data-your-move={guide.yourMove} aria-label="หน้าที่ของคุณตอนนี้">
    <p className={styles.barPhase}><span aria-hidden="true">{guide.icon}</span> <span className={styles.barStep}>{guide.step}/{guide.totalSteps}</span> {guide.label}</p>
    <p className={styles.barTask}>{guide.yourMove ? <strong>ถึงตาคุณ: </strong> : <span aria-hidden="true">⌛ </span>}{guide.task}{guide.progress ? <span className={styles.barCount}> · {guide.progress.done}/{guide.progress.total}</span> : null}</p>
    {guide.yourMove ? <a className={styles.barCta} href="#your-turn">ไปที่ไพ่และปุ่ม <span aria-hidden="true">↓</span></a> : null}
  </section>;
}
