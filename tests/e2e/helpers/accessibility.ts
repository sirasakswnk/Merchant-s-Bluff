import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
export const accessibilityOutput = process.env.MERCHANT_A11Y_OUTPUT ?? 'work/verification/m4';

export const viewports = [
  { width: 360, height: 740 }, { width: 390, height: 844 }, { width: 430, height: 932 },
  { width: 740, height: 360 }, { width: 1280, height: 900 },
];
export async function auditScreen(page: Page, label: string, matrix = false) {
  const original = page.viewportSize()!;
  const results = [];
  for (const size of matrix ? viewports : [original]) {
    await page.setViewportSize(size);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: overflow ${size.width}`).toBe(true);
    const smallTargets = await page.locator('main').locator('button:visible, input:not(.sr-only):visible, label.avatar:visible, select:visible, summary:visible, a.button:visible').evaluateAll(nodes =>
      nodes.filter(node => node.getBoundingClientRect().height < 43.5).map(node => node.textContent?.trim()));
    expect(smallTargets, `${label}: touch targets ${size.width}`).toEqual([]);
    const analysis = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    results.push({ size, violations: analysis.violations, incomplete: analysis.incomplete.map(item => item.id) });
    await mkdir(accessibilityOutput, { recursive: true });
    await writeFile(`${accessibilityOutput}/${label}-${size.width}.json`, JSON.stringify(results.at(-1), null, 2));
    expect(analysis.violations, `${label}: axe ${size.width}`).toEqual([]);
    if (matrix) await page.screenshot({ path: `${accessibilityOutput}/${label}-${size.width}.png`, fullPage: true });
  }
  if (matrix) {
    await page.setViewportSize(viewports[0]);
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; document.body.style.fontSize = '32px'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: 200% text reflow`).toBe(true);
    await page.screenshot({ path: `${accessibilityOutput}/${label}-text-200.png`, fullPage: true });
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; document.body.style.fontSize = ''; });
  }
  await page.setViewportSize(original);
}
