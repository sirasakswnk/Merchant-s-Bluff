import { expect, type Page, type Frame, type FrameLocator } from '@playwright/test';

/** Reach a private card through the same navigation available to the player. */
export async function showHandCard(page: Page | Frame | FrameLocator, index: number) {
  const viewport = page.locator('[data-hand-scroll]');
  await expect(viewport).toHaveAttribute('data-hand-arc', /true|false/);
  if (await viewport.getAttribute('data-hand-arc') === 'true') {
    await expect(viewport).toHaveAttribute('data-hand-moving', 'false');
    let current = Number(await viewport.getAttribute('data-hand-center'));
    while (current !== index) {
      const next = current + (index > current ? 1 : -1);
      await page.getByRole('button', { name: index > current ? 'ดูไพ่ใบถัดไป' : 'ดูไพ่ใบก่อนหน้า', exact: true }).click();
      await expect(viewport).toHaveAttribute('data-hand-center', String(next));
      await expect(viewport).toHaveAttribute('data-hand-moving', 'false');
      current = next;
    }
  } else await page.locator('button.card').nth(index).scrollIntoViewIfNeeded();
}

export async function tapHandCard(page: Page | Frame | FrameLocator, index: number) {
  await showHandCard(page, index);
  await page.locator('button.card').nth(index).tap();
}
