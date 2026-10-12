'use client';
import { useEffect, useRef, type ReactNode } from 'react';

/** Visual effects only. Never reads game state or sends gameplay commands. */
export function HomeMotion({ children, className }: { children: ReactNode; className: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
    const hero = root.querySelector<HTMLElement>('.hero')!;
    const cards = [...root.querySelectorAll<HTMLElement>('.goods .card')];
    const goods = root.querySelector<HTMLElement>('.goods')!;
    let dealt = false;
    const reset = (card: HTMLElement) => { card.style.transition = ''; card.style.transform = ''; card.classList.remove('is-tilting'); };
    const deal = () => {
      if (dealt || reduce.matches) return;
      dealt = true;
      const deck = root.querySelector('.deck')!.getBoundingClientRect();
      for (const card of cards) {
        const rectangle = card.getBoundingClientRect();
        card.style.setProperty('--dx', (deck.left + deck.width / 2 - rectangle.left - rectangle.width / 2) + 'px');
        card.style.setProperty('--dy', (deck.top + deck.height / 2 - rectangle.top - rectangle.height / 2) + 'px');
        card.classList.add('is-dealing');
      }
    };
    const end = (event: AnimationEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (event.animationName === 'home-deal-fly') target.classList.remove('is-dealing');
      if (event.animationName === 'home-token-flip') target.classList.remove('is-flipping');
    };
    const changeAvatar = (event: Event) => {
      const input = event.target;
      if (reduce.matches || !(input instanceof HTMLInputElement) || input.name !== 'avatar') return;
      const face = input.nextElementSibling as HTMLElement;
      face.classList.remove('is-flipping'); void face.offsetWidth; face.classList.add('is-flipping');
    };
    const move = (event: PointerEvent) => {
      if (reduce.matches || !finePointer.matches || !(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>('.card');
      if (!card || card.classList.contains('is-dealing')) return;
      const rectangle = card.getBoundingClientRect();
      const x = (event.clientX - rectangle.left) / rectangle.width - .5;
      const y = (event.clientY - rectangle.top) / rectangle.height - .5;
      card.style.transition = 'transform .08s linear';
      card.style.transform = `perspective(700px) translateY(-6px) rotateX(${(-y * 12).toFixed(2)}deg) rotateY(${(x * 14).toFixed(2)}deg)`;
      card.style.setProperty('--mx', ((x + .5) * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((y + .5) * 100).toFixed(1) + '%'); card.classList.add('is-tilting');
    };
    const out = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>('.card');
      if (card && (!(event.relatedTarget instanceof Node) || !card.contains(event.relatedTarget))) reset(card);
    };
    const motionChanged = () => { if (reduce.matches) for (const card of cards) { reset(card); card.classList.remove('is-dealing'); } };
    const heroObserver = new IntersectionObserver(([entry]) => hero.classList.toggle('is-offscreen', !entry.isIntersecting));
    heroObserver.observe(hero);
    const goodsObserver = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting) && !reduce.matches) { goodsObserver.disconnect(); deal(); } }, { threshold: .35 });
    goodsObserver.observe(root.querySelector('#goods-legal')!);
    root.addEventListener('animationend', end); root.addEventListener('change', changeAvatar);
    goods.addEventListener('pointermove', move); goods.addEventListener('pointerout', out); reduce.addEventListener('change', motionChanged);
    return () => {
      heroObserver.disconnect(); goodsObserver.disconnect();
      root.removeEventListener('animationend', end); root.removeEventListener('change', changeAvatar);
      goods.removeEventListener('pointermove', move); goods.removeEventListener('pointerout', out); reduce.removeEventListener('change', motionChanged);
    };
  }, []);
  return <div id="top" className={`home-page ${className}`} ref={rootRef}>{children}</div>;
}
