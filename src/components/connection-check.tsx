'use client';
import { useEffect, useRef, useState } from 'react';
import { checkLocalConnection } from '@/lib/client/connection-check';
export function ConnectionCheck() {
  const [status, setStatus] = useState('ยังไม่ได้ตรวจการเชื่อมต่อ');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function check() {
    if (controller.current) return;
    const next = new AbortController();
    controller.current = next; setBusy(true); setStatus('กำลังเชื่อมต่อ…');
    try {
      await checkLocalConnection(next.signal);
      if (!next.signal.aborted) setStatus('เชื่อมต่อสำเร็จ: API, Auth และข้อมูล realtime พร้อม');
    } catch (error) {
      if (!next.signal.aborted) setStatus(error instanceof Error ? error.message : 'เชื่อมต่อไม่สำเร็จ');
    } finally {
      if (controller.current === next) controller.current = null;
      if (!next.signal.aborted) setBusy(false);
    }
  }
  return <details className="panel">
    <summary>ตรวจการเชื่อมต่อ (สำหรับการพัฒนา)</summary>
    <p>เปิด Firebase Emulators ก่อนตรวจ ระบบจะทดสอบข้อมูลของผู้ใช้คนนี้เท่านั้น</p>
    <button type="button" onClick={check} disabled={busy}>{busy ? 'กำลังตรวจ…' : 'ตรวจการเชื่อมต่อ'}</button>
    <p role="status" aria-live="polite">{status}</p>
  </details>;
}
