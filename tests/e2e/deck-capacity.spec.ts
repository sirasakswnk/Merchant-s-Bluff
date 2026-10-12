import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { test, expect } from '@playwright/test';
import type { GameState } from '../../src/lib/game/types';
import { activeCards, assertApprovedInventory } from '../fixtures/inventory';
import { joinPlayers, prepareAndPack, press, roomPhase } from './helpers/game-ui';

for (const players of [4, 5, 6]) for (const exchange of [0, 3]) {
  test(`${players} mobile players carry 5 and PASS every round, exchange ${exchange}, 360 cards conserved`, async ({ browser }) => {
    test.setTimeout(240000);
    if (process.env.FIREBASE_DATABASE_EMULATOR_HOST !== '127.0.0.1:19000') throw new Error('Inventory reads require the local emulator');
    const app = initializeApp({ projectId: 'demo-merchants-bluff', databaseURL: 'https://demo-merchants-bluff-default-rtdb.firebaseio.com' }, `capacity-${randomUUID()}`);
    const { pages, contexts } = await joinPlayers(browser, players);
    const errors: string[] = []; pages.forEach(page => page.on('pageerror', error => errors.push(error.message)));
    try {
      await expect(pages[0].getByText('กติกาย่อ · สำรับ 360 ใบ', { exact: true })).toBeVisible();
      for (const page of pages) {
        await press(page, 'พร้อม'); await expect(page.getByRole('button', { name: 'ยกเลิกพร้อม', exact: true })).toBeEnabled();
      }
      await press(pages[0], 'เริ่มเกม'); await roomPhase(pages[0], 'PREPARE', 1);
      const roomId = new URL(pages[0].url()).pathname.split('/').at(-1)!;
      const read = async (): Promise<GameState> => JSON.parse((await getDatabase(app).ref(`rooms/${roomId}/authoritative/snapshot`).get()).val()).game;
      const initialIds = activeCards(await read()).map(card => card.instanceId);
      const checkpoints: object[] = []; const sheriffTurns = Array<number>(players).fill(0);
      const checkpoint = async () => {
        const state = await read();
        expect(state.rules.rulesVersion).toBe('0.2');
        const inventory = assertApprovedInventory(state, initialIds);
        expect(Object.values(state.finances.cash)).toEqual(Array<number>(players).fill(50));
        checkpoints.push({ round: state.roundIndex, phase: state.phase, revision: state.revision, inventory });
        return state;
      };
      await checkpoint();
      for (let round = 1; round <= players * 2; round++) {
        const { sheriff, merchants } = await prepareAndPack(pages, round, 5, exchange);
        sheriffTurns[sheriff]++; const official = pages[sheriff];
        const packed = await checkpoint();
        expect(merchants.every(index => packed.players[packed.seatOrder[index]].bag.length === 5)).toBe(true);
        for (const index of merchants.slice().reverse()) {
          await press(official, `เลือก ทดสอบ${index + 1}`); await press(official, 'ให้ผ่าน'); await press(official, 'ยืนยันให้ผ่าน');
          for (const page of pages) await roomPhase(page, 'RESOLUTION', round);
          const resolved = await checkpoint();
          expect(resolved.currentResolution?.result.bagCount).toBe(5);
          expect(resolved.currentResolution?.result.action).toBe('PASS');
          if (await official.getByRole('button', { name: 'เลือกพ่อค้าคนต่อไป', exact: true }).count()) await press(official, 'เลือกพ่อค้าคนต่อไป');
          else await press(official, 'สรุปรอบ');
          await checkpoint();
        }
        for (const page of pages) await roomPhase(page, 'ROUND_SUMMARY', round);
        await press(official, round === players * 2 ? 'ยืนยันจบรอบสุดท้ายและดูคะแนน' : 'จบรอบ / ส่งต่อตำแหน่งนายด่าน');
        await checkpoint();
      }
      for (const page of pages) {
        await roomPhase(page, 'GAME_OVER', players * 2);
        await expect(page.getByRole('heading', { name: 'คะแนนสุดท้าย', exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.locator('.scores').innerText()).toBe(await pages[0].locator('.scores').innerText());
      }
      const final = await read();
      expect(final.history).toHaveLength(players * 2 * (players - 1));
      expect(Object.values(final.players).every(player => player.stash.length === (players - 1) * 10)).toBe(true);
      expect(sheriffTurns).toEqual(Array<number>(players).fill(2)); expect(errors).toEqual([]);
      await mkdir('work/verification/rules-0.2', { recursive: true });
      await pages[0].screenshot({ path: `work/verification/rules-0.2/final-${players}-exchange-${exchange}.png`, fullPage: true });
      await writeFile(`work/verification/rules-0.2/browser-${players}-exchange-${exchange}.json`, JSON.stringify({
        players, exchange, rounds: final.roundIndex, phase: final.phase, sheriffTurns, pageErrors: errors,
        finalInventory: assertApprovedInventory(final, initialIds), checkpoints,
      }, null, 2));
    } finally { await Promise.all(contexts.map(context => context.close())); await deleteApp(app); }
  });
}
