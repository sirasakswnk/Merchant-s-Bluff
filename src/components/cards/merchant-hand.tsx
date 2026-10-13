'use client';

import { useId, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import type { CardInstance, RulesSnapshot } from '@/lib/game/types';
import { useArcHand } from './use-arc-hand';
import styles from './merchant-hand.module.css';

interface MerchantHandProps {
  cards: readonly CardInstance[];
  products: RulesSnapshot['products'];
  selectedIds: readonly string[];
  maximum: number;
  disabled: boolean;
  onToggle: (id: string) => void;
}

function revealCard(button: HTMLButtonElement) {
  const viewport = button.closest('[data-hand-scroll]');
  if (viewport && viewport.scrollWidth > viewport.clientWidth) {
    viewport.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    button.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }
}

/** Private hand presentation only; the caller owns drafts, limits and commands. */
export function MerchantHand({ cards, products, selectedIds, maximum, disabled, onToggle }: MerchantHandProps) {
  const detailId = useId();
  const handId = useId();
  const [viewedId, setViewedId] = useState<string | null>(null);
  const { attachViewport, centeredIndex, isActive, reveal, move, suppressClick, handlers } = useArcHand({ cardIds: cards.map(card => card.instanceId), selectedIds,
    onView: index => setViewedId(cards[index]?.instanceId ?? null) });
  const viewed = cards.find(card => card.instanceId === viewedId)
    ?? cards.find(card => card.instanceId === selectedIds.at(-1)) ?? cards[0];
  const product = viewed ? products[viewed.productId] : null;
  const spaces = Math.max(1, cards.length - 1);

  return <div className={styles.shell} data-merchant-hand>
    <div ref={attachViewport} className={styles.viewport} data-hand-scroll {...handlers}>
    <div id={handId} className={`hand ${styles.hand}`} data-hand-group role="group" aria-label={`ไพ่ในมือ ${cards.length} ใบ`}
      style={{ '--hand-spaces': spaces } as CSSProperties}>
      {cards.map((card, index) => {
        const good = products[card.productId];
        const selected = selectedIds.includes(card.instanceId);
        const blocked = disabled || !selected && selectedIds.length >= maximum;
        const payment = good.category === 'legal' ? `ชดเชย ${good.compensation}` : `ค่าปรับ ${good.fine}`;
        return <button type="button" key={card.instanceId} className={`card ${good.category} ${styles.card}`}
          data-card-id={card.instanceId} data-product={card.productId} data-hand-front={selected && viewed?.instanceId === card.instanceId} aria-pressed={selected} aria-disabled={blocked}
          aria-label={`${good.name} ใบที่ ${index + 1} · ${good.category === 'legal' ? 'ถูกกฎหมาย' : 'ของต้องห้าม'} · มูลค่า ${good.value} · ${payment}`}
          aria-describedby={viewed?.instanceId === card.instanceId ? detailId : undefined}
          style={{ '--card-index': index, '--card-angle': `${(index - (cards.length - 1) / 2) * 3}deg`, '--card-arc': `${Math.abs(index - (cards.length - 1) / 2) * 5}px` } as CSSProperties}
          onFocus={event => {
            setViewedId(card.instanceId);
            if (event.currentTarget.matches(':focus-visible') && !reveal(index, true)) revealCard(event.currentTarget);
          }} onPointerEnter={event => { if (event.pointerType === 'mouse' && !isActive()) setViewedId(card.instanceId); }}
          onClick={event => {
            if (suppressClick(event.detail > 0)) return;
            setViewedId(card.instanceId); if (!blocked) onToggle(card.instanceId);
            if (!reveal(index)) revealCard(event.currentTarget);
          }}>
          <span className={styles.face} aria-hidden="true">
            <Image className={styles.cardImage} src={`/art/cards/${card.productId}.webp`} alt="" width={1024} height={1536}
              sizes="(max-width: 600px) 8.25rem, 9.5rem" draggable={false} />
          </span>
          {selected ? <span className={styles.selectedBadge} aria-hidden="true">✓ เลือกแล้ว</span> : null}
        </button>;
      })}
    </div>
    </div>
    {cards.length > 0 ? <div className={styles.navigation}>
      <button type="button" aria-label="ดูไพ่ใบก่อนหน้า" aria-controls={handId} disabled={centeredIndex === 0} onClick={() => move(-1)}>‹</button>
      <span aria-live="polite">ไพ่ {centeredIndex + 1} / {cards.length}</span>
      <button type="button" aria-label="ดูไพ่ใบถัดไป" aria-controls={handId} disabled={centeredIndex >= cards.length - 1} onClick={() => move(1)}>›</button>
    </div> : null}
    {product ? <div id={detailId} className={styles.detail} data-hand-detail>
      <Image src={`/art/cards/${product.id}.webp`} alt="" width={1024} height={1536} sizes="2.5rem" draggable={false} />
      <div><p className={styles.detailLabel}>ไพ่ที่กำลังดู</p><strong>{product.name}</strong>
        <p>{product.category === 'legal' ? 'ถูกกฎหมาย' : 'ของต้องห้าม'} · มูลค่า {product.value} · {product.category === 'legal' ? `ชดเชย ${product.compensation}` : `ค่าปรับ ${product.fine}`}</p>
      </div>
    </div> : <p>ไม่มีไพ่ในมือ</p>}
    <p className={styles.hint}><span className={styles.desktopHint}>แตะไพ่เพื่อเลือกหรือเอาออก · ไพ่ที่เลือกจะยกขึ้น</span><span className={styles.mobileHint}>ปัดหมุนมือไพ่ · แตะเพื่อเลือกหรือเอาออก</span></p>
  </div>;
}
