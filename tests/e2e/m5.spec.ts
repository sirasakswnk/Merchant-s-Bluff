import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { joinPlayers, prepareAndPack, press, publicMoney, roomPhase } from './helpers/game-ui';

for (const count of [5, 6]) test(`${count} browser players finish ${count * 2} rounds; retry, offline and tab controls preserve the game`, async ({ browser }) => {
  test.setTimeout(180000);
  const { contexts, pages } = await joinPlayers(browser, count);
  const errors: string[] = []; pages.forEach(page => page.on('pageerror', error => errors.push(error.message)));
  try {
    const owner = pages[0]; const commandIds: string[] = []; let dropped = false;
    await owner.route('**/api/rooms/command', async route => {
      const body = route.request().postDataJSON();
      if (body.command.type === 'setReady') {
        commandIds.push(body.commandId);
        if (!dropped) { dropped = true; await route.fetch(); await route.abort('failed'); return; }
      }
      await route.continue();
    });
    await press(owner, 'พร้อม');
    await expect(owner.getByRole('heading', { name: 'ยังยืนยันผลคำสั่งไม่ได้', exact: true })).toBeVisible();
    await expect(owner.getByRole('button', { name: 'เริ่มเกม', exact: true })).toBeDisabled();
    await owner.getByRole('link', { name: 'หน้าแรก', exact: true }).click();
    await expect(owner.getByRole('button', { name: 'สร้างห้อง', exact: true })).toBeDisabled();
    await press(owner, 'ลองคำสั่งเดิมอีกครั้ง'); // Returns to that command's room; does not overwrite it.
    await expect(owner.getByRole('heading', { name: 'ยังยืนยันผลคำสั่งไม่ได้', exact: true })).toBeVisible();
    await press(owner, 'ลองคำสั่งเดิมอีกครั้ง');
    await expect(owner.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled();
    expect(commandIds).toHaveLength(2); expect(commandIds[1]).toBe(commandIds[0]);
    await owner.unroute('**/api/rooms/command');
    for (const page of pages.slice(1)) { await press(page, 'พร้อม'); await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled(); }

    const secondTab = await contexts[0].newPage(); await secondTab.goto(owner.url());
    await expect(secondTab.getByRole('status')).toContainText('แท็บนี้อ่านอย่างเดียว');
    await press(secondTab, 'ใช้แท็บนี้ควบคุม'); await expect(secondTab.getByRole('status')).toHaveText('เชื่อมต่อแล้ว');
    await expect(owner.getByRole('status')).toContainText('แท็บนี้อ่านอย่างเดียว'); await press(owner, 'ใช้แท็บนี้ควบคุม');
    await expect(owner.getByRole('status')).toHaveText('เชื่อมต่อแล้ว'); await secondTab.close();
    await press(owner, 'เริ่มเกม');
    const sheriffs = Array.from({ length: count }, () => 0);
    for (let round = 1; round <= count * 2; round++) {
      const { sheriff, merchants } = await prepareAndPack(pages, round); sheriffs[sheriff]++;
      for (const index of [...merchants].reverse()) {
        const official = pages[sheriff]; const merchant = pages[index];
        await press(official, `เลือก ทดสอบ${index + 1}`);
        await expect(official.getByRole('heading', { name: `กำลังคุย: ทดสอบ${index + 1}`, exact: true })).toBeVisible();
        if (round === 1 && index === merchants.at(-1)) {
          const before = await publicMoney(official);
          await contexts[index].setOffline(true);
          await expect(merchant.getByRole('status')).toContainText('กำลังเชื่อมต่อใหม่');
          await expect(merchant.getByRole('button', { name: 'เสนอเงิน', exact: true })).toBeDisabled();
          await merchant.getByLabel('ยอดเสนอเงิน').fill('7'); // Draft only; never queued as a gameplay request.
          await official.waitForTimeout(500); await expect(official.locator('main')).toHaveAttribute('data-phase', 'NEGOTIATE');
          await contexts[index].setOffline(false); await roomPhase(merchant, 'NEGOTIATE', round);
          await merchant.reload(); await roomPhase(merchant, 'NEGOTIATE', round);
          await expect(merchant.getByLabel('ยอดเสนอเงิน')).toHaveValue('7');
          await expect(merchant.getByText('ยืนยันล่าสุด: ไม่เสนอเงิน', { exact: true })).toBeVisible();
          await expect(official.getByRole('heading', { name: `กำลังคุย: ทดสอบ${index + 1}`, exact: true })).toBeVisible();
          expect(await publicMoney(official)).toEqual(before);
          await press(official, 'ให้ผ่าน');
          await merchant.getByLabel('ยอดเสนอเงิน').fill('2'); await press(merchant, 'เสนอเงิน');
          await expect(official.locator('main').getByRole('alert')).toContainText('ข้อเสนอหรือพ่อค้าที่เลือกเปลี่ยนแล้ว');
          await expect(official.getByRole('button', { name: 'ยืนยันให้ผ่าน', exact: true })).toBeDisabled();
          await press(official, 'ยกเลิก');
        }
        const action = (round + index) % 2 === 0 ? 'ตรวจ' : 'ให้ผ่าน';
        await press(official, action); await press(official, `ยืนยัน${action}`);
        for (const page of pages) await roomPhase(page, 'RESOLUTION', round);
        const cash = await publicMoney(official);
        for (const page of pages) {
          expect(await publicMoney(page)).toEqual(cash);
        }
        if (await official.getByRole('button', { name: 'เลือกพ่อค้าคนต่อไป', exact: true }).count()) await press(official, 'เลือกพ่อค้าคนต่อไป'); else await press(official, 'สรุปรอบ');
      }
      for (const page of pages) await roomPhase(page, 'ROUND_SUMMARY', round);
      await press(pages[sheriff], round === count * 2 ? 'ยืนยันจบรอบสุดท้ายและดูคะแนน' : 'จบรอบ / ส่งต่อตำแหน่งนายด่าน');
    }
    for (const page of pages) await roomPhase(page, 'GAME_OVER', count * 2);
    expect(sheriffs).toEqual(Array.from({ length: count }, () => 2));
    const scoreboard = await pages[0].locator('.scores').innerText();
    for (const page of pages) { expect(await page.locator('.scores').innerText()).toBe(scoreboard); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
    expect(errors).toEqual([]); await mkdir('work/verification/m5', { recursive: true });
    await pages[0].screenshot({ path: `work/verification/m5/final-${count}-players.png`, fullPage: true });
    await writeFile(`work/verification/m5/game-${count}.json`, JSON.stringify({ count, rounds: count * 2, sheriffTurns: sheriffs, retrySameCommand: commandIds[0] === commandIds[1], pageErrors: errors, scoreboard }, null, 2));
    await press(pages[0], 'กลับล็อบบี้เพื่อเล่นใหม่');
    for (const page of pages) { await roomPhase(page, 'LOBBY'); await expect(page.getByRole('button', { name: 'พร้อม', exact: true })).toBeEnabled(); await expect(page.getByRole('heading', { name: 'คะแนนสุดท้าย', exact: true })).toHaveCount(0); }
  } finally { await Promise.all(contexts.map(context => context.close())); }
});
