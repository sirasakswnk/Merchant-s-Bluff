import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { joinPlayers, press, roomPhase, prepareAndPack, closeSheriffPopup } from './helpers/game-ui';
import { cleanupLocalFixture } from './helpers/local-fixture';
import { activeCards, assertApprovedInventory } from '../fixtures/inventory';

const output = process.env.MERCHANT_GAME_TABLE_OUTPUT ?? 'work/verification/game-table';
async function slots(page: Page) {
  return page.locator('.players .player').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.getAttribute('data-player-id')!, Number(node.getAttribute('data-seat-index'))])));
}
async function pinnedSeats(page: Page) {
  const own = page.locator('[data-own-seat="true"]'), sheriff = page.locator('[data-sheriff-seat="true"]');
  await expect(own).toHaveAttribute('data-seat-index', '0');
  const isMe = await sheriff.getAttribute('data-own-seat') === 'true';
  if (!isMe) await expect(sheriff).toHaveAttribute('data-top-seat', 'true');
  await expect.poll(async () => {
    const table = (await page.locator('[data-game-table]').boundingBox())!, face = (await own.locator('[data-avatar-id]').boundingBox())!;
    return face.y + face.height / 2 > table.y + table.height / 2;
  }).toBe(true);
  if (!isMe) await expect.poll(async () => {
    const table = (await page.locator('[data-game-table]').boundingBox())!, face = (await sheriff.locator('[data-avatar-id]').boundingBox())!;
    return Math.abs(face.x + face.width / 2 - table.x - table.width / 2) < 1 && face.y + face.height / 2 < table.y;
  }).toBe(true);
}

test('game table pins self and sheriff, swaps only the top occupant, and stays usable across scenes and sizes', async ({ page, context }) => {
  test.setTimeout(180000);
  const errors: string[] = [], forbidden: string[] = [], audits: unknown[] = [];
  page.on('pageerror', error => errors.push(error.message));
  context.on('request', request => { const url = new URL(request.url()); if (url.pathname.startsWith('/api/') || ['19000', '19099'].includes(url.port) || /firebaseio|firebasedatabase|identitytoolkit|securetoken/.test(url.hostname)) forbidden.push(url.pathname); });
  for (const count of [4, 5, 6]) for (const role of ['merchant', 'sheriff']) for (const width of [360, 390, 430, 740, 1280]) {
    await page.setViewportSize({ width, height: width === 740 ? 360 : 900 }); await page.goto(`/preview?frame=1&scene=negotiate&players=${count}&role=${role}`); await pinnedSeats(page);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.players .player')).toHaveCount(count);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const table = (await page.locator('[data-game-table]').boundingBox())!; expect(Math.abs(table.width - table.height)).toBeLessThan(1);
    const boxes = await page.locator('.players .player').evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, right: box.right, bottom: box.bottom }; }));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(Math.min(boxes[i].right, boxes[j].right) - Math.max(boxes[i].x, boxes[j].x) > 1 && Math.min(boxes[i].bottom, boxes[j].bottom) - Math.max(boxes[i].y, boxes[j].y) > 1, `overlapping profiles ${count}/${role}/${width}`).toBe(false);
    expect((await page.locator('#your-turn').boundingBox())!.y).toBeGreaterThan(Math.max(...boxes.map(box => box.bottom)));
  }
  for (const count of [4, 5, 6]) for (const role of ['merchant', 'sheriff']) {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`/preview?frame=1&scene=negotiate&players=${count}&role=${role}`);
    const originalIds = await page.locator('.players .player').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-player-id')));
    for (let turn = 0; turn < count * 2; turn++) {
      await pinnedSeats(page); await closeSheriffPopup(page); const before = await slots(page); await page.getByRole('button', { name: 'เปลี่ยนนายด่านตัวอย่าง', exact: true }).click(); await pinnedSeats(page);
      const after = await slots(page); expect(Object.keys(after).filter(id => before[id] !== after[id]).length).toBeLessThanOrEqual(2);
      expect(await page.locator('.players .player').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-player-id')))).toEqual(originalIds);
    }
  }
  const scenes = ['prepare', 'pack', 'negotiate', 'pass-legal', 'pass-contraband', 'inspect-legal', 'inspect-contraband', 'summary', 'game-over', 'aborted'];
  for (const scene of scenes) for (const role of ['merchant', 'sheriff']) for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(`/preview?frame=1&scene=${scene}&players=6&role=${role}`);
    await expect(page.locator('main')).toHaveAttribute('data-game-viewer', role === 'sheriff' ? 'preview-player-1' : 'preview-player-2');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (scene.startsWith('pass-')) {
      const text = (await page.locator('[data-table-center]').innerText()) + (await page.locator('.result').innerText()); expect(text).not.toMatch(/เหล้าเถื่อน|หน้าไม้|ใบกัญชา/);
      if (scene.endsWith('contraband')) await expect(page.locator('.result-bag')).toHaveClass(/glow/);
    }
    if (scene === 'inspect-contraband') await expect(page.locator('.result')).toContainText('หน้าไม้');
    if (width === 360) {
      const analysis = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze(); audits.push({ scene, role, violations: analysis.violations }); expect(analysis.violations).toEqual([]);
    }
  }
  await page.setViewportSize({ width: 360, height: 740 }); await page.goto('/preview?frame=1&scene=pack&players=6&role=merchant');
  await page.getByRole('link', { name: 'ไพ่และปุ่มของฉัน', exact: true }).click(); await expect(page.locator('#your-turn')).toBeInViewport();
  const card = page.locator('button.card').first(); await card.focus(); await page.keyboard.press('Space'); await expect(card).toHaveAttribute('aria-pressed', 'true');
  const targets = await page.locator('main button:visible, main select:visible, main input:visible, main summary:visible, main a:visible').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().height < 43.5).map(node => node.textContent?.trim())); expect(targets).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'reduce' }); expect(await page.locator('.players .player').first().evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; document.body.style.fontSize = '32px'; }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir(output, { recursive: true }); await page.screenshot({ path: `${output}/text-200.png`, fullPage: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; document.body.style.fontSize = ''; });
  await page.setViewportSize({ width: 320, height: 740 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await writeFile(`${output}/accessibility.json`, JSON.stringify({ layoutCases: 30, sceneCases: 40, sheriffTransitions: 60, audits, pageErrors: errors, apiOrFirebaseRequests: forbidden }, null, 2)); expect(errors).toEqual([]); expect(forbidden).toEqual([]);
});

test('four real players exchange three, pack five, inspect and pass; the next sheriff swaps on screen without changing the game', async ({ browser }) => {
  test.setTimeout(120000);
  const { contexts, pages } = await joinPlayers(browser, 4);
  const origin = new URL(pages[0].url()).origin, roomId = new URL(pages[0].url()).pathname.split('/').at(-1)!;
  const playerIds = await Promise.all(pages.map(async page => (await page.locator('main').getAttribute('data-lobby-viewer'))!));
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:19000';
  const app = initializeApp({ projectId: 'demo-merchants-bluff', databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' }, 'game-table-flow'); const db = getDatabase(app);
  const errors: string[] = [], checkpoints: unknown[] = [], report: Record<string, unknown> = {}; pages.forEach(page => page.on('pageerror', error => errors.push(error.message)));
  const snapshot = async () => JSON.parse((await db.ref(`rooms/${roomId}/authoritative/snapshot`).get()).val());
  try {
    for (const page of pages) { await press(page, 'พร้อม'); await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled(); }
    await press(pages[0], 'เริ่มเกม'); for (const page of pages) await roomPhase(page, 'PREPARE', 1);
    const initial = await snapshot(), inventoryIds = activeCards(initial.game).map(card => card.instanceId);
    const checkpoint = async () => { const current = await snapshot(); checkpoints.push(assertApprovedInventory(current.game, inventoryIds)); expect(current.seatOrder).toEqual(initial.seatOrder); return current; };
    await checkpoint(); for (const page of pages) await pinnedSeats(page);
    const { sheriff, merchants } = await prepareAndPack(pages, 1, 5, 3); await checkpoint();
    for (let step = 0; step < merchants.length; step++) {
      const official = pages[sheriff]; await press(official, `เลือก ทดสอบ${merchants[step] + 1}`); const action = step === 0 ? 'ให้ผ่าน' : 'ตรวจ'; await press(official, action); await press(official, `ยืนยัน${action}`);
      for (const page of pages) await roomPhase(page, 'RESOLUTION', 1); const current = await checkpoint();
      expect(current.game.currentResolution.result.bagCount).toBe(5);
      if (action === 'ให้ผ่าน') for (const page of pages) expect(await page.locator('.result').innerText()).not.toMatch(/เหล้าเถื่อน|หน้าไม้|ใบกัญชา/);
      await press(official, step === merchants.length - 1 ? 'สรุปรอบ' : 'เลือกพ่อค้าคนต่อไป');
    }
    for (const page of pages) await roomPhase(page, 'ROUND_SUMMARY', 1); const before = await Promise.all(pages.map(slots));
    await press(pages[sheriff], 'จบรอบ / ส่งต่อตำแหน่งนายด่าน'); for (const page of pages) await roomPhase(page, 'PREPARE', 2); await checkpoint();
    for (let index = 0; index < pages.length; index++) { await pinnedSeats(pages[index]); const after = await slots(pages[index]); expect(Object.keys(after).filter(id => before[index][id] !== after[id]).length).toBeLessThanOrEqual(2); }
    await pages[1].reload(); await roomPhase(pages[1], 'PREPARE', 2); await pinnedSeats(pages[1]);
    const second = await prepareAndPack(pages, 2, 1, 0); await press(pages[second.sheriff], `เลือก ทดสอบ${second.merchants[0] + 1}`); await press(pages[second.sheriff], 'ให้ผ่าน'); await press(pages[second.sheriff], 'ยืนยันให้ผ่าน');
    for (const page of pages) await roomPhase(page, 'RESOLUTION', 2); await checkpoint();
    await closeSheriffPopup(pages[0]); pages[0].once('dialog', dialog => dialog.accept()); await press(pages[0], 'ยุติเกมนี้');
    for (const page of pages) { await expect(page.getByRole('heading', { name: 'ยุติเกม', exact: true })).toBeVisible(); await expect(page.locator('.result-bag')).toHaveCount(0); await expect(page.getByRole('link', { name: 'ดูผลตัดสิน', exact: false })).toHaveCount(0); }
    await press(pages[0], 'กลับล็อบบี้เพื่อเล่นใหม่'); for (const page of pages) await roomPhase(page, 'LOBBY'); expect(errors).toEqual([]);
    Object.assign(report, { passed: true, players: 4, exchange: 3, bagSize: 5, actions: ['PASS', 'INSPECT', 'INSPECT'], advancedToRound: 2, seatOrderPreserved: true, abortDuringResolution: true, rematch: true, checkpoints, pageErrors: errors });
  } finally { await Promise.all(contexts.map(context => context.close())); await deleteApp(app); report.cleanup = await cleanupLocalFixture(origin, roomId, playerIds); await mkdir(output, { recursive: true }); await writeFile(`${output}/live-4-player.json`, JSON.stringify(report, null, 2)); }
});
