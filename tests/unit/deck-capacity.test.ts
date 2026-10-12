import { mkdirSync, writeFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { gameFixture, step, type CommandInput } from '../fixtures/game';
import { activeCards, assertApprovedInventory, inventorySummary } from '../fixtures/inventory';

const reports: object[] = [];
afterAll(() => {
  mkdirSync('work/verification/rules-0.2', { recursive: true });
  writeFileSync('work/verification/rules-0.2/engine-capacity.json', JSON.stringify(reports, null, 2));
});
describe('360 cards: maximum cargo and PASS throughout the entire game', () => {
  it.each([4, 5, 6].flatMap(players => [0, 3].map(exchange => ({ players, exchange }))))(
    '$players players, exchange $exchange on every merchant turn', ({ players, exchange }) => {
      for (const seed of [7, 42, 73]) {
        let state = gameFixture(players, seed);
        const initialIds = activeCards(state).map(card => card.instanceId);
        const sheriffs = Object.fromEntries(state.seatOrder.map(id => [id, 0]));
        let checkedTransitions = 0; let reshuffles = 0;
        const execute = (actor: string, command: CommandInput) => {
          const previousDeckSize = state.deck.length;
          state = step(state, actor, command);
          assertApprovedInventory(state, initialIds);
          expect(state.rules.rulesVersion).toBe('0.2');
          expect(Object.values(state.finances.cash)).toEqual(Array<number>(players).fill(50));
          if (state.deck.length > previousDeckSize) reshuffles++;
          checkedTransitions++;
        };
        assertApprovedInventory(state, initialIds);
        while (state.phase !== 'GAME_OVER') {
          sheriffs[state.sheriffId]++;
          const merchants = state.seatOrder.filter(id => id !== state.sheriffId);
          const sheriffHand = structuredClone(state.players[state.sheriffId].hand);
          for (const id of merchants) execute(id, { type: 'prepareGoods', cardIds: state.players[id].hand.slice(0, exchange).map(card => card.instanceId) });
          expect(state.players[state.sheriffId].hand).toEqual(sheriffHand);
          for (const id of merchants) execute(id, { type: 'lockBag', cardIds: state.players[id].hand.slice(0, 5).map(card => card.instanceId), declaredProductId: 'apple' });
          for (const id of merchants) execute(id, { type: 'setOffer', amount: 0, expectedOfferVersion: 0 });
          for (const id of merchants.slice().reverse()) {
            execute(state.sheriffId, { type: 'selectMerchant', merchantId: id });
            execute(state.sheriffId, { type: 'resolveMerchant', merchantId: id, action: 'PASS', expectedOfferVersion: 1 });
            expect(state.currentResolution?.result.passed).toHaveLength(5);
            expect(state.currentResolution?.result.confiscated).toEqual([]);
            execute(state.sheriffId, { type: 'acknowledgeResolution', resolutionId: state.currentResolution!.id });
          }
          execute(state.sheriffId, { type: 'endRound' });
        }
        expect(state.roundIndex).toBe(players * 2);
        expect(Object.values(sheriffs)).toEqual(Array<number>(players).fill(2));
        expect(state.history).toHaveLength(players * 2 * (players - 1));
        expect(state.history.every(record => record.result.action === 'PASS' && record.result.bagCount === 5)).toBe(true);
        expect(state.scores?.standings).toHaveLength(players);
        const inventory = inventorySummary(state);
        expect(inventory.stash).toBe(players * 2 * (players - 1) * 5);
        // The final sheriff kept its one-card hand from the preceding merchant turn.
        expect(inventory.bag).toBe(0); expect(inventory.hand).toBe(players);
        if (exchange === 0) expect(inventory.discard).toBe(0);
        if (players === 6 && exchange === 3) expect(reshuffles).toBeGreaterThan(0);
        reports.push({ players, exchange, seed, rounds: state.roundIndex, phase: state.phase,
          checkedTransitions, sheriffTurns: sheriffs, reshuffles, inventory });
      }
    }, 15000,
  );
});
