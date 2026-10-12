import { expect, test } from '@playwright/test';

test('health API and authenticated browser → API → RTDB listener, including reload', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: 'ok', milestone: 'M0', rulesVersion: '0.2' });
  expect((await request.post('/api/dev/connect')).status()).toBe(401);
  expect((await request.post('/api/dev/connect', { headers: { Authorization: 'Bearer forged-token' } })).status()).toBe(401);
  expect((await request.post('/api/dev/connect', { headers: { Origin: 'https://invalid.example' } })).status()).toBe(403);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('พ่อค้าหน้าประตู');
  await page.getByText('ตรวจการเชื่อมต่อ (สำหรับการพัฒนา)', { exact: true }).click();
  const first = page.waitForResponse(response => response.url().endsWith('/api/dev/connect') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'ตรวจการเชื่อมต่อ', exact: true }).click();
  expect((await first).status()).toBe(200);
  await expect(page.getByRole('status')).toContainText('เชื่อมต่อสำเร็จ', { timeout: 20000 });
  const firstUid = JSON.parse(Buffer.from((await first).request().headers().authorization.slice(7).split('.')[1], 'base64url').toString()).sub as string;
  await page.reload();
  await page.getByText('ตรวจการเชื่อมต่อ (สำหรับการพัฒนา)', { exact: true }).click();
  const second = page.waitForResponse(response => response.url().endsWith('/api/dev/connect') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'ตรวจการเชื่อมต่อ', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('เชื่อมต่อสำเร็จ', { timeout: 20000 });
  const secondUid = JSON.parse(Buffer.from((await second).request().headers().authorization.slice(7).split('.')[1], 'base64url').toString()).sub as string;
  expect(firstUid).toBeTruthy();
  expect(secondUid).toBe(firstUid);
  expect(errors).toEqual([]);
});

test('temporary UI fits mobile, short landscape, and desktop widths', async ({ page }) => {
  const sizes = [[360, 740], [390, 844], [430, 932], [740, 360], [1280, 800]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByText('ตรวจการเชื่อมต่อ (สำหรับการพัฒนา)', { exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const button = page.getByRole('button', { name: 'ตรวจการเชื่อมต่อ', exact: true });
    const bounds = await button.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('heading', { name: 'ใบกัญชา', exact: true })).toBeVisible();
    await page.screenshot({ path: 'work/verification/m0/viewport-' + width + 'x' + height + '.png', fullPage: true });
  }
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'ตรวจการเชื่อมต่อ', exact: true })).toBeFocused();
});
