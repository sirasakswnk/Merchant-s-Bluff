import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { showHandCard, tapHandCard } from './helpers/hand';

const output = process.env.MERCHANT_HAND_OUTPUT ?? 'work/verification/arc-hand';
test.use({ hasTouch: true, isMobile: true });
interface Point { x: number; y: number; angle: number }

async function anchor(page: Page): Promise<Point> {
  return page.locator('button.card').nth(3).evaluate(node => {
    if (!(node instanceof HTMLButtonElement)) throw new Error('Expected a card button');
    const m = new DOMMatrix(getComputedStyle(node).transform);
    return { x: m.e + node.offsetWidth / 2, y: m.f + node.offsetHeight, angle: Math.atan2(m.b, m.a) * 180 / Math.PI };
  });
}

/** Native touch input exercises pointer capture and browser vertical panning. */
async function swipe(page: Page, direction: 'left' | 'right' | 'up' | 'down') {
  const viewport = page.locator('[data-hand-scroll]'), box = (await viewport.boundingBox())!;
  const vertical = direction === 'up' || direction === 'down';
  const x = box.x + box.width * (vertical ? .5 : direction === 'right' ? .2 : .8), y = box.y + box.height * (direction === 'down' ? .25 : .65);
  const client = await page.context().newCDPSession(page), points: Point[] = vertical ? [] : [await anchor(page)];
  try {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let step = 1; step <= 12; step++) {
      const distance = Math.min(220, box.width * .6) * step / 12;
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: vertical ? x : x + (direction === 'left' ? -distance : distance), y: direction === 'up' ? y - distance : direction === 'down' ? y + distance : y, id: 1 }] });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
      if (!vertical) points.push(await anchor(page));
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    if (!vertical) await expect(viewport).toHaveAttribute('data-hand-moving', 'false');
    return points;
  } finally { await client.detach(); }
}

/** Fit observed positions to a circle, rather than checking the layout formula. */
function circle(points: Point[]) {
  const distinct = points.filter((p, i) => !i || Math.abs(p.x - points[i - 1].x) > 1);
  const a = distinct[0], b = distinct[Math.floor(distinct.length / 2)], c = distinct.at(-1)!;
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  expect(Math.abs(d)).toBeGreaterThan(1);
  const norm = (p: Point) => p.x * p.x + p.y * p.y;
  const x = (norm(a) * (b.y - c.y) + norm(b) * (c.y - a.y) + norm(c) * (a.y - b.y)) / d;
  const y = (norm(a) * (c.x - b.x) + norm(b) * (a.x - c.x) + norm(c) * (b.x - a.x)) / d;
  const radius = Math.hypot(a.x - x, a.y - y), error = Math.max(...points.map(p => Math.abs(Math.hypot(p.x - x, p.y - y) - radius)));
  expect(error).toBeLessThan(1); expect(radius).toBeGreaterThan(250);
  expect(Math.min(...points.map(p => p.y))).toBeLessThan(Math.min(a.y, c.y) - 2);
  return { x, y, radius, error };
}

for (const scene of ['prepare', 'pack']) for (const width of [320, 390, 430]) test(`mobile hand ${scene}/${width} rotates, snaps and preserves selection`, async ({ page, context }) => {
  const errors: string[] = [], forbidden: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  context.on('request', request => { const url = new URL(request.url()); if (url.pathname.startsWith('/api/') || ['19000', '19099'].includes(url.port) || /firebaseio|firebasedatabase|identitytoolkit|securetoken/.test(url.hostname)) forbidden.push(url.pathname); });
  await page.setViewportSize({ width, height: 900 }); await page.goto(`/preview?frame=1&scene=${scene}&role=merchant&players=6`);
  const viewport = page.locator('[data-hand-scroll]'), cards = page.locator('button.card');
  await expect(viewport).toHaveAttribute('data-hand-arc', 'true');
  await viewport.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  const beforeY = await page.evaluate(() => scrollY), roomBelow = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY);
  await swipe(page, roomBelow > 60 ? 'up' : 'down');
  if (roomBelow > 60) await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeY + 20);
  else await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(beforeY - 20);
  await expect(page.locator('button.card[aria-pressed="true"]')).toHaveCount(0);
  await viewport.scrollIntoViewIfNeeded();
  const peek = await cards.evaluateAll(nodes => {
    for (let index = 0; index < nodes.length; index++) {
      const box = nodes[index].getBoundingClientRect(); if (box.left >= innerWidth || box.right <= innerWidth) continue;
      for (let x = Math.max(box.left + 12, innerWidth - 80); x < innerWidth - 8; x += 12) for (const ratio of [.3, .5, .7]) {
        const y = box.top + box.height * ratio; if (document.elementFromPoint(x, y) === nodes[index]) return { index, x, y };
      }
    }
    return null;
  });
  expect(peek).not.toBeNull();
  await page.touchscreen.tap(peek!.x, peek!.y); await expect(cards.nth(peek!.index)).toHaveAttribute('aria-pressed', 'true');
  await expect(viewport).toHaveAttribute('data-hand-moving', 'false'); await expect(cards.nth(peek!.index)).toBeInViewport({ ratio: .9 });
  await tapHandCard(page, peek!.index); await expect(cards.nth(peek!.index)).toHaveAttribute('aria-pressed', 'false');
  await tapHandCard(page, 0); const firstId = await cards.first().getAttribute('data-card-id'); await showHandCard(page, 2);
  const bounds = await viewport.evaluate(node => { const box = node.getBoundingClientRect(), panel = node.closest('.panel')!.getBoundingClientRect(); return { left: box.left, right: box.right, width: box.width, panelLeft: panel.left, panelRight: panel.right }; });
  expect(bounds.left).toBeLessThan(bounds.panelLeft); expect(bounds.right).toBeGreaterThan(bounds.panelRight); expect(bounds.width).toBe(width);
  const path = await swipe(page, 'left'), fitted = circle(path);
  expect(path[0].angle).toBeGreaterThan(10); expect(path.at(-1)!.angle).toBeLessThan(0);
  const afterLeft = Number(await viewport.getAttribute('data-hand-center')); expect(afterLeft).toBeGreaterThan(2);
  const selected = () => page.locator('button.card[aria-pressed="true"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-card-id')));
  expect(await selected()).toEqual([firstId]);
  await showHandCard(page, 5); await cards.last().tap(); await expect(cards.last()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-hand-detail]')).toContainText('หน้าไม้'); await expect(cards.last()).toBeInViewport({ ratio: .9 });
  expect(await cards.last().evaluate(node => Number(getComputedStyle(node).zIndex))).toBeGreaterThan(20);
  await cards.last().tap(); await swipe(page, 'right');
  expect(Number(await viewport.getAttribute('data-hand-center'))).toBeLessThan(5); expect(await selected()).toEqual([firstId]);
  await cards.last().focus(); await page.keyboard.press('End'); await expect(viewport).toHaveAttribute('data-hand-center', '5');
  await expect(cards.last()).toBeInViewport({ ratio: .9 }); await expect(page.getByRole('button', { name: 'ดูไพ่ใบถัดไป', exact: true })).toBeDisabled();
  for (let index = 4; index >= 0; index--) { await page.keyboard.press('Shift+Tab'); await expect(cards.nth(index)).toBeFocused(); await expect(cards.nth(index)).toBeInViewport({ ratio: .9 }); }
  await expect(page.getByRole('button', { name: 'ดูไพ่ใบก่อนหน้า', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const violations = (await new AxeBuilder({ page }).include('[data-merchant-hand]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations;
  expect(violations).toEqual([]); expect(errors).toEqual([]); expect(forbidden).toEqual([]);
  await mkdir(output, { recursive: true }); if (scene === 'pack') await viewport.screenshot({ path: `${output}/selected-${width}.png` });
  await writeFile(`${output}/gestures-${scene}-${width}.json`, JSON.stringify({ passed: true, scene, width, bounds, path, circle: fitted, peek, afterLeft, swipeDidNotSelect: true, verticalPan: true, keyboardAndBounds: true, violations, errors, apiOrFirebaseRequests: forbidden }, null, 2));
});
