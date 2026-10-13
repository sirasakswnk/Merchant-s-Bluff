'use client';
import { useEffect, useRef } from 'react';
import type { Offer } from '@/lib/game/types';
import styles from './offers.module.css';

/** Only confirmed public offers belong here; local drafts stay with MerchantControls. */
export function OfferDisplay({ offer, variant = 'seat' }: { offer: Offer | null; variant?: 'seat' | 'tray' | 'detail' }) {
  const signature = `${offer?.submitted}:${offer?.amount}:${offer?.version}`;
  const previous = useRef(signature);
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animation = previous.current !== signature && offer?.submitted && !media.matches
      ? element.current?.animate([
        { transform: 'translateY(4px) scale(.96)', opacity: .75 },
        { transform: 'translateY(-3px) scale(1.04)', opacity: 1, offset: .55 },
        { transform: 'translateY(0) scale(1)', opacity: 1 },
      ], { duration: 360, easing: 'ease-out' }) : undefined;
    previous.current = signature;
    const reduceMotion = () => { if (media.matches) animation?.cancel(); };
    media.addEventListener('change', reduceMotion);
    return () => { media.removeEventListener('change', reduceMotion); animation?.cancel(); };
  }, [signature, offer?.submitted]);
  const submitted = offer?.submitted === true;
  const positive = submitted && offer.amount > 0;
  return <div ref={element} className={`${styles.display} ${styles[variant]} ${positive ? styles.positive : styles.neutral}`}
    data-offer-display={variant} data-offer-submitted={submitted} data-offer-amount={submitted ? offer.amount : undefined}
    data-offer-version={offer?.version} aria-live="polite" aria-atomic="true">
    {variant !== 'seat' ? <span className={styles.caption}>ข้อเสนอล่าสุด</span> : null}
    <div className={styles.offerValue}>
      {positive ? <><span className={styles.coinPile} aria-hidden="true">{Array.from({ length: Math.min(4, offer.amount) }, (_, index) => <i key={index} />)}</span>
        {variant === 'seat' ? <span>เสนอ <strong>{offer.amount}</strong></span> : <span><strong>{offer.amount}</strong> <span className={styles.unit}>เหรียญ</span></span>}</>
        : <span>{submitted ? 'ไม่เสนอเงิน' : 'ยังไม่ยื่น'}</span>}
    </div>
  </div>;
}
