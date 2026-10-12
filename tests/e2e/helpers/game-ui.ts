import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

export async function roomPhase(page: Page, value: string, round?: number) {
  // A fresh Next dev server can still compile/resume the first room after navigation.
  await expect(page.locator('main')).toHaveAttribute('data-phase', value, { timeout: 15000 });
  if (round) await expect(page.locator('main')).toHaveAttribute('data-round', String(round));
  await expect(page.getByRole('status')).toHaveText('เชื่อมต่อแล้ว');
}
export async function press(page: Page, name: string) {
  const button = page.getByRole('button', { name, exact: true }); await expect(button).toBeEnabled(); await button.focus(); await button.press('Enter');
}
export async function publicMoney(page: Page) {
  return page.locator('.players .player').evaluateAll(nodes => nodes.map(node => ({
    id: node.getAttribute('data-player-id'), cash: Number(node.textContent?.match(/เงิน (\d+) เหรียญ/)?.[1]),
  })));
}
export async function joinPlayers(browser: Browser, count: number, origin = 'http://127.0.0.1:3100') {
  const contexts: BrowserContext[] = []; const pages: Page[] = [];
  try {
    for (let index = 0; index < count; index++) {
      const context = await browser.newContext({ viewport: { width: [360, 390, 430, 1280][index % 4], height: 900 } });
      contexts.push(context); pages.push(await context.newPage());
    }
    await pages[0].goto(origin); await pages[0].getByLabel('ชื่อที่เพื่อนจะเห็น').fill('ทดสอบ1'); await press(pages[0], 'สร้างห้องและเข้าเล่น'); await roomPhase(pages[0], 'LOBBY');
    const code = await pages[0].getByTestId('room-code').innerText();
    for (let index = 1; index < count; index++) {
      await pages[index].goto(`${origin}/?room=${code}`); await pages[index].getByLabel('ชื่อที่เพื่อนจะเห็น').fill(`ทดสอบ${index + 1}`);
      await press(pages[index], 'เข้าห้อง'); await roomPhase(pages[index], 'LOBBY');
    }
    return { contexts, pages };
  } catch (error) { await Promise.all(contexts.map(context => context.close())); throw error; }
}
export async function prepareAndPack(pages: Page[], round: number, count = 1, exchange = 0) {
  for (const page of pages) await roomPhase(page, 'PREPARE', round);
  const sheriff = (await Promise.all(pages.map(page => page.locator('main').getAttribute('data-own-role')))).indexOf('sheriff');
  const merchants = pages.map((_, index) => index).filter(index => index !== sheriff);
  for (const index of merchants) {
    await expect(pages[index].getByRole('status')).toHaveText('เชื่อมต่อแล้ว');
    for (let position = 0; position < exchange; position++) {
      const card = pages[index].locator('button.card').nth(position); await card.click(); await expect(card).toHaveAttribute('aria-pressed', 'true');
    }
    await press(pages[index], 'พร้อมจัดกระเป๋า');
    // Observe the committed own state before the next player's action.
    await expect(pages[index].getByRole('button', { name: 'พร้อมจัดกระเป๋า', exact: true })).toHaveCount(0);
  }
  for (const page of pages) await roomPhase(page, 'PACK_AND_DECLARE', round);
  for (const index of merchants) {
    for (let position = 0; position < count; position++) {
      const card = pages[index].locator('button.card').nth(position); await card.click(); await expect(card).toHaveAttribute('aria-pressed', 'true');
    }
    await press(pages[index], 'ปิดกระเป๋าและยืนยัน');
    await expect(pages[index].getByRole('button', { name: 'ปิดกระเป๋าและยืนยัน', exact: true })).toHaveCount(0);
  }
  for (const page of pages) await roomPhase(page, 'NEGOTIATE', round);
  for (const index of merchants) {
    await press(pages[index], 'ไม่เสนอเงิน');
    await expect(pages[index].getByText('ยืนยันล่าสุด: ไม่เสนอเงิน', { exact: true })).toBeVisible();
  }
  return { sheriff, merchants };
}
