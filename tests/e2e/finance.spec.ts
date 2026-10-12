import { test, expect } from '@playwright/test';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { randomUUID } from 'node:crypto';
import { pay } from '../../src/lib/game/ledger';
import { assertGameState } from '../../src/lib/game/engine';
import { arrangeHand } from '../fixtures/game';
import type { RoomCore, StoredRoom } from '../../src/lib/server/room-model';
import type { PublicRoomView, PrivateRoomView } from '../../src/lib/shared/rooms';
import { joinPlayers, press, publicMoney, roomPhase } from './helpers/game-ui';
import { writeFile } from 'node:fs/promises';

test('cash-empty sheriff creates debts and later PASS receipts settle oldest debt first on every UI', async ({ browser }) => {
  test.setTimeout(60000);
  if (process.env.FIREBASE_DATABASE_EMULATOR_HOST !== '127.0.0.1:19000') throw new Error('This financial precondition is emulator-only');
  const app = initializeApp({ projectId: 'demo-merchants-bluff', databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' }, `financial-ui-${randomUUID()}`);
  const { contexts, pages } = await joinPlayers(browser, 4);
  try {
    for (const page of pages) { await press(page, 'พร้อม'); await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled(); }
    await press(pages[0], 'เริ่มเกม'); for (const page of pages) await roomPhase(page, 'PREPARE', 1);
    const roomId = new URL(pages[0].url()).pathname.split('/').at(-1)!; const roomRef = getDatabase(app).ref(`rooms/${roomId}`);
    const stored = (await roomRef.get()).val() as StoredRoom; const room = JSON.parse(stored.authoritative.snapshot) as RoomCore;
    const sheriff = room.seatOrder.indexOf(room.game!.sheriffId); const merchants = [0, 1, 2, 3].filter(index => index !== sheriff);
    const [first, second, third] = merchants; const official = pages[sheriff];
    // Test-only precondition representing earlier compulsory payments. No debug endpoint or app seed import.
    room.game = arrangeHand(room.game!, room.seatOrder[first], ['apple']);
    room.game = arrangeHand(room.game, room.seatOrder[second], ['bread']);
    room.game = { ...room.game, finances: pay(room.game.finances, room.game.sheriffId, room.seatOrder[third], 50, 'COMPENSATION').state };
    assertGameState(room.game); room.revision++;
    const visible = JSON.parse(stored.views.public) as PublicRoomView;
    stored.authoritative.snapshot = JSON.stringify(room);
    stored.views.public = JSON.stringify({ ...visible, revision: room.revision, debts: room.game.finances.debts,
      players: visible.players.map(player => ({ ...player, cash: room.game!.finances.cash[player.id] })) });
    for (const id of room.seatOrder) {
      const own = JSON.parse(stored.views.private[id]) as PrivateRoomView;
      stored.views.private[id] = JSON.stringify({ ...own, revision: room.revision, hand: room.game.players[id].hand });
    }
    await roomRef.set(stored);
    await expect.poll(async () => (await publicMoney(official)).find(player => player.id === room.game!.sheriffId)?.cash).toBe(0);
    for (const index of merchants) { await press(pages[index], 'พร้อมจัดกระเป๋า'); await expect(pages[index].getByRole('button', { name: 'พร้อมจัดกระเป๋า', exact: true })).toHaveCount(0); }
    for (const page of pages) await roomPhase(page, 'PACK_AND_DECLARE', 1);
    for (const index of merchants) { const card = pages[index].locator('button.card').first(); await card.click(); await expect(card).toHaveAttribute('aria-pressed', 'true'); await press(pages[index], 'ปิดกระเป๋าและยืนยัน'); await expect(pages[index].getByRole('button', { name: 'ปิดกระเป๋าและยืนยัน', exact: true })).toHaveCount(0); }
    for (const page of pages) await roomPhase(page, 'NEGOTIATE', 1);
    for (const index of merchants) { await press(pages[index], 'ไม่เสนอเงิน'); await expect(pages[index].getByText('ยืนยันล่าสุด: ไม่เสนอเงิน', { exact: true })).toBeVisible(); }
    for (const index of [first, second]) {
      await press(official, `เลือก ทดสอบ${index + 1}`); await press(official, 'ตรวจ'); await press(official, 'ยืนยันตรวจ');
      for (const page of pages) await roomPhase(page, 'RESOLUTION', 1);
      await expect(official.locator('.result')).toContainText('ค่าชดเชย 2 เหรียญ');
      await press(official, 'เลือกพ่อค้าคนต่อไป'); for (const page of pages) await roomPhase(page, 'NEGOTIATE', 1);
    }
    const debtSummary = official.locator('summary').filter({ hasText: /^หนี้คงค้าง$/ }).locator('..');
    await expect(debtSummary.locator('li')).toHaveCount(2);
    await pages[third].getByLabel('ยอดเสนอเงิน').fill('3'); await press(pages[third], 'เสนอเงิน');
    await expect(pages[third].getByText('ยืนยันล่าสุด: 3 เหรียญ', { exact: true })).toBeVisible();
    await press(official, `เลือก ทดสอบ${third + 1}`); await press(official, 'ให้ผ่าน'); await press(official, 'ยืนยันให้ผ่าน');
    const expected = room.seatOrder.map((id, index) => ({ id, cash: index === sheriff ? 0 : index === first ? 52 : index === second ? 51 : 97 }));
    for (const page of pages) {
      await roomPhase(page, 'RESOLUTION', 1); expect(await publicMoney(page)).toEqual(expected);
      const debts = page.locator('summary').filter({ hasText: /^หนี้คงค้าง$/ }).locator('..');
      await debts.locator('summary').click(); await expect(debts.locator('li')).toHaveCount(1);
      await expect(debts.locator('li')).toHaveText(`ทดสอบ${sheriff + 1} → ทดสอบ${second + 1}: 1 เหรียญ`);
    }
    await official.screenshot({ path: 'work/verification/m5/fifo-debt-ui.png', fullPage: true });
    await writeFile('work/verification/m5/finance-ui.json', JSON.stringify({ emulatorFixture: 'cash-zero legal inspector', compensatedDebts: [2, 2], incomingBribe: 3, remainingSecondDebt: 1, cashTotal: expected.reduce((sum, player) => sum + player.cash, 0), allViewsMatch: true }, null, 2));
  } finally { await Promise.all(contexts.map(context => context.close())); await deleteApp(app); }
});
