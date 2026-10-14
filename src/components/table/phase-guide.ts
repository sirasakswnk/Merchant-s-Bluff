import type { PublicPlayer, PublicRoomView } from '@/lib/shared/rooms';

/** Round steps shown on the table plaque, the task bar and the step track. Reads only the public view. */
export const GUIDE_STEPS = [
  { phase: 'PREPARE', label: 'เตรียมสินค้า', icon: '🔄' },
  { phase: 'PACK_AND_DECLARE', label: 'จัดกระเป๋าและแจ้งสินค้า', icon: '👜' },
  { phase: 'NEGOTIATE', label: 'เจรจา', icon: '🤝' },
  { phase: 'RESOLUTION', label: 'ผลการตัดสิน', icon: '⚖️' },
  { phase: 'ROUND_SUMMARY', label: 'สรุปรอบ', icon: '📜' },
] as const;

export type SeatStatus = 'done' | 'waiting' | 'acting' | null;
export interface PhaseGuide {
  readonly step: number; readonly totalSteps: number; readonly label: string; readonly icon: string;
  /** What this viewer should do now, or what the table is waiting for. */
  readonly task: string;
  /** True when the next move belongs to this viewer. */
  readonly yourMove: boolean;
  readonly progress: { readonly done: number; readonly total: number; readonly label: string } | null;
}

function nameOf(id: string, room: PublicRoomView) { return room.players.find(player => player.id === id)?.displayName ?? 'ผู้เล่น'; }
function merchantsOf(room: PublicRoomView) { return room.players.filter(player => player.id !== room.sheriffId); }

/** Per-seat marker: who has finished this step and who the table is waiting on. */
export function seatStatus(player: PublicPlayer, room: PublicRoomView): SeatStatus {
  if (room.lifecycle !== 'PLAYING') return null;
  const sheriff = player.id === room.sheriffId;
  if (room.phase === 'PREPARE') return sheriff ? null : player.prepared ? 'done' : 'waiting';
  if (room.phase === 'PACK_AND_DECLARE') return sheriff ? null : player.bagLocked ? 'done' : 'waiting';
  if (sheriff) return 'acting';
  if (room.phase === 'ROUND_SUMMARY' || player.decisionId) return 'done';
  return player.offer?.submitted ? 'done' : 'waiting';
}

export function phaseGuide(room: PublicRoomView, playerId: string): PhaseGuide | null {
  if (room.lifecycle !== 'PLAYING') return null;
  const index = GUIDE_STEPS.findIndex(step => step.phase === room.phase);
  if (index < 0) return null;
  const { label, icon } = GUIDE_STEPS[index];
  const isSheriff = room.sheriffId === playerId;
  const me = room.players.find(player => player.id === playerId);
  const merchants = merchantsOf(room);
  const decided = merchants.filter(player => player.decisionId).length;
  const sheriffName = room.sheriffId ? nameOf(room.sheriffId, room) : 'นายด่าน';
  const base = { step: index + 1, totalSteps: GUIDE_STEPS.length, label, icon };

  if (room.phase === 'PREPARE' || room.phase === 'PACK_AND_DECLARE') {
    const prepare = room.phase === 'PREPARE';
    const done = merchants.filter(player => prepare ? player.prepared : player.bagLocked).length;
    const progress = { done, total: merchants.length, label: prepare ? 'พ่อค้าพร้อม' : 'ปิดกระเป๋าแล้ว' };
    const finished = prepare ? me?.prepared : me?.bagLocked;
    if (isSheriff) return { ...base, task: prepare ? 'รอพ่อค้าเตรียมสินค้า · รอบนี้คุณไม่จั่วและไม่จัดกระเป๋า' : 'รอพ่อค้าจัดกระเป๋าและแจ้งสินค้า', yourMove: false, progress };
    if (!finished) return { ...base, task: prepare ? 'เลือกแลกไพ่ 0–3 ใบ แล้วกดพร้อมจัดกระเป๋า' : 'เลือกไพ่ 1–5 ใบใส่กระเป๋า แจ้งสินค้า แล้วปิดกระเป๋า', yourMove: true, progress };
    return { ...base, task: prepare ? 'คุณพร้อมแล้ว · รอพ่อค้าคนอื่น' : 'ปิดกระเป๋าแล้ว · รอพ่อค้าคนอื่น', yourMove: false, progress };
  }

  const progress = { done: decided, total: merchants.length, label: 'ตัดสินแล้ว' };
  if (room.phase === 'NEGOTIATE') {
    if (isSheriff) return { ...base, task: room.selectedMerchantId ? `ตัดสินกระเป๋าของ ${nameOf(room.selectedMerchantId, room)} · ตรวจหรือให้ผ่าน` : `เลือกพ่อค้าที่จะตัดสิน · เหลือ ${merchants.length - decided} คน`, yourMove: true, progress };
    if (me?.decisionId) return { ...base, task: 'กระเป๋าของคุณตัดสินแล้ว · รอคนอื่น', yourMove: false, progress };
    if (!me?.offer?.submitted) return { ...base, task: 'เสนอเงินให้นายด่าน หรือกดไม่เสนอเงิน', yourMove: true, progress };
    return { ...base, task: `ยื่นข้อเสนอแล้ว · รอ${sheriffName}ตัดสิน (ยังแก้ข้อเสนอได้)`, yourMove: false, progress };
  }
  if (room.phase === 'RESOLUTION') {
    const target = room.result ? nameOf(room.result.merchantId, room) : 'พ่อค้า';
    if (isSheriff) return { ...base, task: decided >= merchants.length ? 'ดูผลแล้วกดสรุปรอบ' : 'ดูผลแล้วกดเลือกพ่อค้าคนต่อไป', yourMove: true, progress };
    return { ...base, task: room.result?.merchantId === playerId ? 'ผลกระเป๋าของคุณออกแล้ว · ดูด้านล่าง' : `ผลของ ${target} ออกแล้ว · รอ${sheriffName}ไปต่อ`, yourMove: false, progress };
  }
  const last = room.roundIndex >= room.totalRounds;
  if (isSheriff) return { ...base, task: last ? 'กดยืนยันจบรอบสุดท้ายเพื่อดูคะแนน' : 'กดจบรอบเพื่อส่งต่อตำแหน่งนายด่าน', yourMove: true, progress };
  return { ...base, task: last ? `รอ${sheriffName}ยืนยันจบเกม` : `รอ${sheriffName}เริ่มรอบถัดไป`, yourMove: false, progress };
}
