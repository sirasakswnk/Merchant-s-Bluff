'use client';
import { useState } from 'react';
import { RoomLoading, RoomView, type RoomViewState } from '../room-view';
import { makePreviewModel, previewQuery, type PreviewOptions, type PreviewScene } from '@/lib/preview/scenarios';
import type { RoomCommandRequest } from '@/lib/shared/rooms';

export function RoomPreview({options}:{options:PreviewOptions}) {
  const [model,setModel]=useState(()=>makePreviewModel(options));
  const [displayState,setDisplayState]=useState(options.state);const [notice,setNotice]=useState('');
  const [replay,setReplay]=useState(0);const [copied,setCopied]=useState(false);
  const [resetKey,setResetKey]=useState(0);
  const {room,own,playerId}=model;
  const available=displayState!=='offline'&&displayState!=='loading';const busy=displayState==='busy';
  const controlled=displayState!=='readonly';const pending=displayState==='pending';
  const state:RoomViewState={network:displayState!=='offline',connected:displayState!=='offline',synced:true,minimumRevision:0,busy,controlled,
    disabled:!available||busy||!controlled||pending,available,error:displayState==='error'?'ตัวอย่างข้อความผิดพลาด: ส่งคำสั่งไม่ได้ ข้อมูลที่กรอกยังอยู่':'',pending,copied};
  function changeScene(scene:PreviewScene,sheriffId=room.sheriffId,roundIndex=room.roundIndex) {setModel(makePreviewModel({...options,scene},{sheriffId:sheriffId??undefined,viewerId:playerId,roundIndex}));setNotice('เปลี่ยนเฉพาะหน้าจอตัวอย่าง');}
  function rotateSheriff() {
    const next=room.players[(room.players.findIndex(player=>player.id===room.sheriffId)+1)%room.players.length].id;
    setModel(makePreviewModel(options,{sheriffId:next,viewerId:playerId,roundIndex:room.roundIndex%room.totalRounds+1}));setNotice('เปลี่ยนนายด่านเฉพาะตัวอย่าง · ที่นั่งของคุณยังอยู่ล่าง');setReplay(value=>value+1);
  }
  async function dispatch(command?:RoomCommandRequest['command']) {
    if(!command){setDisplayState('online');setNotice('ตัวอย่างผลลองใหม่: กลับมาพร้อมใช้งาน');return;}
    if(command.type==='claimControl'||command.type==='claimHost'){setDisplayState('online');setNotice('ตัวอย่าง: ใช้แท็บนี้ควบคุม');return;}
    if(command.type==='setReady'){setModel(previous=>({...previous,room:{...previous.room,players:previous.room.players.map(player=>player.id===playerId?{...player,ready:command.ready}:player)}}));return;}
    if(command.type==='selectMerchant'){setModel(previous=>({...previous,room:{...previous.room,selectedMerchantId:command.merchantId}}));return;}
    if(command.type==='setOffer'){
      const offer={submitted:true,amount:command.amount,version:own.offer.version+1};
      setModel(previous=>({...previous,room:{...previous.room,players:previous.room.players.map(player=>player.id===playerId?{...player,offer}:player)},own:{...previous.own,offer}}));return;
    }
    if(command.type==='resolveMerchant'){
      const target=room.players.find(player=>player.id===command.merchantId)!;
      setModel(makePreviewModel({...options,scene:command.action==='PASS'?'pass-contraband':'inspect-contraband'},{merchantId:target.id,offerAmount:target.offer?.amount??0,sheriffId:room.sheriffId??undefined,viewerId:playerId,roundIndex:room.roundIndex}));
      setNotice('ผลตัวอย่างสำหรับตรวจดีไซน์');setReplay(value=>value+1);return;
    }
    if(command.type==='startGame'){changeScene('prepare');return;}
    if(command.type==='prepareGoods'){changeScene('pack');return;}
    if(command.type==='lockBag'){
      const next=makePreviewModel({...options,scene:'negotiate'},{sheriffId:room.sheriffId??undefined,viewerId:playerId,roundIndex:room.roundIndex});
      const bag=own.hand.filter(card=>command.cardIds.includes(card.instanceId));
      const declaration={productId:command.declaredProductId,count:bag.length};const offer={submitted:false,amount:0,version:0};
      setModel({...next,own:{...next.own,hand:own.hand.filter(card=>!command.cardIds.includes(card.instanceId)),bag,declaration,offer},
        room:{...next.room,players:next.room.players.map(player=>player.id===playerId?{...player,declaration,offer}:player)}});
      setNotice('เปลี่ยนเฉพาะหน้าจอตัวอย่าง');return;
    }
    if(command.type==='acknowledgeResolution'){changeScene('summary');return;}
    if(command.type==='endRound'){const next=room.players[(room.players.findIndex(player=>player.id===room.sheriffId)+1)%room.players.length].id;changeScene('prepare',next,room.roundIndex%room.totalRounds+1);return;}
    if(command.type==='requestRematch'){changeScene('lobby');return;}
    setNotice('ปุ่มนี้ใช้ตรวจหน้าตาเท่านั้น');
  }
  return <div className="preview-frame-page">
    <div className="preview-frame-note"><strong>ตัวอย่างดีไซน์ · ไม่มีห้องจริง</strong><div className="preview-frame-actions">
      <button type="button" className="secondary" onClick={()=>{setModel(makePreviewModel(options));setDisplayState(options.state);setNotice('');setCopied(false);setReplay(value=>value+1);setResetKey(value=>value+1);}}>รีเซ็ตตัวอย่าง</button>
      {room.lifecycle==='PLAYING'?<button type="button" className="secondary" onClick={rotateSheriff}>เปลี่ยนนายด่านตัวอย่าง</button>:null}
      {room.result?.contrabandPassed? <button type="button" className="secondary" onClick={()=>setReplay(value=>value+1)}>เล่นเอฟเฟกต์ซ้ำ</button>:null}
    </div>{notice?<p role="status">{notice}</p>:null}</div>
    {displayState==='loading'?<RoomLoading homeHref={previewQuery({...options,scene:'lobby',state:'online'},true)} />:
      <RoomView key={resetKey} room={room} own={own} playerId={playerId}
        onlinePlayers={new Set(room.players.filter((_,index)=>index!==room.players.length-1||displayState!=='offline').map(player=>player.id))}
        animateResult={true} state={state} dispatch={dispatch} resultReplayKey={replay} persistDraft={false}
        inviteLink="/preview?scene=lobby" homeHref={previewQuery({...options,scene:'lobby',state:'online'},true)}
        copyLink={()=>{setCopied(true);setNotice('ตัวอย่างข้อความหลังคัดลอกลิงก์');}} abortGame={()=>changeScene('aborted')} />}
  </div>;
}
