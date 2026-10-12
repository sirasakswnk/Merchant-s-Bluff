'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { anonymousUser } from '@/lib/client/firebase';
import { clientUuid } from '@/lib/client/uuid';
import { ApiError, PENDING_KEY, postRoom, tabClientId, type PendingRequest } from '@/lib/client/rooms';
import { HomeIcon } from './home/art';
import { homeAvatars } from './home/artwork';
export function HomeForm({ inviteCode }: { inviteCode: string }) {
  const router = useRouter(); const busyRef = useRef(false);
  const [identity, setIdentity] = useState<{ uid: string; clientId: string } | null>(null);
  const [mode, setMode] = useState(inviteCode ? 'join' : 'create');
  const [name, setName] = useState(''); const [code, setCode] = useState(inviteCode); const [avatar, setAvatar] = useState(0);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingRequest | null>(null); const [resumeId, setResumeId] = useState('');
  const [online, setOnline] = useState(true);
  const [codeLocked, setCodeLocked] = useState(Boolean(inviteCode));
  const [success, setSuccess] = useState<{ roomId: string; code: string } | null>(null);
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
  useEffect(() => {
    const update = () => setOnline(navigator.onLine); update();
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    if (!success) return;
    // The stamp follows a committed API receipt; it never simulates room creation.
    const timer = setTimeout(() => router.push(`/room/${success.roomId}`), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420);
    return () => clearTimeout(timer);
  }, [success, router]);
  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!identity || busyRef.current || success || !online) return;
    if (pending?.path === '/api/rooms/command') { router.push(`/room/${pending.body.roomId}`); return; }
    const request: PendingRequest = pending ?? { uid: identity.uid, path: `/api/rooms/${mode}`,
      body: { commandId: clientUuid(), clientId: identity.clientId, displayName: name.trim(), avatarId: avatar,
        ...(mode === 'join' ? { code: code.trim().toUpperCase() } : {}) } };
    busyRef.current = true; setBusy(true); setError(''); sessionStorage.setItem(PENDING_KEY, JSON.stringify(request));
    try {
      const receipt = await postRoom(request);
      sessionStorage.removeItem(PENDING_KEY); setPending(null);
      localStorage.setItem('merchant-active-room', JSON.stringify({ uid: identity.uid, roomId: receipt.roomId }));
      setSuccess({ roomId: receipt.roomId, code: receipt.code });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ส่งคำสั่งไม่สำเร็จ');
      if (error instanceof ApiError && !error.uncertain && error.code !== 'OFFLINE') { sessionStorage.removeItem(PENDING_KEY); setPending(null); }
      else setPending(request);
    } finally { busyRef.current = false; setBusy(false); }
  }
  const blocked = busy || !identity || !online || !name.trim() || (mode === 'join' && !/^[A-HJ-NP-Z2-9]{4}$/.test(code));
  const hint = !online ? 'ออฟไลน์อยู่ ต่ออินเทอร์เน็ตก่อนแล้วกดอีกครั้ง' : !identity ? 'กำลังเชื่อมต่อบัญชีผู้เล่น…' : mode === 'join' && code.length !== 4 ? 'ใส่รหัสห้องให้ครบ 4 ตัว' : !name.trim() ? 'ใส่ชื่อที่เพื่อนจะเห็นก่อน' : mode === 'create' ? 'ห้องใหม่รับผู้เล่น 4–6 คน คุณจะเป็นเจ้าของห้อง' : '';
  return <>
    <div className="status">
      {!online ? <div className="banner tile" role="status"><span className="banner-icon" aria-hidden="true">!</span><div className="banner-body"><strong>ออฟไลน์อยู่</strong><small>ต่ออินเทอร์เน็ตแล้วปุ่มสร้างห้องและเข้าห้องจะกลับมาใช้ได้ ข้อมูลที่กรอกไว้ยังอยู่</small></div></div> : null}
      {resumeId && !success ? <section className="banner banner-resume tile" aria-labelledby="resume-title"><span className="banner-icon" aria-hidden="true">↺</span><div className="banner-body"><strong id="resume-title">กลับห้องที่คุณเคยเข้าเล่น</strong><small>กลับเข้าที่นั่งเดิมได้จากเบราว์เซอร์นี้</small></div><Link className="btn btn-brass btn-small" href={`/room/${resumeId}`}>กลับห้องที่กำลังเล่น</Link></section> : null}
    </div>
    <section className="join" id="join" aria-labelledby="join-title"><div className="slip paper">
      <span className="slip-mark" aria-hidden="true">ด่าน</span><h2 id="join-title">ใบผ่านด่าน</h2><p className="slip-sub">กรอกชื่อ เลือกหน้าตา แล้วเข้าเมืองพร้อมเพื่อน</p>
      {success ? <div className="success" tabIndex={-1} role="status"><div className="stamp is-in" aria-hidden="true">ผ่าน<br />ด่าน</div><h3>{mode === 'create' ? 'สร้าง' : 'เข้า'}ห้อง {success.code} แล้ว</h3><p>กำลังพาไปที่ห้องรอผู้เล่น</p></div> : <div>
        <div className="segmented" role="group" aria-label="เลือกวิธีเข้าเล่น"><button type="button" aria-pressed={mode === 'create'} disabled={busy || !!pending} onClick={() => setMode('create')}>สร้างห้อง</button><button type="button" aria-pressed={mode === 'join'} disabled={busy || !!pending} onClick={() => setMode('join')}>เข้าด้วยรหัส</button></div>
        {inviteCode && mode === 'join' ? <p className="invite">เพื่อนชวนเข้าห้อง <strong>{inviteCode}</strong></p> : null}
        <form onSubmit={submit} aria-busy={busy}>
          {mode === 'join' ? <div className="field"><label htmlFor="room-code">รหัสห้อง</label><div className="code-row"><input className="input input-code" id="room-code" name="code" required pattern="[A-HJ-NP-Z2-9]{4}" maxLength={4} autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-describedby="code-hint" readOnly={codeLocked}
            value={code} disabled={busy || !!pending} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 4))} placeholder="····" />{codeLocked ? <button type="button" className="btn btn-ghost btn-small" disabled={busy || !!pending} onClick={() => setCodeLocked(false)}>แก้รหัส</button> : null}</div><p className="field-hint" id="code-hint">4 ตัวจากลิงก์ที่เพื่อนส่งมา ไม่มีตัว O, I, 0 หรือ 1</p></div> : null}
          <div className="field"><div className="label-row"><label htmlFor="player-name">ชื่อที่เพื่อนจะเห็น</label><span className="counter" aria-hidden="true">{[...name].length}/16</span></div><input className="input" id="player-name" name="displayName" required maxLength={16} autoComplete="nickname" enterKeyHint="go" value={name} disabled={busy || !!pending} onChange={event => setName(event.target.value)} placeholder="เช่น ฟิลด์ผู้ซื่อสัตย์" /></div>
          <fieldset className="field" disabled={busy || !!pending}><legend>หน้าตาพ่อค้า</legend><div className="avatar-grid">{homeAvatars.map((face, index) => <label className="avatar" key={index}>
            <input type="radio" className="sr-only" name="avatar" aria-label={`อวาตาร์ ${index + 1}`} value={index} checked={index === avatar} onChange={() => setAvatar(index)} /><span className="avatar-face" dangerouslySetInnerHTML={{ __html: face.svg }} /><span className="sr-only">{face.label}</span>
          </label>)}</div></fieldset>
          {error ? <div className="notice" role="alert"><span className="notice-icon" aria-hidden="true">!</span><p>{error}</p></div> : null}
          {pending ? <button className="btn btn-primary" type="button" disabled={busy || !identity || !online} onClick={() => void submit()}>ลองคำสั่งเดิมอีกครั้ง</button> : <button className="btn btn-primary" type="submit" aria-label={mode === 'create' ? 'สร้างห้องและเข้าเล่น' : 'เข้าห้อง'} aria-disabled={blocked} aria-busy={busy} disabled={blocked} aria-describedby="submit-hint">{busy ? <span className="spinner" aria-hidden="true" /> : null}<span>{busy ? mode === 'create' ? 'กำลังสร้างห้อง…' : 'กำลังเข้าห้อง…' : mode === 'create' ? 'สร้างห้อง' : code.length === 4 ? `เข้าห้อง ${code}` : 'เข้าห้อง'}</span></button>}
          <p className="submit-hint" id="submit-hint" aria-live="polite">{hint}</p>
        </form>
      </div>}
      <p className="talk-note"><HomeIcon name="i-chat" /><span>คุยกับเพื่อนผ่านแอปที่คุณใช้ หรือคุยกันต่อหน้า แล้วเล่นบนหน้านี้ เว็บนี้ไม่มีแชทหรือเสียงในตัว</span></p>
    </div></section>
  </>;
}
