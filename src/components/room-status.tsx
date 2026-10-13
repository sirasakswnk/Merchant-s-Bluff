import type { PublicRoomView } from '@/lib/shared/rooms';
import type { RoomViewProps, RoomViewState } from './room-view';

export function RoomStatus({ room, state, dispatch, connectionClassName = 'connection-state' }: {
  room: PublicRoomView; state: RoomViewState; dispatch: RoomViewProps['dispatch']; connectionClassName?: string;
}) {
  const { network, connected, synced, minimumRevision, busy, controlled, available, error, pending } = state;
  return <>
    <p className={connectionClassName} role="status">{!network || !connected ? 'กำลังเชื่อมต่อใหม่ · ปุ่มส่งคำสั่งปิดชั่วคราว' : !synced || room.revision < minimumRevision ? 'กำลังรอข้อมูลล่าสุด' : busy ? 'กำลังยืนยันคำสั่ง…' : 'เชื่อมต่อแล้ว'}{!controlled ? ' · แท็บนี้อ่านอย่างเดียว' : ''}</p>
    {error ? <p className="notice" role="alert">{error}</p> : null}
    {pending ? <section className="panel"><h2>ยังยืนยันผลคำสั่งไม่ได้</h2><p>คำสั่งอาจสำเร็จแล้ว ลองคำสั่งเดิมเพื่อตรวจผลก่อนทำรายการใหม่</p><button disabled={!available || busy} onClick={() => void dispatch()}>ลองคำสั่งเดิมอีกครั้ง</button></section> : null}
    {!controlled && !pending ? <section className="panel"><h2>เลือกแท็บควบคุม</h2><p>อีกแท็บกำลังควบคุมที่นั่งนี้ คุณยังอ่านข้อมูลของตัวเองได้</p>
      <button disabled={!available || busy} onClick={() => void dispatch({ type: 'claimControl' })}>ใช้แท็บนี้ควบคุม</button></section> : null}
  </>;
}
