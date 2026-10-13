import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { joinPlayers, press, roomPhase, publicMoney, closeSheriffPopup } from './helpers/game-ui';
import { showHandCard } from './helpers/hand';
import { cleanupLocalFixture } from './helpers/local-fixture';
import { activeCards, assertApprovedInventory } from '../fixtures/inventory';

const output = process.env.MERCHANT_OFFERS_OUTPUT ?? 'work/verification/coin-offers';
const seatOffer = (page: Page, id: string) => page.locator(`[data-player-id="${id}"] [data-offer-display="seat"]`);

test('offer picker keeps drafts private, clamps shortcuts and distinguishes explicit zero', async ({ page, context }) => {
  const forbidden: string[] = [];
  context.on('request', request => { const url = new URL(request.url()); if (url.pathname.startsWith('/api/') || ['19000', '19099'].includes(url.port) || /firebaseio|firebasedatabase|identitytoolkit|securetoken/.test(url.hostname)) forbidden.push(url.pathname); });
  await page.addInitScript(() => {
    const target = window as Window & { offerMotions?: string[] };
    target.offerMotions = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      if (this.hasAttribute('data-offer-display')) target.offerMotions!.push(this.getAttribute('data-offer-display')!);
      return original.apply(this, args);
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/preview?frame=1&scene=negotiate&role=merchant&players=6');
  const input = page.getByLabel('ยอดเสนอเงิน', { exact: true });
  const ownBadge = seatOffer(page, 'preview-player-2');
  await expect(input).toHaveValue('4'); await expect(ownBadge).toHaveAttribute('data-offer-amount', '4');
  expect(await page.evaluate(() => (window as Window & { offerMotions?: string[] }).offerMotions)).toEqual([]);
  await page.getByRole('button', { name: 'เพิ่ม 10 เหรียญ', exact: true }).click(); await expect(input).toHaveValue('14');
  await expect(ownBadge).toHaveAttribute('data-offer-amount', '4'); await expect(page.locator('[data-offer-display="tray"]')).toHaveAttribute('data-offer-amount', '4');
  expect(await page.evaluate(() => (window as Window & { offerMotions?: string[] }).offerMotions)).toEqual([]);
  await page.getByRole('button', { name: 'ยื่นข้อเสนอ 14 เหรียญ', exact: true }).click(); await expect(ownBadge).toHaveAttribute('data-offer-amount', '14');
  await expect.poll(() => page.evaluate(() => (window as Window & { offerMotions?: string[] }).offerMotions?.length)).toBe(2);
  await input.fill('49'); await page.getByRole('button', { name: 'เพิ่ม 5 เหรียญ', exact: true }).click(); await expect(input).toHaveValue('50');
  await expect(page.getByRole('button', { name: 'เพิ่ม 1 เหรียญ', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'ลด 1 เหรียญ', exact: true }).click(); await expect(input).toHaveValue('49');
  for (const value of ['-1', '1.5', '51', '']) { await input.fill(value); await expect(page.locator('[data-offer-submit]')).toBeDisabled(); }
  await input.fill('3'); await input.press('Enter'); await expect(ownBadge).toHaveAttribute('data-offer-amount', '3');
  await page.getByRole('button', { name: 'ไม่เสนอเงิน', exact: true }).click(); await expect(input).toHaveValue('0');
  await expect(ownBadge).toHaveAttribute('data-offer-submitted', 'true'); await expect(ownBadge).toHaveAttribute('data-offer-amount', '0'); await expect(ownBadge).toHaveText('ไม่เสนอเงิน');
  const recorded = await page.evaluate(() => (window as Window & { offerMotions?: string[] }).offerMotions?.length);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await input.fill('2'); await input.press('Enter');
  await expect(ownBadge).toHaveAttribute('data-offer-amount', '2');
  expect(await page.evaluate(() => (window as Window & { offerMotions?: string[] }).offerMotions?.length)).toBe(recorded);
  expect(forbidden).toEqual([]);
});

test('public offers fit all table sizes and offer controls remain accessible', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [], audits: unknown[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const count of [4, 5, 6]) for (const role of ['merchant', 'sheriff']) for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(`/preview?frame=1&scene=negotiate&role=${role}&players=${count}`);
    await expect(page.locator('[data-offer-display="seat"]')).toHaveCount(count - 1);
    const target = await page.locator('[data-table-center] h3').innerText();
    await expect(page.locator('[data-offer-display="tray"]')).toHaveAttribute('data-offer-amount', '4');
    expect(target.length).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const targets = await page.locator('main button:visible:not(.card),main input:visible').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().height < 44));
    expect(targets).toEqual([]);
    if (count === 6) {
      const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations;
      expect(violations).toEqual([]); audits.push({ role, width, violations });
      if (width === 390) { await mkdir(output, { recursive: true }); if (role === 'sheriff') { await page.locator('[data-sheriff-popup]').screenshot({ path: `${output}/popup-sheriff-390.png` }); await closeSheriffPopup(page); } await page.locator('[data-game-stage]').screenshot({ path: `${output}/table-${role}-390.png` }); if (role === 'merchant') await page.locator('#your-turn').screenshot({ path: `${output}/controls-${role}-390.png` }); }
    }
  }
  for (const state of ['readonly', 'busy', 'pending', 'offline']) {
    await page.goto(`/preview?frame=1&scene=negotiate&role=merchant&players=6&state=${state}`);
    await expect(page.locator('[data-offer-submit]')).toBeDisabled();
    if (state !== 'offline') for (const button of await page.locator('[data-offer-picker] button').all()) await expect(button).toBeDisabled();
    else { await page.getByLabel('ยอดเสนอเงิน').fill('7'); await page.getByLabel('ยอดเสนอเงิน').press('Enter'); await expect(seatOffer(page, 'preview-player-2')).toHaveAttribute('data-offer-amount', '4'); }
  }
  await page.setViewportSize({ width: 390, height: 900 }); await page.goto('/preview?frame=1&scene=negotiate&role=merchant&players=6');
  await page.getByRole('button', { name: 'เพิ่ม 1 เหรียญ', exact: true }).focus(); await page.keyboard.press('Enter'); await expect(page.getByLabel('ยอดเสนอเงิน')).toHaveValue('5');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; document.body.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('[data-offer-display="seat"]')).toHaveCount(5);
  expect(errors).toEqual([]); await mkdir(output, { recursive: true }); await writeFile(`${output}/accessibility.json`, JSON.stringify({ cases: 18, audits, errors, disabledStates: 4, text200: true }, null, 2));
});

test('confirmed offers sync to four players, reject stale confirmation and transfer only on pass', async ({ browser }) => {
  test.setTimeout(180000);
  const { contexts, pages } = await joinPlayers(browser, 4);
  const origin = new URL(pages[0].url()).origin, roomId = new URL(pages[0].url()).pathname.split('/').at(-1)!;
  const playerIds = await Promise.all(pages.map(async page => (await page.locator('main').getAttribute('data-lobby-viewer'))!));
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:19000';
  const app = initializeApp({ projectId: 'demo-merchants-bluff', databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' }, 'coin-offer-flow');
  const db = getDatabase(app), snapshot = async () => JSON.parse((await db.ref(`rooms/${roomId}/authoritative/snapshot`).get()).val());
  const report: Record<string, unknown> = {}, checkpoints: unknown[] = [], errors: string[] = [];
  pages.forEach(page => page.on('pageerror', error => errors.push(error.message)));
  try {
    for (const page of pages) { await press(page, 'พร้อม'); await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled(); }
    await press(pages[0], 'เริ่มเกม'); for (const page of pages) await roomPhase(page, 'PREPARE', 1);
    const initial = await snapshot(), inventoryIds = activeCards(initial.game).map(card => card.instanceId);
    const checkpoint = async () => { const current = await snapshot(); checkpoints.push(assertApprovedInventory(current.game, inventoryIds)); return current; };
    const sheriff = (await Promise.all(pages.map(page => page.locator('main').getAttribute('data-own-role')))).indexOf('sheriff');
    const merchants = pages.map((_, index) => index).filter(index => index !== sheriff);
    for (const index of merchants) { await press(pages[index], 'พร้อมจัดกระเป๋า'); await expect(pages[index].getByRole('button', { name: 'พร้อมจัดกระเป๋า', exact: true })).toHaveCount(0); }
    for (const page of pages) await roomPhase(page, 'PACK_AND_DECLARE', 1);
    for (const index of merchants) { await showHandCard(pages[index], 0); await pages[index].locator('button.card').first().click(); await press(pages[index], 'ปิดกระเป๋าและยืนยัน'); }
    for (const page of pages) await roomPhase(page, 'NEGOTIATE', 1);
    const official = pages[sheriff], merchant = pages[merchants[0]], id = playerIds[merchants[0]];
    await official.setViewportSize({ width: 390, height: 844 });
    for (const page of pages) await expect(seatOffer(page, id)).toHaveAttribute('data-offer-submitted', 'false');
    await merchant.getByRole('button', { name: 'เพิ่ม 10 เหรียญ', exact: true }).click(); await expect(merchant.getByLabel('ยอดเสนอเงิน')).toHaveValue('10');
    await merchant.reload(); await roomPhase(merchant, 'NEGOTIATE', 1); await expect(merchant.getByLabel('ยอดเสนอเงิน')).toHaveValue('10');
    for (const page of pages) await expect(seatOffer(page, id)).toHaveAttribute('data-offer-submitted', 'false');
    expect((await snapshot()).game.players[id].offer).toMatchObject({ submitted: false, amount: 0, version: 0 });
    await press(merchant, 'เสนอเงิน'); for (const page of pages) await expect(seatOffer(page, id)).toHaveAttribute('data-offer-amount', '10');
    await press(official, `เลือก ทดสอบ${merchants[0] + 1}`); await expect(official.locator('[data-offer-display="tray"]')).toHaveAttribute('data-offer-amount', '10');
    await press(official, 'ให้ผ่าน');
    await merchant.getByRole('button', { name: 'เพิ่ม 5 เหรียญ', exact: true }).click(); await press(merchant, 'เสนอเงิน');
    for (const page of pages) await expect(seatOffer(page, id)).toHaveAttribute('data-offer-amount', '15');
    await expect(official.getByRole('button', { name: 'ยืนยันให้ผ่าน', exact: true })).toBeDisabled();
    await expect(official.locator('.confirmation [role="alert"]')).toContainText('ข้อเสนอ');
    const beforePass = await checkpoint(); expect(beforePass.game.finances.cash[id]).toBe(50); expect(beforePass.game.finances.cash[playerIds[sheriff]]).toBe(50);
    await press(official, 'ยกเลิก'); await press(official, 'ให้ผ่าน'); await press(official, 'ยืนยันให้ผ่าน');
    for (const page of pages) await roomPhase(page, 'RESOLUTION', 1);
    const afterPass = await checkpoint(); expect(afterPass.game.finances.cash[id]).toBe(35); expect(afterPass.game.finances.cash[playerIds[sheriff]]).toBe(65);
    for (const page of pages) await expect.poll(async () => (await publicMoney(page)).find(player => player.id === id)?.cash).toBe(35);
    await expect(merchant.locator('[data-offer-picker]')).toHaveCount(0);
    const second = merchants[1], secondId = playerIds[second];
    await pages[second].getByLabel('ยอดเสนอเงิน').fill('8'); await press(pages[second], 'เสนอเงิน');
    for (const page of pages) await expect(seatOffer(page, secondId)).toHaveAttribute('data-offer-amount', '8');
    await press(official, 'เลือกพ่อค้าคนต่อไป'); for (const page of pages) await roomPhase(page, 'NEGOTIATE', 1);
    await press(official, `เลือก ทดสอบ${second + 1}`); await press(official, 'ตรวจ');
    const beforeInspect = await checkpoint(); await press(official, 'ยืนยันตรวจ'); for (const page of pages) await roomPhase(page, 'RESOLUTION', 1);
    const afterInspect = await checkpoint(), result = afterInspect.game.currentResolution.result;
    expect(result.action).toBe('INSPECT'); expect(result.paymentKind).not.toBe('BRIBE');
    const change = result.paymentKind === 'FINE' ? result.paymentAmount : -result.paymentAmount;
    expect(afterInspect.game.finances.cash[playerIds[sheriff]]).toBe(beforeInspect.game.finances.cash[playerIds[sheriff]] + change);
    expect(afterInspect.game.finances.cash[secondId]).toBe(beforeInspect.game.finances.cash[secondId] - change);
    const third = merchants[2], thirdId = playerIds[third]; await press(pages[third], 'ไม่เสนอเงิน');
    for (const page of pages) { await expect(seatOffer(page, thirdId)).toHaveAttribute('data-offer-submitted', 'true'); await expect(seatOffer(page, thirdId)).toHaveText('ไม่เสนอเงิน'); }
    await press(official, 'เลือกพ่อค้าคนต่อไป'); for (const page of pages) await roomPhase(page, 'NEGOTIATE', 1);
    await press(official, `เลือก ทดสอบ${third + 1}`); await expect(official.locator('[data-offer-pass]')).toHaveText('ให้ผ่าน · รับ 0 เหรียญ');
    await press(official, 'ให้ผ่าน'); await press(official, 'ยืนยันให้ผ่าน'); for (const page of pages) await roomPhase(page, 'RESOLUTION', 1);
    expect((await checkpoint()).game.currentResolution.result.paymentAmount).toBe(0);
    await press(official, 'สรุปรอบ'); for (const page of pages) await roomPhase(page, 'ROUND_SUMMARY', 1);
    expect(errors).toEqual([]); Object.assign(report, { passed: true, players: 4, draftPrivateAndRetainedOnReload: true, unselectedMerchantCanOffer: true, staleConfirmationRejected: true, passTransferred: 15, inspectDidNotTransferOffer: 8, explicitZero: true, fullRoundCompleted: true, checkpoints, errors });
  } finally {
    await Promise.all(contexts.map(context => context.close())); await deleteApp(app);
    report.cleanup = await cleanupLocalFixture(origin, roomId, playerIds); await mkdir(output, { recursive: true }); await writeFile(`${output}/live-4-player.json`, JSON.stringify(report, null, 2));
  }
});
