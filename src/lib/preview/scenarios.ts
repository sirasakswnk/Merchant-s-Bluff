import { createRulesSnapshot, PRODUCT_IDS, RULES } from '../game/config';
import { createFinancialState } from '../game/ledger';
import { resolveBag } from '../game/resolution';
import { scoreGame } from '../game/scoring';
import type { CardInstance, Phase, PlayerCount, ProductId } from '../game/types';
import type { PrivateRoomView, PublicDecision, PublicRoomView } from '../shared/rooms';

export const PREVIEW_SCENES = [
  { id:'lobby', label:'ล็อบบี้' }, { id:'prepare', label:'เตรียมสินค้า' },
  { id:'pack', label:'จัดกระเป๋า / แจ้งสินค้า' }, { id:'negotiate', label:'เจรจา / ยืนยันตัดสิน' },
  { id:'pass-legal', label:'ให้ผ่าน · ของถูกกฎหมาย' }, { id:'pass-contraband', label:'ให้ผ่าน · กระเป๋าเรืองแสง' },
  { id:'inspect-legal', label:'ตรวจ · จ่ายค่าชดเชย' }, { id:'inspect-contraband', label:'ตรวจ · ยึดของ / ค่าปรับ' },
  { id:'summary', label:'สรุปรอบ' }, { id:'game-over', label:'คะแนนสุดท้าย' }, { id:'aborted', label:'ยุติเกม' },
] as const;
export const PREVIEW_STATES = [
  { id:'online', label:'ปกติ' }, { id:'offline', label:'ออฟไลน์' }, { id:'readonly', label:'แท็บอ่านอย่างเดียว' },
  { id:'pending', label:'รอยืนยันผล / ลองใหม่' }, { id:'busy', label:'กำลังส่งคำสั่ง' },
  { id:'error', label:'ข้อความผิดพลาด' }, { id:'loading', label:'กำลังโหลดห้อง' },
] as const;
export type PreviewScene = typeof PREVIEW_SCENES[number]['id'];
export type PreviewState = typeof PREVIEW_STATES[number]['id'];
export interface PreviewOptions {
  readonly scene:PreviewScene; readonly role:'merchant'|'sheriff'; readonly players:PlayerCount; readonly state:PreviewState;
  readonly width:'auto'|'360'|'390'|'430'|'1280'|'1440';
}
export function parsePreviewOptions(values:Record<string,string|string[]|undefined>):PreviewOptions {
  return {
    scene:PREVIEW_SCENES.find(item=>item.id===values.scene)?.id ?? 'lobby',
    state:PREVIEW_STATES.find(item=>item.id===values.state)?.id ?? 'online',
    role:values.role==='sheriff'?'sheriff':'merchant',
    players:values.players==='5'?5:values.players==='6'?6:4,
    width:values.width==='360'||values.width==='390'||values.width==='430'||values.width==='1280'||values.width==='1440'?values.width:'auto',
  };
}
export function previewQuery(options:PreviewOptions,frame=false) {
  const query=new URLSearchParams({scene:options.scene,role:options.role,players:String(options.players),state:options.state,width:options.width});
  if(frame)query.set('frame','1');
  return '/preview?'+query.toString();
}
export interface PreviewModel { readonly room:PublicRoomView; readonly own:PrivateRoomView; readonly playerId:string }

/** Synthetic views only. No room ID accepted by the live API; no Firebase or test-fixture imports. */
export function makePreviewModel(options:PreviewOptions,decision?:{merchantId?:string;offerAmount?:number;sheriffId?:string;viewerId?:string;roundIndex?:number}):PreviewModel {
  const rules=createRulesSnapshot();const ids=Array.from({length:options.players},(_,i)=>`preview-player-${i+1}`);
  const playerId=decision?.viewerId&&ids.includes(decision.viewerId)?decision.viewerId:ids[options.role==='sheriff'?0:1];
  const sheriffId=decision?.sheriffId&&ids.includes(decision.sheriffId)?decision.sheriffId:ids[0];
  const merchantId=decision?.merchantId??(playerId!==sheriffId?playerId:ids.find(id=>id!==sheriffId)!);
  const roundIndex=decision?.roundIndex??3;
  const lobby=options.scene==='lobby';const finished=options.scene==='game-over';const aborted=options.scene==='aborted';
  const resolving=options.scene.startsWith('pass-')||options.scene.startsWith('inspect-');
  const phase:Phase=lobby||aborted?'LOBBY':options.scene==='prepare'?'PREPARE':options.scene==='pack'?'PACK_AND_DECLARE':options.scene==='negotiate'?'NEGOTIATE':options.scene==='summary'?'ROUND_SUMMARY':finished?'GAME_OVER':'RESOLUTION';
  const names=['ฟิลด์ผู้ซื่อสัตย์','เมย์ตลาดเช้า','ต้นนักต่อรอง','ข้าวพ่อค้าผ้า','ฟ้าขนของ','นนท์ริมประตู'];
  let cardId=0;const cards=(products:readonly ProductId[]):CardInstance[]=>products.map(productId=>({instanceId:`preview-card-${++cardId}`,productId}));
  let finances=createFinancialState(ids,RULES.startingCash);let result:PublicDecision|null=null;
  // Earlier rounds for the desktop ledger: every merchant decided, amounts come from the same pure resolveBag.
  // They use their own ledger so the sample money of the current scene stays as before.
  const earlier:PublicDecision[]=[];let pastFinances=createFinancialState(ids,RULES.startingCash);
  const playing=!lobby&&!aborted;const sheriffSeat=ids.indexOf(sheriffId);
  const pastBags:readonly {cards:readonly ProductId[];action:'PASS'|'INSPECT';offer:number}[]=[
    {cards:['bread','bread'],action:'PASS',offer:2},{cards:['cheese','moonshine'],action:'INSPECT',offer:0},
    {cards:['apple','apple','apple'],action:'INSPECT',offer:0},{cards:['cloth','crossbow'],action:'PASS',offer:5},
    {cards:['apple','cheese','cloth'],action:'PASS',offer:0}];
  const currentRound=finished?options.players*rules.sheriffTurnsPerPlayer+1:roundIndex;
  for(let round=Math.max(1,currentRound-2);playing&&round<currentRound;round++) {
    const roundsAgo=currentRound-round;
    const pastSheriff=ids[((sheriffSeat-roundsAgo)%ids.length+ids.length)%ids.length];
    ids.filter(id=>id!==pastSheriff).forEach((id,index)=>{
      const bag=pastBags[(index+round)%pastBags.length];
      const resolved=resolveBag({cards:cards(bag.cards),declaredProductId:'apple',action:bag.action,merchantId:id,sheriffId:pastSheriff,
        offer:{submitted:true,amount:bag.offer,version:1},finances:pastFinances,rules});
      pastFinances=resolved.finances;
      earlier.push({id:`preview-history-${round}-${id}`,roundIndex:round,merchantId:id,sheriffId:pastSheriff,action:bag.action,bagCount:resolved.bagCount,
        paymentKind:resolved.paymentKind,paymentAmount:resolved.paymentAmount,contrabandPassed:resolved.contrabandPassed,
        revealed:resolved.revealed?.map(card=>card.productId)??null,passed:bag.action==='INSPECT'?resolved.passed.map(card=>card.productId):null,
        confiscated:bag.action==='INSPECT'?resolved.confiscated.map(card=>card.productId):null});
    });
  }
  const offerAmount=decision?.offerAmount??4;
  if(resolving||options.scene==='summary') {
    const contraband=options.scene.endsWith('contraband');const action=options.scene.startsWith('inspect-')?'INSPECT':'PASS';
    const resolved=resolveBag({cards:cards(contraband?['apple','moonshine','crossbow']:['apple','bread','cheese']),declaredProductId:'apple',
      action,merchantId,sheriffId,offer:{submitted:true,amount:offerAmount,version:1},finances,rules});
    finances=resolved.finances;
    result={id:`preview-result-${options.scene}-${roundIndex}-${sheriffId}`,roundIndex,merchantId,sheriffId,action,bagCount:resolved.bagCount,
      paymentKind:resolved.paymentKind,paymentAmount:resolved.paymentAmount,contrabandPassed:resolved.contrabandPassed,
      revealed:resolved.revealed?.map(card=>card.productId)??null,passed:action==='INSPECT'?resolved.passed.map(card=>card.productId):null,
      confiscated:action==='INSPECT'?resolved.confiscated.map(card=>card.productId):null};
  }
  const stashes=ids.map((id,index)=>({id,stash:cards(Array.from({length:8+index},(_,i)=>PRODUCT_IDS[(i+index)%PRODUCT_IDS.length]))}));
  if(finished)finances={...finances,cash:{...finances.cash,[ids[0]]:RULES.startingCash*2,[ids[1]]:0},
    debts:[{id:'preview-debt',debtor:ids[1],creditor:ids[0],outstanding:rules.products.crossbow.fine,createdOrder:1}],nextOrder:2};
  const declared=phase==='NEGOTIATE'||phase==='RESOLUTION'||phase==='ROUND_SUMMARY';
  const room:PublicRoomView={rules,revision:1,roomId:'preview-only-room',code:'K7QM',hostId:ids[0],
    lifecycle:lobby?'LOBBY':finished?'FINISHED':aborted?'ABORTED':'PLAYING',phase,
    gameId:lobby||aborted?null:'00000000-0000-4000-8000-000000000001',roundIndex:lobby||aborted?0:finished?options.players*rules.sheriffTurnsPerPlayer:roundIndex,
    totalRounds:options.players*rules.sheriffTurnsPerPlayer,sheriffId:lobby||aborted?null:sheriffId,
    selectedMerchantId:declared?merchantId:null,result:resolving?result:null,history:result?[...earlier,result]:earlier,debts:finances.debts,
    scores:finished?scoreGame(stashes,finances,rules):null,
    // Sample supply: every card not shown in a sample hand or stash.
    supplyCount:lobby||aborted?null:rules.totalCards-ids.length*rules.handSize-stashes.reduce((sum,player)=>sum+player.stash.length,0),
    players:ids.map((id,index)=>({id,displayName:names[index],avatarId:index,ready:lobby?id!==playerId:true,
      prepared:phase!=='PREPARE'&&phase!=='LOBBY',bagLocked:declared,
      declaration:declared&&id!==sheriffId?{productId:'apple',count:3}:null,
      offer:declared&&id!==sheriffId?{submitted:true,amount:id===merchantId?offerAmount:index%2===0?0:2,version:1}:null,
      decisionId:options.scene==='summary'&&id!==sheriffId?`preview-decision-${index}`:resolving&&id===merchantId?result!.id:null,
      cash:lobby?null:finances.cash[id]})),
  };
  const own:PrivateRoomView={revision:1,playerId,controlClientId:'preview-only-client',sessionGeneration:1,
    hand:cards(['apple','apple','bread','cheese','cloth','crossbow']),
    bag:declared&&playerId!==sheriffId&&!room.players.find(player=>player.id===playerId)?.decisionId?cards(['apple','bread','moonshine']):[],
    stash:stashes.find(player=>player.id===playerId)!.stash,
    declaration:room.players.find(player=>player.id===playerId)!.declaration,offer:room.players.find(player=>player.id===playerId)!.offer??{submitted:false,amount:0,version:0},
    prepared:phase!=='PREPARE'&&phase!=='LOBBY',goodsValue:stashes.find(player=>player.id===playerId)!.stash.reduce((sum,card)=>sum+rules.products[card.productId].value,0)};
  return {room,own,playerId};
}
