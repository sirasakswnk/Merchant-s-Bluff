'use client';
import Link from 'next/link';
import { GAME_NAME } from '@/lib/game/config';
import type { PrivateRoomView, PublicRoomView, RoomCommandRequest } from '@/lib/shared/rooms';
import { LobbyView } from './lobby/lobby-view';
import { GameTableView } from './table/game-table-view';

export interface RoomViewState {
  readonly network:boolean; readonly connected:boolean; readonly synced:boolean; readonly minimumRevision:number;
  readonly busy:boolean; readonly controlled:boolean; readonly disabled:boolean; readonly available:boolean;
  readonly error:string; readonly pending:boolean; readonly copied:boolean;
}
export interface RoomViewProps {
  readonly room:PublicRoomView; readonly own:PrivateRoomView; readonly playerId:string;
  readonly onlinePlayers:ReadonlySet<string>; readonly animateResult:boolean; readonly state:RoomViewState;
  readonly dispatch:(command?:RoomCommandRequest['command'])=>Promise<void>;
  readonly copyLink:()=>void; readonly abortGame:()=>void; readonly inviteLink:string;
  readonly homeHref?:string; readonly persistDraft?:boolean; readonly resultReplayKey?:number;
}
export function RoomLoading({error='',homeHref='/'}:{error?:string;homeHref?:string}) {
  return <main id="main" tabIndex={-1} className="loading-page"><h1>{GAME_NAME}</h1><p aria-live="polite">กำลังเชื่อมต่อห้อง…</p>{error ? <p role="alert" className="notice">{error}</p> : null}<Link className="button secondary" href={homeHref}>กลับหน้าแรก</Link></main>;
}
/** Shared presentation. All network/storage actions are supplied by the caller. */
export function RoomView(props: RoomViewProps) {
  return props.room.lifecycle === 'LOBBY' ? <LobbyView {...props} /> : <GameTableView {...props} />;
}
