import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'work/verification/sheriff-popup';

test('mobile sheriff chooses a profile before seeing its offer and can decide without scrolling', async ({ page, context }) => {
  test.setTimeout(120000);
  const errors: string[] = [], forbidden: string[] = [], audits: unknown[] = [];
  page.on('pageerror', error => errors.push(error.message));
  context.on('request', request => { const url = new URL(request.url()); if (url.pathname.startsWith('/api/') || ['19000', '19099'].includes(url.port) || /firebaseio|firebasedatabase|identitytoolkit|securetoken/.test(url.hostname)) forbidden.push(url.pathname); });
  for (const players of [4, 5, 6]) for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/preview?frame=1&scene=negotiate&role=sheriff&players=${players}`);
    const popup = page.locator('[data-sheriff-popup]');
    await expect(popup).toHaveAttribute('open', ''); await expect(popup).toHaveAttribute('data-step', 'choose');
    const choices = popup.locator('[data-merchant-choice]'); await expect(choices).toHaveCount(players - 1);
    await expect(popup.locator('[data-avatar-id]')).toHaveCount(players - 1);
    await expect(popup.locator('[data-offer-display], [data-offer-pass], [data-sheriff-detail]')).toHaveCount(0);
    expect(await choices.allTextContents()).not.toEqual(expect.arrayContaining([expect.stringMatching(/เหรียญ|เสนอ|แจ้งสินค้า/)]));
    expect(await page.evaluate(() => scrollY)).toBe(0);
    const id = (await choices.first().getAttribute('data-merchant-choice'))!;
    const offer = await page.locator(`[data-player-id="${id}"] [data-offer-display="seat"]`).getAttribute('data-offer-amount');
    const avatar = await choices.first().locator('[data-avatar-id]').getAttribute('data-avatar-id');
    await choices.first().click(); await expect(popup).toHaveAttribute('data-step', 'detail');
    await expect(popup.locator('[data-sheriff-detail] [data-avatar-id]')).toHaveAttribute('data-avatar-id', avatar!);
    await expect(popup.locator('[data-offer-display="detail"]')).toHaveAttribute('data-offer-amount', offer!);
    await expect(popup.locator('[data-offer-pass]')).toBeEnabled();
    await popup.getByRole('button', { name: 'ตรวจ', exact: true }).click(); await expect(popup.locator('.confirmation')).toBeVisible();
    await popup.getByRole('button', { name: /กลับไปเลือกพ่อค้า/ }).click(); await expect(popup).toHaveAttribute('data-step', 'choose');
    await choices.last().click(); await expect(popup.locator('.confirmation')).toHaveCount(0);
    await popup.getByRole('button', { name: /กลับไปเลือกพ่อค้า/ }).click(); await choices.first().click();
    if (players === 6) {
      const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations;
      audits.push({ width, step: 'detail', violations }); expect(violations).toEqual([]);
    }
    await popup.locator('[data-offer-pass]').click(); await popup.getByRole('button', { name: 'ยืนยันให้ผ่าน', exact: true }).click();
    await expect(page.locator('main')).toHaveAttribute('data-phase', 'RESOLUTION'); await expect(popup).toHaveAttribute('open', '');
    await expect(popup).toContainText('ให้ผ่าน กระเป๋า'); expect(await popup.innerText()).not.toMatch(/เหล้าเถื่อน|หน้าไม้|ใบกัญชา/);
    await popup.getByRole('button', { name: 'เลือกพ่อค้าคนต่อไป', exact: true }).click();
    await expect(page.locator('main')).toHaveAttribute('data-phase', 'ROUND_SUMMARY'); await expect(popup).toHaveAttribute('open', '');
    await popup.getByRole('button', { name: 'จบรอบ / ส่งต่อตำแหน่งนายด่าน', exact: true }).click();
    await expect(page.locator('main')).toHaveAttribute('data-phase', 'PREPARE'); await expect(popup).toHaveCount(0);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/flow.json`, JSON.stringify({ cases: 9, audits, errors, previewApiOrFirebaseRequests: forbidden }, null, 2));
  expect(errors).toEqual([]); expect(forbidden).toEqual([]);
});

test('sheriff popup closes, restores focus, handles disabled/retry states and reflows on rotation', async ({ page, browser }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/preview?frame=1&scene=negotiate&role=sheriff&players=6');
  const popup = page.locator('[data-sheriff-popup]'), opener = page.locator('[data-sheriff-open]');
  await expect(popup).toHaveAttribute('open', '');
  const close = popup.getByRole('button', { name: 'ปิดหน้าตัดสินพ่อค้า', exact: true }), last = popup.locator('button').last();
  await close.focus(); await page.keyboard.press('Shift+Tab'); await expect(last).toBeFocused();
  await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  await page.keyboard.press('Escape'); await expect(popup).not.toHaveAttribute('open'); await expect(opener).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
  await opener.click(); await expect(popup).toHaveAttribute('data-step', 'choose');
  await popup.locator('[data-merchant-choice]').first().click(); await popup.getByRole('button', { name: 'ตรวจ', exact: true }).click();
  await close.click(); await opener.click(); await expect(popup).toHaveAttribute('data-step', 'choose'); await expect(popup.locator('.confirmation')).toHaveCount(0);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; document.body.style.fontSize = '32px'; });
  expect(await popup.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await popup.locator('[data-merchant-choice]').last().click(); await expect(popup.locator('[data-offer-pass]')).toBeEnabled();
  await close.click(); await page.setViewportSize({ width: 1280, height: 900 }); await expect(popup).toHaveCount(0);
  await expect(page.locator('[data-merchant-choice]')).toHaveCount(5);
  await page.setViewportSize({ width: 390, height: 844 }); await expect(popup).toHaveAttribute('open', '');
  for (const state of ['readonly', 'busy', 'pending', 'offline', 'error']) {
    await page.goto(`/preview?frame=1&scene=negotiate&role=sheriff&players=6&state=${state}`); await expect(popup).toHaveAttribute('open', '');
    if (state === 'error') await expect(popup.getByRole('alert')).toContainText('ส่งคำสั่งไม่ได้');
    else for (const choice of await popup.locator('[data-merchant-choice]').all()) await expect(choice).toBeDisabled();
    await expect(close).toBeEnabled();
    if (state === 'pending') { await popup.getByRole('button', { name: 'ลองคำสั่งเดิมอีกครั้ง', exact: true }).click(); await expect(popup.locator('[data-merchant-choice]').first()).toBeEnabled(); }
    if (state === 'readonly') { await popup.getByRole('button', { name: 'ใช้แท็บนี้ควบคุม', exact: true }).click(); await expect(popup.locator('[data-merchant-choice]').first()).toBeEnabled(); }
    await close.click(); await expect(opener).toBeFocused(); await opener.click(); await expect(popup).toHaveAttribute('open', '');
  }
  const touchContext = await browser.newContext({ viewport: { width: 740, height: 360 }, hasTouch: true });
  try {
    const landscape = await touchContext.newPage(); await landscape.goto('/preview?frame=1&scene=negotiate&role=sheriff&players=6');
    await expect(landscape.locator('[data-sheriff-popup]')).toHaveAttribute('open', '');
    const bounds = (await landscape.locator('[data-sheriff-popup]').boundingBox())!; expect(bounds.y).toBeGreaterThanOrEqual(0); expect(bounds.height).toBeLessThanOrEqual(336);
  } finally { await touchContext.close(); }
  await mkdir(output, { recursive: true }); await writeFile(`${output}/accessibility.json`, JSON.stringify({ keyboard: true, focusRestored: true, closeClearsConfirmation: true, text200: true, resize: true, disabledStates: 4, errorVisible: true, pendingRetry: true, claimControl: true, touchLandscape: true }, null, 2));
});
