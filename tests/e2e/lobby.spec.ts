import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
import { press, roomPhase } from './helpers/game-ui';

const output = 'work/verification/lobby-table';

test('lobby preview keeps the viewer below a round table across 4/5/6 players, roles and mobile widths', async ({ page, context }) => {
  test.setTimeout(120000);
  const errors: string[] = [], forbidden: string[] = [], audits: unknown[] = [];
  page.on('pageerror', error => errors.push(error.message));
  context.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/') || ['19000', '19099'].includes(url.port) || /firebaseio|firebasedatabase|identitytoolkit|securetoken/.test(url.hostname)) forbidden.push(url.pathname);
  });
  for (const count of [4, 5, 6]) for (const role of ['merchant', 'sheriff']) for (const width of [360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/preview?frame=1&scene=lobby&players=${count}&role=${role}`);
    await expect(page.locator('main')).toHaveAttribute('data-phase', 'LOBBY');
    await page.evaluate(() => document.fonts.ready);
    const players = page.locator('.players .player[data-player-id]'); await expect(players).toHaveCount(count);
    const avatarIds = await players.locator('[data-avatar-id]').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('data-avatar-id'))).sort());
    expect(avatarIds).toEqual(Array.from({ length: count }, (_, index) => index));
    const viewerId = await page.locator('main').getAttribute('data-lobby-viewer');
    const own = page.locator('[data-own-seat="true"]'); await expect(own).toHaveAttribute('data-player-id', viewerId!);
    const table = (await page.locator('[data-lobby-table]').boundingBox())!;
    expect(Math.abs(table.width - table.height)).toBeLessThan(1);
    const ownAvatar = (await own.locator('[data-avatar-id]').boundingBox())!;
    expect(ownAvatar.y + ownAvatar.height / 2).toBeGreaterThan(table.y + table.height / 2);
    const boxes = await players.evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, right: box.right, bottom: box.bottom }; }));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      expect(Math.min(boxes[i].right, boxes[j].right) - Math.max(boxes[i].x, boxes[j].x) > 1 && Math.min(boxes[i].bottom, boxes[j].bottom) - Math.max(boxes[i].y, boxes[j].y) > 1, `profile overlap: ${count}/${role}/${width}`).toBe(false);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const start = page.getByRole('button', { name: 'เริ่มเกม', exact: true });
    if (role === 'sheriff') await expect(start).toBeDisabled(); else await expect(start).toHaveCount(0);
    if (count === 6 && role === 'sheriff') {
      const analysis = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      audits.push({ width, violations: analysis.violations }); expect(analysis.violations).toEqual([]);
    }
  }
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/preview?frame=1&scene=lobby&role=sheriff&players=6');
  const ready = page.getByRole('button', { name: 'พร้อม', exact: true }); await ready.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'เริ่มเกม', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true }).click(); await expect(page.getByRole('button', { name: 'เริ่มเกม', exact: true })).toBeDisabled();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; document.body.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const enlargedOwn = (await page.locator('[data-own-seat="true"]').boundingBox())!;
  for (const other of await page.locator('[data-own-seat="false"]').all()) expect((await other.boundingBox())!.y).toBeLessThan(enlargedOwn.y);
  await mkdir(output, { recursive: true }); await page.screenshot({ path: `${output}/lobby-text-200.png`, fullPage: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; document.body.style.fontSize = ''; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await ready.evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
  const targets = await page.locator('main button:visible, main summary:visible, main a:visible').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().height < 43.5).map(node => node.textContent?.trim()));
  expect(targets).toEqual([]);
  for (const state of ['offline', 'readonly', 'pending', 'busy', 'error']) {
    await page.goto(`/preview?frame=1&scene=lobby&role=sheriff&players=6&state=${state}`);
    if (state === 'error') await expect(page.getByRole('alert')).toBeVisible();
    else await expect(page.getByRole('button', { name: 'พร้อม', exact: true })).toBeDisabled();
    if (state === 'offline') await expect(page.locator('[data-online="false"]')).toContainText('−');
    if (state === 'readonly') await expect(page.getByRole('button', { name: 'ใช้แท็บนี้ควบคุม', exact: true })).toBeEnabled();
    if (state === 'pending') await expect(page.getByRole('button', { name: 'ลองคำสั่งเดิมอีกครั้ง', exact: true })).toBeEnabled();
  }
  await page.setViewportSize({ width: 320, height: 740 }); await page.goto('/preview?frame=1&scene=lobby&players=6');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await writeFile(`${output}/accessibility.json`, JSON.stringify({ audits, pageErrors: errors, apiOrFirebaseRequests: forbidden }, null, 2));
  expect(errors).toEqual([]); expect(forbidden).toEqual([]);
});

test('six real emulator players keep their avatars and own seats, toggle ready, reload and start the game', async ({ browser }) => {
  test.setTimeout(120000);
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:19000'; process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:19099';
  const admin = initializeApp({ projectId: 'demo-merchants-bluff', databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' }, 'lobby-e2e');
  const db = getDatabase(admin), auth = getAuth(admin), contexts = [], pages = [], users = new Set<string>();
  const errors: string[] = [], liveFirebase: string[] = [], report: Record<string, unknown> = {}, identityReads: Promise<void>[] = [];
  const origin = process.env.MERCHANT_E2E_ORIGIN ?? 'http://127.0.0.1:3100';
  let roomId = '', code = '';
  try {
    for (let index = 0; index < 6; index++) {
      const context = await browser.newContext({ viewport: { width: [1280, 360, 390, 430, 360, 390][index], height: 900 } }); contexts.push(context);
      const page = await context.newPage(); pages.push(page); page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        const url = new URL(response.url());
        if (['127.0.0.1', 'localhost'].includes(url.hostname) && url.port === '19099' && url.pathname.endsWith('/accounts:signUp') && response.ok()) identityReads.push(response.json().then(body => { if (body.localId) users.add(body.localId); }));
      });
      context.on('request', request => {
        const url = new URL(request.url());
        if (/identitytoolkit|securetoken|firebaseio|firebasedatabase/.test(url.hostname) && !['127.0.0.1', 'localhost'].includes(url.hostname)) liveFirebase.push(url.hostname);
        const token = request.headers().authorization;
        if (url.origin === origin && token?.startsWith('Bearer ')) users.add(JSON.parse(Buffer.from(token.slice(7).split('.')[1], 'base64url').toString()).sub);
      });
      await page.goto(index === 0 ? origin : `${origin}/?room=${code}`);
      await page.getByLabel('ชื่อที่เพื่อนจะเห็น').fill('ABCDEFGHIJKLMNO' + (index + 1));
      await page.locator('label.avatar').nth(index + 2).click();
      await expect(page.getByRole('radio', { name: `อวาตาร์ ${index + 3}`, exact: true })).toBeChecked();
      await press(page, index === 0 ? 'สร้างห้องและเข้าเล่น' : 'เข้าห้อง'); await roomPhase(page, 'LOBBY');
      if (index === 0) { roomId = new URL(page.url()).pathname.split('/').at(-1)!; code = await page.getByTestId('room-code').innerText(); }
      await expect(pages[0].locator('.players .player[data-player-id]')).toHaveCount(index + 1);
      await expect(pages[0].getByRole('button', { name: 'เริ่มเกม', exact: true })).toBeDisabled();
    }
    const lobby = JSON.parse((await db.ref(`rooms/${roomId}/authoritative/snapshot`).get()).val());
    expect(lobby.seatOrder).toHaveLength(6);
    for (let index = 0; index < 6; index++) {
      await expect(pages[index].locator('.players .player[data-player-id]')).toHaveCount(6);
      const own = pages[index].locator('[data-own-seat="true"]');
      await expect(own).toHaveAttribute('data-player-id', lobby.seatOrder[index]);
      await expect(own.locator('[data-avatar-id]')).toHaveAttribute('data-avatar-id', String(index + 2));
      expect(await pages[index].evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await press(pages[0], 'พร้อม'); await expect(pages[1].locator(`.player[data-player-id="${lobby.seatOrder[0]}"]`)).toContainText('พร้อมแล้ว');
    await press(pages[0], 'ยกเลิกพร้อม'); await expect(pages[1].locator(`.player[data-player-id="${lobby.seatOrder[0]}"]`)).toContainText('ยังไม่พร้อม');
    await pages[2].reload(); await roomPhase(pages[2], 'LOBBY'); await expect(pages[2].locator('[data-own-seat="true"]')).toHaveAttribute('data-player-id', lobby.seatOrder[2]);
    await contexts[1].setOffline(true); await expect(pages[1].getByRole('button', { name: 'พร้อม', exact: true })).toBeDisabled();
    await contexts[1].setOffline(false); await expect(pages[1].getByRole('status')).toHaveText('เชื่อมต่อแล้ว');
    for (const page of pages) await press(page, 'พร้อม');
    await expect(pages[0].getByRole('button', { name: 'เริ่มเกม', exact: true })).toBeEnabled();
    for (const page of pages) await expect(page.locator('.players .player').filter({ hasText: 'พร้อมแล้ว' })).toHaveCount(6);
    await press(pages[0], 'เริ่มเกม'); for (const page of pages) await roomPhase(page, 'PREPARE', 1);
    const started = JSON.parse((await db.ref(`rooms/${roomId}/authoritative/snapshot`).get()).val());
    expect(started.seatOrder).toEqual(lobby.seatOrder); expect(started.game.rules.totalCards).toBe(360);
    expect(started.game.rules.rulesVersion).toBe('0.2');
    expect(errors).toEqual([]); expect(liveFirebase).toEqual([]);
    Object.assign(report, { passed: true, players: 6, namesLength: 16, selectedAvatarIds: [2, 3, 4, 5, 6, 7], readinessRealtime: true, reload: true, offlineBlocksCommands: true, startedPhase: 'PREPARE', seatOrderPreserved: true, totalCards: 360, rulesVersion: '0.2', pageErrors: errors, liveFirebaseRequests: liveFirebase });
  } finally {
    await Promise.all(identityReads);
    await Promise.all(contexts.map(context => context.close()));
    if (roomId) await db.ref().update({ [`rooms/${roomId}`]: null, [`presence/${roomId}`]: null, [`roomCodes/${code}`]: null });
    for (const uid of users) { await auth.deleteUser(uid); await db.ref(`requestLimits/${uid}`).remove(); }
    report.cleanup = { rooms: roomId ? 1 : 0, users: users.size };
    await deleteApp(admin); await mkdir(output, { recursive: true }); await writeFile(`${output}/live-flow.json`, JSON.stringify(report, null, 2));
  }
});
