import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { joinPlayers, press, roomPhase } from './helpers/game-ui';
import { cleanupLocalFixture } from './helpers/local-fixture';
import { activeCards, assertApprovedInventory } from '../fixtures/inventory';
import { showHandCard, tapHandCard } from './helpers/hand';

const output = process.env.MERCHANT_HAND_OUTPUT ?? 'work/verification/merchant-hand';
test.use({ hasTouch: true });

test('touch selects individual cards in both phases, enforces limits and stays usable for 4–6 players', async ({ page, context }) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [], forbidden: string[] = [], views: unknown[] = [];
  page.on('pageerror', error => errors.push(error.message));
  context.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/') || ['19099', '19000'].includes(url.port) || /firebaseio|firebasedatabase|identitytoolkit|securetoken/.test(url.hostname)) forbidden.push(url.pathname);
  });
  for (const scene of ['prepare', 'pack']) for (const players of [4, 5, 6]) for (const width of [360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/preview?frame=1&scene=${scene}&role=merchant&players=${players}`);
    const hand = page.locator('[data-merchant-hand]'), cards = hand.locator('button.card');
    await expect(cards).toHaveCount(6); await hand.scrollIntoViewIfNeeded();
    await showHandCard(page, 0); const before = (await cards.first().boundingBox())!;
    await tapHandCard(page, 0); await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => before.y - (await cards.first().boundingBox())!.y).toBeGreaterThan(20);
    await expect(page.locator('[data-hand-detail]')).toContainText('แอปเปิล');
    const firstId = await cards.nth(0).getAttribute('data-card-id'), secondId = await cards.nth(1).getAttribute('data-card-id');
    expect(firstId).not.toBe(secondId);
    await tapHandCard(page, 1); await expect(hand.locator('[aria-pressed="true"]')).toHaveCount(2);
    if (scene === 'pack' && players === 6 && [390, 1280].includes(width)) { await mkdir(output, { recursive: true }); await hand.screenshot({ path: `${output}/selected-${width}.png` }); }
    const maximum = scene === 'pack' ? 5 : 3;
    for (let index = 2; index < maximum; index++) { await tapHandCard(page, index); await expect(cards.nth(index)).toHaveAttribute('aria-pressed', 'true'); }
    await expect(cards.nth(maximum)).toBeDisabled();
    await showHandCard(page, maximum); await cards.nth(maximum).tap({ force: true });
    await expect(hand.locator('[aria-pressed="true"]')).toHaveCount(maximum);
    await tapHandCard(page, 0); await expect(hand.locator('[aria-pressed="true"]')).toHaveCount(maximum - 1);
    await expect(cards.nth(maximum)).toBeEnabled(); await tapHandCard(page, maximum);
    await expect(hand.locator('[aria-pressed="true"]')).toHaveCount(maximum);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const targets = await cards.evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { width: box.width, height: box.height }; }));
    expect(targets.every(box => box.width >= 43.5 && box.height >= 44)).toBe(true);
    const violations = width === 390 && players === 6 ? (await new AxeBuilder({ page }).include('[data-merchant-hand]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations : [];
    expect(violations).toEqual([]); views.push({ scene, players, width, maximum, targets, violations });
  }
  expect(errors).toEqual([]); expect(forbidden).toEqual([]);
  await mkdir(output, { recursive: true }); await writeFile(`${output}/touch.json`, JSON.stringify({ passed: true, views, errors, apiOrFirebaseRequests: forbidden }, null, 2));
});

test('keyboard, reduced motion, large text and read-only states keep the hand usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/preview?frame=1&scene=pack&role=merchant&players=6');
  const hand = page.locator('[data-merchant-hand]'), cards = hand.locator('button.card');
  await cards.first().focus(); await page.keyboard.press('Space'); await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab'); await expect(cards.nth(1)).toBeFocused(); await page.keyboard.press('Enter'); await expect(cards.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' }); expect(await cards.first().evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; document.body.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('[data-hand-scroll]')).toHaveAttribute('data-hand-arc', 'true');
  await cards.last().focus(); await expect(cards.last()).toBeInViewport({ ratio: .9 });
  await expect(page.locator('[data-hand-detail]')).toContainText('หน้าไม้');
  await mkdir(output, { recursive: true }); await hand.screenshot({ path: `${output}/text-200.png` });
  await page.goto('/preview?frame=1&scene=pack&role=merchant&players=6'); await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('[data-hand-scroll]')).toHaveAttribute('data-hand-arc', 'true');
  await cards.last().focus(); await expect(cards.last()).toBeInViewport({ ratio: .9 });
  for (const state of ['readonly', 'busy', 'pending']) {
    await page.goto(`/preview?frame=1&scene=pack&role=merchant&players=6&state=${state}`);
    for (const card of await cards.all()) await expect(card).toBeDisabled();
    await showHandCard(page, 0); await cards.first().click({ force: true }); await expect(hand.locator('[aria-pressed="true"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'ปิดกระเป๋าและยืนยัน', exact: true })).toBeDisabled();
  }
  await page.goto('/preview?frame=1&scene=pack&role=merchant&players=6&state=offline');
  await tapHandCard(page, 0); await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'ปิดกระเป๋าและยืนยัน', exact: true })).toBeDisabled();
});

test('four real players retain their draft, exchange exactly three, pack five and finish a round', async ({ browser }) => {
  test.setTimeout(120000);
  const { contexts, pages } = await joinPlayers(browser, 4, undefined, true);
  const origin = new URL(pages[0].url()).origin, roomId = new URL(pages[0].url()).pathname.split('/').at(-1)!;
  const playerIds = await Promise.all(pages.map(async page => (await page.locator('main').getAttribute('data-lobby-viewer'))!));
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:19000';
  const app = initializeApp({ projectId: 'demo-merchants-bluff', databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' }, 'merchant-hand-flow');
  const db = getDatabase(app), snapshot = async () => JSON.parse((await db.ref(`rooms/${roomId}/authoritative/snapshot`).get()).val());
  const report: Record<string, unknown> = {}, errors: string[] = [], checkpoints: unknown[] = [];
  pages.forEach(page => page.on('pageerror', error => errors.push(error.message)));
  try {
    for (const page of pages) { await press(page, 'พร้อม'); await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled(); }
    await press(pages[0], 'เริ่มเกม'); for (const page of pages) await roomPhase(page, 'PREPARE', 1);
    const initial = await snapshot(), ids = activeCards(initial.game).map(card => card.instanceId);
    const checkpoint = async () => { const current = await snapshot(); checkpoints.push(assertApprovedInventory(current.game, ids)); expect(current.seatOrder).toEqual(initial.seatOrder); return current; };
    const sheriff = (await Promise.all(pages.map(page => page.locator('main').getAttribute('data-own-role')))).indexOf('sheriff');
    const merchants = pages.map((_, index) => index).filter(index => index !== sheriff);
    for (const index of merchants) {
      const page = pages[index], cards = page.locator('button.card');
      const exchanged: string[] = [];
      for (let position = 0; position < 3; position++) { exchanged.push((await cards.nth(position).getAttribute('data-card-id'))!); await tapHandCard(page, position); await expect(cards.nth(position)).toHaveAttribute('aria-pressed', 'true'); }
      if (index === merchants[0]) { await page.reload(); await roomPhase(page, 'PREPARE', 1); expect(await page.locator('button.card[aria-pressed="true"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-card-id')))).toEqual(exchanged); }
      const response = page.waitForResponse(response => response.url().endsWith('/api/rooms/command') && response.request().postDataJSON().command.type === 'prepareGoods');
      await press(page, 'พร้อมจัดกระเป๋า'); const reply = await response; expect(reply.status()).toBe(200); expect(reply.request().postDataJSON().command.cardIds).toEqual(exchanged);
      await expect(page.getByRole('button', { name: 'พร้อมจัดกระเป๋า', exact: true })).toHaveCount(0); const current = await checkpoint();
      expect(current.game.players[playerIds[index]].hand).toHaveLength(6);
      expect(current.game.players[playerIds[index]].hand.every((card: { instanceId: string }) => !exchanged.includes(card.instanceId))).toBe(true);
    }
    for (const page of pages) await roomPhase(page, 'PACK_AND_DECLARE', 1);
    for (const index of merchants) {
      const page = pages[index], cards = page.locator('button.card');
      await expect(page.locator('button.card[aria-pressed="true"]')).toHaveCount(0);
      const packed: string[] = [];
      for (let position = 0; position < 5; position++) { packed.push((await cards.nth(position).getAttribute('data-card-id'))!); await tapHandCard(page, position); await expect(cards.nth(position)).toHaveAttribute('aria-pressed', 'true'); }
      await expect(cards.last()).toBeDisabled(); await page.getByRole('combobox', { name: 'แจ้งสินค้า', exact: true }).selectOption('bread');
      if (index === merchants[0]) { await page.reload(); await roomPhase(page, 'PACK_AND_DECLARE', 1); expect(await page.locator('button.card[aria-pressed="true"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-card-id')))).toEqual(packed); await expect(page.getByRole('combobox', { name: 'แจ้งสินค้า', exact: true })).toHaveValue('bread'); }
      const response = page.waitForResponse(response => response.url().endsWith('/api/rooms/command') && response.request().postDataJSON().command.type === 'lockBag');
      await press(page, 'ปิดกระเป๋าและยืนยัน'); const reply = await response; expect(reply.status()).toBe(200); expect(reply.request().postDataJSON().command.cardIds).toEqual(packed);
      expect(reply.request().postDataJSON().command.declaredProductId).toBe('bread');
      await expect(cards).toHaveCount(0); const current = await checkpoint(); expect(current.game.players[playerIds[index]].bag.map((card: { instanceId: string }) => card.instanceId)).toEqual(packed);
    }
    for (const page of pages) await roomPhase(page, 'NEGOTIATE', 1);
    for (const index of merchants) { await press(pages[index], 'ไม่เสนอเงิน'); await expect(pages[index].getByText('ยืนยันล่าสุด: ไม่เสนอเงิน', { exact: true })).toBeVisible(); }
    for (let position = 0; position < merchants.length; position++) {
      await press(pages[sheriff], `เลือก ทดสอบ${merchants[position] + 1}`); await press(pages[sheriff], 'ให้ผ่าน'); await press(pages[sheriff], 'ยืนยันให้ผ่าน');
      for (const page of pages) await roomPhase(page, 'RESOLUTION', 1);
      expect((await checkpoint()).game.currentResolution.result.bagCount).toBe(5);
      await press(pages[sheriff], position === merchants.length - 1 ? 'สรุปรอบ' : 'เลือกพ่อค้าคนต่อไป');
    }
    for (const page of pages) await roomPhase(page, 'ROUND_SUMMARY', 1);
    await press(pages[sheriff], 'จบรอบ / ส่งต่อตำแหน่งนายด่าน'); for (const page of pages) await roomPhase(page, 'PREPARE', 2);
    await checkpoint(); expect(errors).toEqual([]);
    Object.assign(report, { passed: true, players: 4, exchanged: 3, packed: 5, draftAndDeclarationRetainedOnReload: true, commandIdsMatchSelection: true, fullRoundCompleted: true, nextRound: 2, checkpoints, errors });
  } finally {
    await Promise.all(contexts.map(context => context.close())); await deleteApp(app);
    report.cleanup = await cleanupLocalFixture(origin, roomId, playerIds);
    await mkdir(output, { recursive: true }); await writeFile(`${output}/live-4-player.json`, JSON.stringify(report, null, 2));
  }
});
