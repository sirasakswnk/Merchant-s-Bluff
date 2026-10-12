'use client';
import { useEffect, useRef, useState } from 'react';
import { anonymousUser } from '@/lib/client/firebase';
import { ApiError, PENDING_KEY, postRoom, resumeRoom, tabClientId, watchPresence, watchRoom, type PendingRequest } from '@/lib/client/rooms';
import { clientUuid } from '@/lib/client/uuid';
import type { PrivateRoomView, PublicRoomView, RoomCommandRequest } from '@/lib/shared/rooms';
import { RoomLoading, RoomView } from './room-view';

export function RoomClient({ roomId }: { roomId: string }) {
  const [identity, setIdentity] = useState<{ uid: string; clientId: string } | null>(null);
  const [views, setViews] = useState<{ room: PublicRoomView; own: PrivateRoomView; animateResult: boolean } | null>(null);
  const [connected, setConnected] = useState(false); const [network, setNetwork] = useState(true); const [synced, setSynced] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<ReadonlySet<string>>(new Set());
  const [minimumRevision, setMinimumRevision] = useState(0);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<PendingRequest | null>(null); const busyRef = useRef(false);
  useEffect(() => {
    let active = true; let stopViews = () => {}; let stopPresence = () => {}; let received = false; let lastResult = '';
    const onNetwork = () => setNetwork(navigator.onLine);
    window.addEventListener('online', onNetwork); window.addEventListener('offline', onNetwork);
    void (async () => {
      try {
        const user = await anonymousUser(); const resumed = await resumeRoom(roomId); if (!active) return;
        setMinimumRevision(resumed.revision);
        const clientId = tabClientId(); setIdentity({ uid: user.uid, clientId }); setNetwork(navigator.onLine);
        localStorage.setItem('merchant-active-room', JSON.stringify({ roomId, uid: user.uid }));
        const saved = sessionStorage.getItem(PENDING_KEY);
        if (saved) { try { const value = JSON.parse(saved) as PendingRequest; if (value.uid === user.uid && value.body.roomId === roomId) { setPending(value); setError('มีคำสั่งที่ยังยืนยันผลไม่ได้ กรุณาลองคำสั่งเดิม'); } } catch { sessionStorage.removeItem(PENDING_KEY); } }
        stopViews = watchRoom(roomId, user.uid, (room, own) => {
          if (!active) return;
          const resultId = room.result?.id ?? '';
          const key = `merchant-last-result:${roomId}:${user.uid}`;
          const animateResult = received && resultId !== '' && resultId !== lastResult && resultId !== sessionStorage.getItem(key);
          received = true; lastResult = resultId;
          if (resultId) sessionStorage.setItem(key, resultId);
          // Keep the one-shot CSS event attached to this result through unrelated view updates.
          setViews(previous => ({ room, own, animateResult: previous?.room.result?.id === resultId ? previous.animateResult : animateResult }));
        }, error => { if (active) { setError(error.message); setSynced(false); } }, ready => { if (active) setSynced(ready); });
        stopPresence = watchPresence(roomId, user.uid, value => { if (active) setConnected(value); }, value => { if (active) setOnlinePlayers(value); });
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'เชื่อมต่อห้องไม่ได้'); }
    })();
    return () => { active = false; stopViews(); stopPresence(); window.removeEventListener('online', onNetwork); window.removeEventListener('offline', onNetwork); };
  }, [roomId]);
  const controlled = identity !== null && views?.own.controlClientId === identity.clientId;
  const available = connected && network && synced && !!views && views.room.revision >= minimumRevision && !!identity;
  const disabled = !available || !controlled || busy || !!pending;
  async function dispatch(command?: RoomCommandRequest['command']) {
    if (!identity || !views || !available || busyRef.current) return;
    if (!pending && !command) return;
    const request: PendingRequest = pending ?? {
      uid: identity.uid, path: '/api/rooms/command', body: { roomId, commandId: clientUuid(), clientId: identity.clientId,
        sessionGeneration: views.own.sessionGeneration, gameId: views.room.gameId, command },
    };
    busyRef.current = true; setBusy(true); setError(''); sessionStorage.setItem(PENDING_KEY, JSON.stringify(request));
    try {
      const receipt = await postRoom(request); setMinimumRevision(previous => Math.max(previous, receipt.revision)); sessionStorage.removeItem(PENDING_KEY); setPending(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ส่งคำสั่งไม่สำเร็จ');
      if (error instanceof ApiError && !error.uncertain && error.code !== 'OFFLINE') { sessionStorage.removeItem(PENDING_KEY); setPending(null); }
      else setPending(request);
    } finally { busyRef.current = false; setBusy(false); }
  }
  if (!views || !identity) return <RoomLoading error={error} />;
  const inviteLink=`${location.origin}/?room=${views.room.code}`;
  const copyLink=()=>{
    if (!navigator.clipboard) { setError('เลือกลิงก์ชวนเพื่อน แล้วคัดลอกด้วยเมนูของเครื่องได้'); return; }
    void navigator.clipboard.writeText(inviteLink).then(()=>setCopied(true)).catch(()=>setError('คัดลอกไม่ได้ เลือกลิงก์แล้วคัดลอกเองได้'));
  };
  return <RoomView room={views.room} own={views.own} playerId={identity.uid} onlinePlayers={onlinePlayers} animateResult={views.animateResult}
    state={{network,connected,synced,minimumRevision,busy,controlled,disabled,available,error,pending:!!pending,copied}}
    dispatch={dispatch} copyLink={copyLink} inviteLink={inviteLink}
    abortGame={()=>{if(window.confirm('ยุติเกมนี้โดยไม่มีผู้ชนะ? ทุกคนจะกลับมาเปิดเกมใหม่ได้'))void dispatch({type:'abortGame'});}} />;
}
