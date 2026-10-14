import { describe, expect, it } from 'vitest';
import { makePreviewModel, type PreviewOptions } from '../../src/lib/preview/scenarios';
import { phaseGuide, seatStatus } from '../../src/components/table/phase-guide';
import type { PublicRoomView } from '../../src/lib/shared/rooms';

const options = (scene: PreviewOptions['scene'], role: PreviewOptions['role'] = 'merchant'): PreviewOptions => ({ scene, role, players: 5, state: 'online', width: 'auto' });
function withPlayers(room: PublicRoomView, change: (player: PublicRoomView['players'][number]) => Partial<PublicRoomView['players'][number]>): PublicRoomView {
  return { ...room, players: room.players.map(player => ({ ...player, ...change(player) })) };
}

describe('phase guide', () => {
  it('names the step and asks unfinished merchants to act, with progress over merchants only', () => {
    const { room, playerId } = makePreviewModel(options('prepare'));
    const waiting = withPlayers(room, () => ({ prepared: false }));
    const guide = phaseGuide(waiting, playerId)!;
    expect(guide).toMatchObject({ step: 1, totalSteps: 5, label: 'เตรียมสินค้า', yourMove: true, progress: { done: 0, total: 4 } });
    const ready = withPlayers(waiting, player => ({ prepared: player.id === playerId }));
    expect(phaseGuide(ready, playerId)).toMatchObject({ yourMove: false, progress: { done: 1, total: 4 } });
    expect(phaseGuide(ready, room.sheriffId!)).toMatchObject({ yourMove: false });
  });

  it('gives the sheriff the move while negotiating and merchants the move until they offer', () => {
    const merchant = makePreviewModel(options('negotiate'));
    expect(phaseGuide(merchant.room, merchant.room.sheriffId!)).toMatchObject({ step: 3, yourMove: true });
    expect(phaseGuide(merchant.room, merchant.playerId)).toMatchObject({ yourMove: false });
    const noOffer = withPlayers(merchant.room, player => player.id === merchant.playerId ? { offer: { submitted: false, amount: 0, version: 0 } } : {});
    expect(phaseGuide(noOffer, merchant.playerId)).toMatchObject({ yourMove: true });
  });

  it('asks only the sheriff to continue after a result or a round summary', () => {
    for (const scene of ['inspect-legal', 'summary'] as const) {
      const { room, playerId } = makePreviewModel(options(scene));
      expect(phaseGuide(room, room.sheriffId!)?.yourMove).toBe(true);
      expect(phaseGuide(room, playerId)?.yourMove).toBe(false);
    }
  });

  it('has no guide outside an active game', () => {
    for (const scene of ['lobby', 'game-over', 'aborted'] as const) {
      const { room, playerId } = makePreviewModel(options(scene));
      expect(phaseGuide(room, playerId)).toBeNull();
    }
  });

  it('marks finished, waiting and acting seats', () => {
    const pack = makePreviewModel(options('pack'));
    const mixed = withPlayers(pack.room, player => ({ bagLocked: player.id === pack.playerId }));
    expect(seatStatus(mixed.players.find(player => player.id === pack.playerId)!, mixed)).toBe('done');
    expect(seatStatus(mixed.players.find(player => player.id !== pack.playerId && player.id !== mixed.sheriffId)!, mixed)).toBe('waiting');
    expect(seatStatus(mixed.players.find(player => player.id === mixed.sheriffId)!, mixed)).toBeNull();
    const negotiate = makePreviewModel(options('negotiate')).room;
    expect(seatStatus(negotiate.players.find(player => player.id === negotiate.sheriffId)!, negotiate)).toBe('acting');
  });
});
