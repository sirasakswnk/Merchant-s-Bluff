import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { PRODUCTS } from '../../src/lib/game/config';
import type { ProductId } from '../../src/lib/game/types';
import { auditScreen } from './helpers/accessibility';
import { press } from './helpers/game-ui';

interface VisibleCard { id: string; product: ProductId }
async function phase(page: Page, expected: string, round?: number) {
  await expect(page.locator('main')).toHaveAttribute('data-phase', expected, { timeout: 15000 });
  if (round) await expect(page.locator('main')).toHaveAttribute('data-round', String(round));
  await expect(page.getByRole('status')).toHaveText('เชื่อมต่อแล้ว');
}
async function click(page: Page, name: string) { await press(page, name); }
async function visibleCards(page: Page): Promise<VisibleCard[]> {
  return page.locator('button.card').evaluateAll(nodes => nodes.map(node => ({ id: node.getAttribute('data-card-id')!, product: node.getAttribute('data-product')! as ProductId })));
}

test('four mobile browser contexts play eight rounds through the real UI and retain privacy on reconnect', async ({ browser }) => {
  test.setTimeout(180000);
  const contexts: BrowserContext[] = []; const pages: Page[] = []; const errors: string[] = [];
  const received: string[][] = Array.from({ length: 4 }, () => []);
  try {
    for (const [index, viewport] of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 740, height: 360 }].entries()) {
      const context = await browser.newContext({ viewport }); contexts.push(context); const page = await context.newPage(); pages.push(page);
      page.on('pageerror', error => errors.push(error.message));
      page.on('websocket', socket => socket.on('framereceived', frame => received[index].push(String(frame.payload))));
    }
    await pages[0].goto('/'); await pages[0].getByLabel('ชื่อที่เพื่อนจะเห็น').fill('ผู้เล่น1'); await click(pages[0], 'สร้างห้องและเข้าเล่น');
    await phase(pages[0], 'LOBBY'); const code = await pages[0].getByTestId('room-code').innerText();
    for (let index = 1; index < 4; index++) {
      await pages[index].goto(`/?room=${code}`); await pages[index].getByLabel('ชื่อที่เพื่อนจะเห็น').fill(`ผู้เล่น${index + 1}`); await click(pages[index], 'เข้าห้อง'); await phase(pages[index], 'LOBBY');
    }
    for (const page of pages) { await click(page, 'พร้อม'); await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled(); }
    await pages[0].screenshot({ path: 'work/verification/m3/lobby-360.png', fullPage: true });
    await auditScreen(pages[0], 'lobby', true); await click(pages[0], 'เริ่มเกม');
    const seen = { mixed: false, confiscation: false, bribe: false, noOffer: false, glow: false };
    let reloaded = false; let glowRefreshChecked = false;
    for (let round = 1; round <= 8; round++) {
      for (const page of pages) await phase(page, 'PREPARE', round);
      const sheriff = (await Promise.all(pages.map(page => page.locator('main').getAttribute('data-own-role')))).indexOf('sheriff');
      expect(sheriff).toBeGreaterThanOrEqual(0); const merchants = [0, 1, 2, 3].filter(index => index !== sheriff);
      for (const index of merchants) {
        if (round % 3 === 0) {
          const card = pages[index].locator('button.card').first(); await card.click(); await expect(card).toHaveAttribute('aria-pressed', 'true');
        }
        await click(pages[index], 'พร้อมจัดกระเป๋า');
        await expect(pages[index].getByRole('button', { name: 'พร้อมจัดกระเป๋า', exact: true })).toHaveCount(0);
      }
      for (const page of pages) await phase(page, 'PACK_AND_DECLARE', round);
      if (round === 1) await auditScreen(pages[merchants[0]], 'pack', true);
      const plans: { index: number; cards: VisibleCard[]; action: 'PASS' | 'INSPECT'; offer: number; feature: string }[] = [];
      for (const index of merchants) {
        const page = pages[index]; const cards = await visibleCards(page);
        const legal = cards.filter(card => PRODUCTS[card.product].category === 'legal'); const contra = cards.filter(card => PRODUCTS[card.product].category === 'contraband');
        const otherLegal = legal.find(card => card.product !== legal[0]?.product);
        const needs = (feature: keyof typeof seen) => !seen[feature] && !plans.some(plan => plan.feature === feature);
        const cashText = await page.locator('.players .player').filter({ has: page.getByRole('heading', { name: `ผู้เล่น${index + 1} (คุณ)`, exact: true }) }).innerText();
        const cash = Number(cashText.match(/เงิน (\d+) เหรียญ/)?.[1] ?? 0);
        let chosen = [legal[0] ?? cards[0]]; let action: 'PASS' | 'INSPECT' = 'PASS'; let offer = 0; let feature = '';
        if (needs('mixed') && otherLegal) { chosen = [legal[0], otherLegal]; action = 'INSPECT'; feature = 'mixed'; }
        else if (needs('confiscation') && contra.length) { chosen = [contra[0], ...(legal[0] ? [legal[0]] : [])]; action = 'INSPECT'; offer = Math.min(3, cash); feature = 'confiscation'; }
        else if (needs('glow') && contra.length) { chosen = [contra[0]]; feature = 'glow'; offer = Math.min(3, cash); }
        else if (needs('bribe') && cash > 0) { feature = 'bribe'; offer = Math.min(3, cash); }
        else if (needs('noOffer')) { feature = 'noOffer'; }
        else if ((round + index) % 2 === 0) action = 'INSPECT';
        plans.push({ index, cards: chosen, action, offer, feature });
        for (const card of chosen) {
          const button = page.locator(`button[data-card-id="${card.id}"]`); await button.click(); await expect(button).toHaveAttribute('aria-pressed', 'true');
        }
        if (!reloaded && chosen.length === 2) {
          const before = await page.locator('.players .player').filter({ has: page.getByRole('heading', { name: `ผู้เล่น${index + 1} (คุณ)`, exact: true }) }).getAttribute('data-player-id');
          await page.reload(); await phase(page, 'PACK_AND_DECLARE', round);
          expect(await page.locator('button.card[aria-pressed="true"]').count()).toBe(2);
          expect(await page.locator('.players .player').filter({ has: page.getByRole('heading', { name: `ผู้เล่น${index + 1} (คุณ)`, exact: true }) }).getAttribute('data-player-id')).toBe(before);
          reloaded = true;
        }
        if (round === 1 && index === merchants[0]) await page.screenshot({ path: 'work/verification/m3/pack.png', fullPage: true });
        await click(page, 'ปิดกระเป๋าและยืนยัน');
        await expect(page.getByRole('button', { name: 'ปิดกระเป๋าและยืนยัน', exact: true })).toHaveCount(0);
      }
      for (const page of pages) await phase(page, 'NEGOTIATE', round);
      if (round === 1) {
        for (const plan of plans) for (let index = 0; index < 4; index++) if (index !== plan.index) {
          for (const card of plan.cards) {
            expect(await pages[index].content()).not.toContain(card.id);
            expect(received[index].join('\n')).not.toContain(card.id);
          }
        }
        await pages[sheriff].waitForTimeout(1000); await phase(pages[sheriff], 'NEGOTIATE', round);
      }
      for (const plan of plans) {
        const page = pages[plan.index];
        if (plan.offer > 0) { await page.getByLabel('ยอดเสนอเงิน').fill(String(plan.offer)); await click(page, 'เสนอเงิน'); }
        else await click(page, 'ไม่เสนอเงิน');
        await expect(page.getByText(`ยืนยันล่าสุด: ${plan.offer > 0 ? `${plan.offer} เหรียญ` : 'ไม่เสนอเงิน'}`, { exact: true })).toBeVisible();
      }
      await pages[sheriff].screenshot({ path: `work/verification/m3/sheriff-round-${round}.png`, fullPage: true });
      if (round === 1) await auditScreen(pages[sheriff], 'sheriff', true);
      for (const plan of plans.reverse()) {
        const page = pages[sheriff]; await click(page, `เลือก ผู้เล่น${plan.index + 1}`);
        await click(page, plan.action === 'PASS' ? 'ให้ผ่าน' : 'ตรวจ'); await click(page, plan.action === 'PASS' ? 'ยืนยันให้ผ่าน' : 'ยืนยันตรวจ');
        for (const player of pages) await phase(player, 'RESOLUTION', round);
        const result = page.locator('.result');
        if (plan.feature === 'mixed') {
          seen.mixed = true; const compensation = plan.cards.reduce((sum, card) => sum + PRODUCTS[card.product].compensation, 0);
          await expect(result).toContainText(`ค่าชดเชย ${compensation} เหรียญ`);
          await page.screenshot({ path: 'work/verification/m3/inspected-result.png', fullPage: true });
          await auditScreen(page, 'inspect-result', true);
        }
        if (plan.feature === 'confiscation') {
          seen.confiscation = true; const fine = plan.cards.reduce((sum, card) => sum + PRODUCTS[card.product].fine, 0);
          await expect(result).toContainText(`ค่าปรับ ${fine} เหรียญ`);
        }
        if (plan.action === 'PASS') {
          if (plan.offer > 0) seen.bribe = true; else seen.noOffer = true;
          if (plan.cards.some(card => PRODUCTS[card.product].category === 'contraband')) {
            seen.glow = true; await expect(result).toContainText('มีของต้องห้ามผ่านด่าน!');
            await expect(result.locator('.result-bag')).toHaveClass(/glow/);
            await page.waitForTimeout(150); await page.screenshot({ path: 'work/verification/m3/red-glow.png', fullPage: true });
            if (!glowRefreshChecked) {
              const secondTab = await contexts[sheriff].newPage(); await secondTab.goto(page.url());
              await expect(secondTab.getByRole('status')).toContainText('แท็บนี้อ่านอย่างเดียว');
              await expect(secondTab.locator('.result-bag')).not.toHaveClass(/glow/);
              await click(secondTab, 'ใช้แท็บนี้ควบคุม'); await expect(page.getByRole('status')).toContainText('แท็บนี้อ่านอย่างเดียว');
              await expect(result.locator('.result-bag')).toHaveClass(/glow/);
              await click(page, 'ใช้แท็บนี้ควบคุม'); await phase(page, 'RESOLUTION', round);
              await expect(result.locator('.result-bag')).toHaveClass(/glow/);
              await secondTab.close(); glowRefreshChecked = true;
            }
            await page.emulateMedia({ reducedMotion: 'reduce' });
            expect(await result.locator('.result-bag').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
            await auditScreen(page, 'glow-result', true); await page.emulateMedia({ reducedMotion: 'no-preference' });
          }
        }
        const advance = page.getByRole('button', { name: 'เลือกพ่อค้าคนต่อไป', exact: true });
        if (await advance.count()) await click(page, 'เลือกพ่อค้าคนต่อไป'); else await click(page, 'สรุปรอบ');
      }
      for (const page of pages) {
        await phase(page, 'ROUND_SUMMARY', round);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      await click(pages[sheriff], round === 8 ? 'ยืนยันจบรอบสุดท้ายและดูคะแนน' : 'จบรอบ / ส่งต่อตำแหน่งนายด่าน');
    }
    for (const page of pages) { await phase(page, 'GAME_OVER', 8); await expect(page.getByRole('heading', { name: 'คะแนนสุดท้าย', exact: true })).toBeVisible(); }
    expect(seen).toEqual({ mixed: true, confiscation: true, bribe: true, noOffer: true, glow: true });
    expect(reloaded).toBe(true); expect(glowRefreshChecked).toBe(true); expect(errors).toEqual([]);
    await pages[0].screenshot({ path: 'work/verification/m3/final-score.png', fullPage: true });
    await auditScreen(pages[0], 'final-score', true);
  } finally { await Promise.all(contexts.map(context => context.close())); }
});
