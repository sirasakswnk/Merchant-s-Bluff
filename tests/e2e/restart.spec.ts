import { test, expect } from '@playwright/test';
import { spawn, execFile, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { joinPlayers, prepareAndPack, press, publicMoney, roomPhase } from './helpers/game-ui';
import type { BrowserContext, Page } from '@playwright/test';

test('a fresh API process recovers a committed RESOLUTION after restart and LAN HTTP can create/join/play', async ({ browser }) => {
  test.setTimeout(150000);
  let server: ChildProcess | undefined; const log: string[] = []; const pids: number[] = [];
  const address = Object.values(networkInterfaces()).flatMap(entries => entries ?? []).find(entry => entry.family === 'IPv4' && !entry.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address))?.address;
  const origin = `http://${address ?? '127.0.0.1'}:3200`;
  async function start() {
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '0.0.0.0', '--port', '3200'], {
      windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: {
        ...process.env, MERCHANT_RESTART_TEST: 'true', NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'true',
        NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: '', FIREBASE_PROJECT_ID: 'demo-merchants-bluff',
      },
    });
    pids.push(server.pid!); server.stdout?.on('data', chunk => log.push(chunk.toString())); server.stderr?.on('data', chunk => log.push(chunk.toString()));
    await expect.poll(async () => { try { return (await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(2000) })).status; } catch { return 0; } }, { timeout: 60000 }).toBe(200);
  }
  async function stop() {
    if (!server || server.exitCode !== null) return;
    const exited = once(server, 'exit');
    if (process.platform === 'win32') await new Promise<void>((resolve, reject) => execFile('taskkill', ['/PID', String(server!.pid), '/T', '/F'], { windowsHide: true }, error => error ? reject(error) : resolve()));
    else server.kill('SIGTERM');
    await exited;
  }
  await mkdir('work/verification/m5', { recursive: true });
  let contexts: BrowserContext[] = []; let pages: Page[] = [];
  try {
    const occupied = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(1000) }).then(() => true).catch(() => false);
    expect(occupied, 'Dedicated restart-test port must be free').toBe(false);
    await start(); ({ contexts, pages } = await joinPlayers(browser, 4, origin));
    if (address) expect(await pages[0].evaluate(() => isSecureContext)).toBe(false);
    for (const page of pages) { await press(page, 'พร้อม'); await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled(); }
    await press(pages[0], 'เริ่มเกม'); const { sheriff, merchants } = await prepareAndPack(pages, 1);
    const official = pages[sheriff]; const merchant = pages[merchants.at(-1)!];
    await merchant.getByLabel('ยอดเสนอเงิน').fill('3'); await press(merchant, 'เสนอเงิน');
    await press(official, `เลือก ทดสอบ${merchants.at(-1)! + 1}`); await press(official, 'ให้ผ่าน'); await press(official, 'ยืนยันให้ผ่าน');
    for (const page of pages) await roomPhase(page, 'RESOLUTION', 1);
    const resultId = await official.locator('.result').getAttribute('data-result-id');
    const money = await publicMoney(official); const result = await official.locator('.result').innerText();
    const roomUrls = pages.map(page => page.url());
    await Promise.all(pages.map(page => page.close())); // Reconnect clients explicitly, without dev HMR navigation races.
    await stop(); await expect.poll(async () => { try { await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(500) }); return true; } catch { return false; } }).toBe(false);
    await start(); expect(pids[1]).not.toBe(pids[0]);
    pages = await Promise.all(contexts.map(context => context.newPage()));
    for (const [index, page] of pages.entries()) {
      await page.goto(roomUrls[index]); await expect(page.locator('main')).toHaveAttribute('data-phase', 'RESOLUTION');
      await press(page, 'ใช้แท็บนี้ควบคุม'); await roomPhase(page, 'RESOLUTION', 1);
      await expect(page.locator('.result')).toHaveAttribute('data-result-id', resultId!); expect(await page.locator('.result').innerText()).toBe(result);
      expect(await publicMoney(page)).toEqual(money);
      await expect(page.locator('.result-bag')).not.toHaveClass(/glow/); // Reload does not replay the visual event.
    }
    await pages[sheriff].waitForTimeout(500); await roomPhase(pages[sheriff], 'RESOLUTION', 1);
    await press(pages[sheriff], 'เลือกพ่อค้าคนต่อไป'); for (const page of pages) await roomPhase(page, 'NEGOTIATE', 1);
    await writeFile('work/verification/m5/restart.json', JSON.stringify({ origin, lanHttp: Boolean(address), apiPids: pids, restoredPhase: 'RESOLUTION', resultId, moneyUnchanged: true, manualAdvance: true }, null, 2));
    await pages[sheriff].screenshot({ path: 'work/verification/m5/after-api-restart.png', fullPage: true });
  } finally {
    await Promise.all(contexts.map(context => context.close())); await stop(); await writeFile('work/verification/m5/restart-server.log', log.join(''));
  }
});
