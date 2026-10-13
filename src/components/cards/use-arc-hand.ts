'use client';

import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';

interface ArcHandOptions {
  cardIds: readonly string[];
  selectedIds: readonly string[];
  onView: (index: number) => void;
}

interface Gesture {
  id: number; x: number; y: number; focus: number;
  lastX: number; time: number; velocity: number; dragging: boolean;
  button: HTMLButtonElement | null;
}

interface Controller {
  active: boolean;
  paint: () => void;
  center: (index: number, immediate?: boolean) => void;
  down: (event: PointerEvent<HTMLDivElement>) => void;
  move: (event: PointerEvent<HTMLDivElement>) => void;
  release: (event: PointerEvent<HTMLDivElement>, cancelled?: boolean) => void;
  consumeClick: (pointerClick: boolean) => boolean;
  key: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/** Local presentation only: a shared pivot, pointer gestures and a bounded view index. */
export function useArcHand(options: ArcHandOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const attachViewport = useCallback((element: HTMLDivElement | null) => { viewportRef.current = element; }, []);
  const latest = useRef(options);
  const controller = useRef<Controller | null>(null);
  const initialIndex = Math.floor(Math.max(0, options.cardIds.length - 1) / 2);
  const focus = useRef(initialIndex);
  const [centeredIndex, setCenteredIndex] = useState(initialIndex);
  const cardKey = JSON.stringify(options.cardIds);

  useLayoutEffect(() => {
    latest.current = options;
    controller.current?.paint();
  });

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const viewport = element;
    const hand = viewport.querySelector<HTMLElement>('[data-hand-group]')!;
    const buttons = Array.from(hand.querySelectorAll<HTMLButtonElement>('[data-card-id]'));
    const mobile = matchMedia('(max-width: 600px)'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let active = false, frame = 0, reported = -1, gesture: Gesture | null = null, suppressClick = false;
    let width = 0, cardWidth = 0, cardHeight = 0;
    const clamp = (index: number) => Math.max(0, Math.min(buttons.length - 1, index));
    const moving = (value: boolean) => viewport.setAttribute('data-hand-moving', String(value));

    function paint() {
      if (!active || !width || !cardHeight) return;
      const radius = cardHeight * 1.71, pivotY = cardHeight + cardHeight / 12 * 3.5 + radius;
      const selected = latest.current.selectedIds;
      buttons.forEach((button, index) => {
        const angle = (index - focus.current) * 12, radians = angle * Math.PI / 180;
        const isSelected = selected.includes(button.dataset.cardId!);
        const distance = radius + (isSelected ? 32 : 0);
        button.style.setProperty('--arc-x', `${width / 2 + Math.sin(radians) * distance - cardWidth / 2}px`);
        button.style.setProperty('--arc-y', `${pivotY - Math.cos(radians) * distance - cardHeight}px`);
        button.style.setProperty('--arc-angle', `${angle}deg`);
        button.style.setProperty('--arc-depth', String((isSelected ? 20 : 0) + 10 - Math.round(Math.abs(index - focus.current) * 2)));
      });
      const nearest = clamp(Math.round(focus.current));
      viewport.setAttribute('data-hand-center', String(nearest));
      if (nearest !== reported) {
        reported = nearest;
        setCenteredIndex(nearest);
        latest.current.onView(nearest);
      }
    }

    function refresh() {
      if (!active) return;
      width = viewport.clientWidth;
      cardWidth = buttons[0].offsetWidth; cardHeight = buttons[0].offsetHeight;
      paint();
    }

    function stop() {
      cancelAnimationFrame(frame); moving(false);
    }

    function clearGesture() {
      const id = gesture?.id; gesture = null;
      if (id !== undefined && viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
    }

    function center(index: number, immediate = false) {
      if (!active) return;
      stop(); const target = clamp(index), start = focus.current;
      if (immediate || reduced.matches || Math.abs(target - start) < .001) {
        focus.current = target; paint(); return;
      }
      moving(true); const startTime = performance.now();
      function animate(time: number) {
        const progress = Math.min(1, (time - startTime) / 320);
        focus.current = start + (target - start) * (1 - (1 - progress) ** 3);
        paint();
        if (progress < 1) frame = requestAnimationFrame(animate);
        else moving(false);
      }
      frame = requestAnimationFrame(animate);
    }

    function configure() {
      stop(); clearGesture();
      active = mobile.matches && buttons.length > 0;
      if (controller.current) controller.current.active = active;
      viewport.setAttribute('data-hand-arc', String(active));
      if (active) {
        focus.current = clamp(focus.current); reported = -1;
        viewport.scrollLeft = 0; moving(true); refresh();
        frame = requestAnimationFrame(() => moving(false));
      } else {
        viewport.removeAttribute('data-hand-center');
        buttons.forEach(button => ['--arc-x', '--arc-y', '--arc-angle', '--arc-depth'].forEach(property => button.style.removeProperty(property)));
      }
    }

    controller.current = {
      active, paint, center,
      down(event) {
        if (!active || event.button !== 0 || !event.isPrimary || gesture) return;
        stop(); suppressClick = false;
        const hit = viewport.ownerDocument.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>('button[data-card-id]');
        gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, focus: focus.current, lastX: event.clientX, time: performance.now(), velocity: 0, dragging: false,
          button: hit && viewport.contains(hit) ? hit : null };
      },
      move(event) {
        if (!active || !gesture || gesture.id !== event.pointerId) return;
        const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
        if (!gesture.dragging) {
          if (Math.abs(dy) > Math.abs(dx) + 6) { gesture = null; return; }
          if (Math.abs(dx) < 8) return;
          gesture.dragging = true; viewport.setPointerCapture(event.pointerId); moving(true);
        }
        event.preventDefault();
        const now = performance.now(), step = Math.max(44, cardWidth * .625);
        gesture.velocity = (gesture.lastX - event.clientX) / Math.max(1, now - gesture.time) / step;
        gesture.lastX = event.clientX; gesture.time = now;
        focus.current = clamp(gesture.focus - dx / step); paint();
      },
      release(event, cancelled = false) {
        if (!gesture || gesture.id !== event.pointerId) return;
        const ending = gesture; gesture = null;
        if (ending.dragging) {
          suppressClick = true;
          const velocity = cancelled || reduced.matches || performance.now() - ending.time > 100 ? 0 : ending.velocity;
          center(Math.round(focus.current + Math.max(-.6, Math.min(.6, velocity * 100))));
        } else if (!cancelled && event.pointerType === 'touch' && ending.button?.isConnected) {
          // Touch browsers can adjust taps toward an overlapping neighbor. Activate the
          // visible card under the original touch, through its normal guarded click handler.
          ending.button.click(); suppressClick = true;
        }
        if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      },
      consumeClick(pointerClick) {
        const suppressed = suppressClick && pointerClick; suppressClick = false; return suppressed;
      },
      key(event) {
        if (!active || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
          : clamp(Math.round(focus.current) + (event.key === 'ArrowRight' ? 1 : -1));
        center(target, true); buttons[target].focus({ preventScroll: true });
      },
    };

    const observer = new ResizeObserver(refresh); observer.observe(viewport);
    const motionChanged = () => center(Math.round(focus.current), true);
    mobile.addEventListener('change', configure); reduced.addEventListener('change', motionChanged); configure();
    return () => {
      stop(); clearGesture(); observer.disconnect();
      mobile.removeEventListener('change', configure); reduced.removeEventListener('change', motionChanged);
      viewport.removeAttribute('data-hand-arc'); viewport.removeAttribute('data-hand-moving'); viewport.removeAttribute('data-hand-center');
      controller.current = null;
    };
  }, [cardKey]);

  return {
    attachViewport, centeredIndex,
    isActive: () => controller.current?.active ?? false,
    reveal(index: number, immediate = false) {
      if (!controller.current?.active) return false;
      viewportRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      controller.current.center(index, immediate); return true;
    },
    move: (direction: number) => controller.current?.center(Math.round(focus.current) + direction),
    suppressClick: (pointerClick: boolean) => controller.current?.consumeClick(pointerClick) ?? false,
    handlers: {
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => controller.current?.down(event),
      onPointerMove: (event: PointerEvent<HTMLDivElement>) => controller.current?.move(event),
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => controller.current?.release(event),
      onPointerCancel: (event: PointerEvent<HTMLDivElement>) => controller.current?.release(event, true),
      // Transferring touch's implicit capture from a card to the viewport is still a drag.
      onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) controller.current?.release(event, true); },
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => controller.current?.key(event),
    },
  };
}
