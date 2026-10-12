'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { anonymousUser } from '@/lib/client/firebase';
import { clientUuid } from '@/lib/client/uuid';
import { ApiError, PENDING_KEY, postRoom, tabClientId, type PendingRequest } from '@/lib/client/rooms';
const AVATARS = ['🧑‍🌾', '🧙', '🧝', '🧑‍🍳', '🤴', '👸', '🧑‍🎨', '🧑‍🔧'];
export function HomeForm({ inviteCode }: { inviteCode: string }) {
  const router = useRouter(); const busyRef = useRef(false);
  const [identity, setIdentity] = useState<{ uid: string; clientId: string } | null>(null);
  const [mode, setMode] = useState(inviteCode ? 'join' : 'create');
  const [name, setName] = useState(''); const [code, setCode] = useState(inviteCode); const [avatar, setAvatar] = useState(0);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingRequest | null>(null); const [resumeId, setResumeId] = useState('');
  useEffect(() => {
    let active = true;
    void anonymousUser().then(user => {
      if (!active) return;
      setIdentity({ uid: user.uid, clientId: tabClientId() });
      const saved = localStorage.getItem('merchant-active-room');
      if (saved) { try { const value = JSON.parse(saved); if (value.uid === user.uid) setResumeId(value.roomId); } catch { /* Ignore malformed local preference. */ } }
      const request = sessionStorage.getItem(PENDING_KEY);
      if (request) {
        try {
          const value = JSON.parse(request) as PendingRequest;
          if (value.uid === user.uid) {
            setPending(value); setError('มีคำสั่งที่ยังยืนยันผลไม่ได้ ลองคำสั่งเดิมก่อนสร้างคำสั่งใหม่');
            if (value.path === '/api/rooms/command') setResumeId(String(value.body.roomId));
            else {
              setName(String(value.body.displayName)); setAvatar(Number(value.body.avatarId));
              if (value.path.endsWith('/join')) { setMode('join'); setCode(String(value.body.code)); }
            }
          }
        } catch { sessionStorage.removeItem(PENDING_KEY); }
      }
    }).catch(error => { if (active) setError(error instanceof Error ? error.message : 'เชื่อมต่อบัญชีไม่ได้'); });
    return () => { active = false; };
  }, []);
  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!identity || busyRef.current) return;
    if (pending?.path === '/api/rooms/command') { router.push(`/room/${pending.body.roomId}`); return; }
    const request: PendingRequest = pending ?? { uid: identity.uid, path: `/api/rooms/${mode}`,
      body: { commandId: clientUuid(), clientId: identity.clientId, displayName: name.trim(), avatarId: avatar,
        ...(mode === 'join' ? { code: code.trim().toUpperCase() } : {}) } };
    busyRef.current = true; setBusy(true); setError(''); sessionStorage.setItem(PENDING_KEY, JSON.stringify(request));
    try {
      const receipt = await postRoom(request);
      sessionStorage.removeItem(PENDING_KEY); setPending(null);
      localStorage.setItem('merchant-active-room', JSON.stringify({ uid: identity.uid, roomId: receipt.roomId }));
      router.push(`/room/${receipt.roomId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ส่งคำสั่งไม่สำเร็จ');
      if (error instanceof ApiError && !error.uncertain && error.code !== 'OFFLINE') { sessionStorage.removeItem(PENDING_KEY); setPending(null); }
      else setPending(request);
    } finally { busyRef.current = false; setBusy(false); }
  }
  return <section className="panel home-ticket" aria-labelledby="join-title">
    <p className="eyebrow">ใบผ่านด่าน</p><h2 id="join-title">เข้าตลาดกับเพื่อน</h2>
    {resumeId ? <p><Link className="button secondary" href={`/room/${resumeId}`}>กลับห้องที่กำลังเล่น</Link></p> : null}
    <div className="button-row"><button type="button" className="secondary" aria-pressed={mode === 'create'} disabled={busy || !!pending} onClick={() => setMode('create')}>สร้างห้อง</button>
      <button type="button" className="secondary" aria-pressed={mode === 'join'} disabled={busy || !!pending} onClick={() => setMode('join')}>เข้าด้วยรหัส</button></div>
    <form onSubmit={submit} aria-busy={busy}>
      {mode === 'join' ? <label>รหัสห้อง<input name="code" aria-label="รหัสห้อง" required pattern="[A-HJ-NP-Z2-9]{4}" maxLength={4} autoCapitalize="characters" autoComplete="off"
        value={code} disabled={busy || !!pending} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="ABCD" /><small>4 ตัว ไม่มี I, O, 0 หรือ 1</small></label> : null}
      <label>ชื่อที่เพื่อนจะเห็น<input name="displayName" required maxLength={16} autoComplete="nickname" value={name} disabled={busy || !!pending}
        onChange={event => setName(event.target.value)} placeholder="ชื่อพ่อค้าของคุณ" /></label>
      <fieldset disabled={busy || !!pending}><legend>หน้าตาพ่อค้า</legend><div className="avatars">{AVATARS.map((face, index) =>
        <button type="button" className="secondary" key={index} aria-label={`อวาตาร์ ${index + 1}`} aria-pressed={index === avatar} onClick={() => setAvatar(index)}>{face}</button>)}</div></fieldset>
      {error ? <p className="notice" role="alert">{error}</p> : null}
      {pending ? <button type="button" disabled={busy || !identity} onClick={() => void submit()}>ลองคำสั่งเดิมอีกครั้ง</button>
        : <button type="submit" disabled={busy || !identity || !name.trim()}>{busy ? 'กำลังเชื่อมต่อ…' : mode === 'create' ? 'สร้างห้องและเข้าเล่น' : 'เข้าห้อง'}</button>}
      <small>{identity ? 'คุยกับเพื่อนผ่านแอปที่คุณใช้ แล้วเล่นบนหน้านี้' : 'กำลังเชื่อมต่อบัญชีผู้เล่น…'}</small>
    </form>
  </section>;
}
