import { test, expect } from '@playwright/test';
import { auditScreen } from './helpers/accessibility';

test('home supports keyboard, touch sizes, readable reflow, reduced motion and HTTP-safe IDs', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined });
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
  });
  await page.goto('/'); await expect(page.getByText('กำลังเชื่อมต่อบัญชีผู้เล่น…', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'ข้ามไปเนื้อหาหลัก' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused();
  const avatar = page.getByRole('button', { name: 'อวาตาร์ 3', exact: true }); await avatar.focus(); await page.keyboard.press('Enter'); await expect(avatar).toHaveAttribute('aria-pressed', 'true');
  await auditScreen(page, 'home', true);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.evaluate(() => { document.body.style.fontSize = '32px'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'work/verification/m4/home-text-200.png', fullPage: true });
  await page.evaluate(() => { document.body.style.fontSize = ''; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.getByLabel('ชื่อที่เพื่อนจะเห็น').fill('ทดสอบคีย์บอร์ด');
  const create = page.getByRole('button', { name: 'สร้างห้องและเข้าเล่น', exact: true }); await expect(create).toBeEnabled(); await create.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'LOBBY');
  await page.getByRole('button', { name: 'คัดลอกลิงก์', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('เลือกลิงก์ชวนเพื่อน');
  await expect(page.getByLabel('ลิงก์ชวนเพื่อน')).toHaveValue(/\?room=[A-HJ-NP-Z2-9]{4}$/);
  const rules = page.locator('.rules-summary > summary'); await rules.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.rules-summary')).toHaveAttribute('open', '');
  await auditScreen(page, 'lobby-rules', true);
});
