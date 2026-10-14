import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { makePreviewModel } from '../../src/lib/preview/scenarios';
import { joinPlayers, prepareAndPack, press, roomPhase } from './helpers/game-ui';
import { cleanupLocalFixture } from './helpers/local-fixture';
import { activeCards, assertApprovedInventory } from '../fixtures/inventory';

const output = 'work/verification/final-score-popup';

test('final ranking opens automatically and shows rank, avatar, name, total score and its breakdown at all sizes', async ({ page, context }) => {
  test.setTimeout(120000);
  const errors: string[] = [], forbidden: string[] = [], views: unknown[] = [];
  page.on('pageerror', error => errors.push(error.message));
  context.on('request', request => { const url = new URL(request.url()); if (url.pathname.startsWith('/api/') || ['19000', '19099'].includes(url.port) || /firebaseio|firebasedatabase|identitytoolkit|securetoken/.test(url.hostname)) forbidden.push(url.pathname); });
  for (const players of [4, 5, 6] as const) for (const role of ['merchant', 'sheriff'] as const) for (const width of [320, 390, 430, 740, 1280]) {
    const height = width === 740 ? 360 : 900;
    await page.setViewportSize({ width, height }); await page.goto(`/preview?frame=1&scene=game-over&players=${players}&role=${role}`);
    const popup = page.getByRole('dialog', { name: 'คะแนนสุดท้าย', exact: true });
    await expect(popup).toBeVisible(); await expect(popup).toHaveAttribute('open', '');
    const model = makePreviewModel({ scene: 'game-over', players, role, state: 'online', width: 'auto' });
    const rendered = await popup.locator('[data-score-player]').evaluateAll(nodes => nodes.map(node => ({ id: node.getAttribute('data-score-player'), rank: Number(node.getAttribute('data-rank')), cash: Number(node.getAttribute('data-cash')), total: Number(node.getAttribute('data-total')), avatar: Number(node.querySelector('[data-avatar-id]')!.getAttribute('data-avatar-id')), text: node.textContent })));
    expect(rendered.map(row => ({ id: row.id, rank: row.rank, cash: row.cash, total: row.total }))).toEqual(model.room.scores!.standings.map(row => ({ id: row.playerId, rank: row.rank, cash: row.cash, total: row.total })));
    // The sample is built so coins alone would crown someone else: ranking must follow total score.
    expect(Math.max(...rendered.map(row => row.cash))).toBeGreaterThan(rendered[0].cash);
    for (const row of rendered) { const profile = model.room.players.find(player => player.id === row.id)!; const score = model.room.scores!.standings.find(item => item.playerId === row.id)!; expect(row.avatar).toBe(profile.avatarId); expect(row.text).toContain(profile.displayName); expect(row.text).toContain(`${score.total}คะแนน`); expect(row.text).toContain(`เงินสด ${score.cash} · สินค้า ${score.goodsValue} · โบนัส ${score.bonus}`); }
    await expect(popup.locator('dl')).toHaveCount(0); await expect(page.locator('main .scores')).toHaveCount(1);
    await expect(popup.getByRole('heading', { name: /เจ้าตลาด/ })).toBeVisible(); await expect(popup.getByText('คะแนน = เงินสด + มูลค่าสินค้าในคลัง + โบนัสเจ้าตลาด + ลูกหนี้ − หนี้', { exact: true })).toBeVisible();
    const box = (await popup.boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width + .5); expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(height + .5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'ปิดสรุปอันดับ', exact: true })).toBeFocused();
    const targets = await popup.locator('button').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { width: r.width, height: r.height }; })); expect(targets.every(r => r.width >= 44 && r.height >= 44)).toBe(true);
    const violations = players === 6 ? (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations : [];
    expect(violations).toEqual([]); views.push({ players, role, width, height, rows: rendered, axeChecked: players === 6, violations });
    if (players === 6 && role === 'merchant' && [390, 1280].includes(width)) { await mkdir(output, { recursive: true }); await popup.screenshot({ path: `${output}/popup-${width}.png` }); }
  }
  expect(errors).toEqual([]); expect(forbidden).toEqual([]); await mkdir(output, { recursive: true }); await writeFile(`${output}/layout.json`, JSON.stringify({ cases: 30, views, errors, apiOrFirebaseRequests: forbidden }, null, 2));
});

test('ranking popup closes, restores focus, reopens and retains rematch controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/preview?frame=1&scene=game-over&players=6&role=sheriff');
  const popup = page.getByRole('dialog', { name: 'คะแนนสุดท้าย', exact: true });
  await expect(popup).toBeVisible();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'กลับล็อบบี้เพื่อเล่นใหม่', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); expect(await page.evaluate(() => document.activeElement?.closest('[data-score-popup]') !== null)).toBe(true);
  await page.keyboard.press('Escape'); await expect(popup).toBeHidden();
  await expect(page.getByRole('button', { name: 'ดูอันดับอีกครั้ง', exact: true })).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
  await page.keyboard.press('Enter'); await expect(popup).toBeVisible();
  await page.getByRole('button', { name: 'ปิดสรุปอันดับ', exact: true }).click(); await expect(popup).toBeHidden();
  await page.getByRole('button', { name: 'ดูอันดับอีกครั้ง', exact: true }).click(); await expect(popup).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; document.body.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(popup.locator('[data-score-player]')).toHaveCount(6);
  await page.getByRole('button', { name: 'กลับล็อบบี้เพื่อเล่นใหม่', exact: true }).click(); await expect(page.locator('main')).toHaveAttribute('data-phase', 'LOBBY'); await expect(page.locator('[data-score-popup]')).toHaveCount(0);
  for (const state of ['readonly', 'offline', 'pending', 'busy']) {
    await page.goto(`/preview?frame=1&scene=game-over&players=6&role=sheriff&state=${state}`); await expect(popup).toBeVisible();
    await expect(page.getByRole('button', { name: 'กลับล็อบบี้เพื่อเล่นใหม่', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'ปิดสรุปอันดับ', exact: true }).click(); await expect(popup).toBeHidden();
  }
});

test('four real players finish a game, see matching ranking popups and rematch', async ({ browser }) => {
  test.setTimeout(180000);
  const { contexts, pages } = await joinPlayers(browser, 4);
  const origin = new URL(pages[0].url()).origin, roomId = new URL(pages[0].url()).pathname.split('/').at(-1)!;
  const playerIds = await Promise.all(pages.map(async page => (await page.locator('main').getAttribute('data-lobby-viewer'))!));
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:19000';
  const app = initializeApp({ projectId: 'demo-merchants-bluff', databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' }, 'score-popup-flow');
  const db = getDatabase(app), snapshot = async () => JSON.parse((await db.ref(`rooms/${roomId}/authoritative/snapshot`).get()).val());
  const report: Record<string, unknown> = {}, checkpoints: unknown[] = [], errors: string[] = [];
  pages.forEach(page => page.on('pageerror', error => errors.push(error.message)));
  try {
    for (const page of pages) { await press(page, 'พร้อม'); await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled(); }
    await press(pages[0], 'เริ่มเกม'); for (const page of pages) await roomPhase(page, 'PREPARE', 1);
    const initial = await snapshot(), ids = activeCards(initial.game).map(card => card.instanceId);
    for (let round = 1; round <= 8; round++) {
      const { sheriff, merchants } = await prepareAndPack(pages, round);
      for (let index = 0; index < merchants.length; index++) {
        await press(pages[sheriff], `เลือก ทดสอบ${merchants[index] + 1}`); await press(pages[sheriff], 'ให้ผ่าน'); await press(pages[sheriff], 'ยืนยันให้ผ่าน');
        for (const page of pages) await roomPhase(page, 'RESOLUTION', round);
        await press(pages[sheriff], index === merchants.length - 1 ? 'สรุปรอบ' : 'เลือกพ่อค้าคนต่อไป');
      }
      for (const page of pages) await roomPhase(page, 'ROUND_SUMMARY', round);
      checkpoints.push(assertApprovedInventory((await snapshot()).game, ids));
      await press(pages[sheriff], round === 8 ? 'ยืนยันจบรอบสุดท้ายและดูคะแนน' : 'จบรอบ / ส่งต่อตำแหน่งนายด่าน');
    }
    for (const page of pages) await roomPhase(page, 'GAME_OVER', 8);
    const finished = await snapshot(); checkpoints.push(assertApprovedInventory(finished.game, ids));
    for (const page of pages) {
      await roomPhase(page, 'GAME_OVER', 8); const popup = page.getByRole('dialog', { name: 'คะแนนสุดท้าย', exact: true }); await expect(popup).toBeVisible();
      const rows = await popup.locator('[data-score-player]').evaluateAll(nodes => nodes.map(node => ({ id: node.getAttribute('data-score-player'), rank: Number(node.getAttribute('data-rank')), cash: Number(node.getAttribute('data-cash')) })));
      expect(rows).toEqual(finished.game.scores.standings.map((row: { playerId: string; rank: number; cash: number }) => ({ id: row.playerId, rank: row.rank, cash: row.cash })));
    }
    await pages[1].keyboard.press('Escape'); await expect(pages[1].getByRole('button', { name: 'ดูอันดับอีกครั้ง', exact: true })).toBeFocused();
    await pages[1].reload(); await expect(pages[1].getByRole('dialog', { name: 'คะแนนสุดท้าย', exact: true })).toBeVisible();
    await press(pages[0], 'กลับล็อบบี้เพื่อเล่นใหม่'); for (const page of pages) { await roomPhase(page, 'LOBBY'); await expect(page.locator('[data-score-popup]')).toHaveCount(0); }
    expect(errors).toEqual([]); Object.assign(report, { passed: true, players: 4, rounds: 8, rankingMatchesServer: true, popupAutoOpensForEveryone: true, reloadAndEscape: true, rematch: true, checkpoints, errors });
  } finally {
    await Promise.all(contexts.map(context => context.close())); await deleteApp(app); report.cleanup = await cleanupLocalFixture(origin, roomId, playerIds);
    await mkdir(output, { recursive: true }); await writeFile(`${output}/live-4-player.json`, JSON.stringify(report, null, 2));
  }
});
