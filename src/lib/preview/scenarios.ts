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
  readonly width:'auto'|'360'|'390'|'430'|'1280';
}
export function parsePreviewOptions(values:Record<string,string|string[]|undefined>):PreviewOptions {
  return {
    scene:PREVIEW_SCENES.find(item=>item.id===values.scene)?.id ?? 'lobby',
    state:PREVIEW_STATES.find(item=>item.id===values.state)?.id ?? 'online',
    role:values.role==='sheriff'?'sheriff':'merchant',
    players:values.players==='5'?5:values.players==='6'?6:4,
    width:values.width==='360'||values.width==='390'||values.width==='430'||values.width==='1280'?values.width:'auto',
  };
}
export function previewQuery(options:PreviewOptions,frame=false) {
  const query=new URLSearchParams({scene:options.scene,role:options.role,players:String(options.players),state:options.state,width:options.width});
  if(frame)query.set('frame','1');
  return '/preview?'+query.toString();
}
export interface PreviewModel { readonly room:PublicRoomView; readonly own:PrivateRoomView; readonly playerId:string }

/** Synthetic views only. No room ID accepted by the live API; no Firebase or test-fixture imports. */
export function makePreviewModel(options:PreviewOptions,decision?:{merchantId:string;offerAmount:number}):PreviewModel {
  const rules=createRulesSnapshot();const ids=Array.from({length:options.players},(_,i)=>`preview-player-${i+1}`);
  const playerId=ids[options.role==='sheriff'?0:1];const merchantId=decision?.merchantId??ids[1];
  const lobby=options.scene==='lobby';const finished=options.scene==='game-over';const aborted=options.scene==='aborted';
  const resolving=options.scene.startsWith('pass-')||options.scene.startsWith('inspect-');
  const phase:Phase=lobby||aborted?'LOBBY':options.scene==='prepare'?'PREPARE':options.scene==='pack'?'PACK_AND_DECLARE':options.scene==='negotiate'?'NEGOTIATE':options.scene==='summary'?'ROUND_SUMMARY':finished?'GAME_OVER':'RESOLUTION';
  const names=['ฟิลด์ผู้ซื่อสัตย์','เมย์ตลาดเช้า','ต้นนักต่อรอง','ข้าวพ่อค้าผ้า','ฟ้าขนของ','นนท์ริมประตู'];
  let cardId=0;const cards=(products:readonly ProductId[]):CardInstance[]=>products.map(productId=>({instanceId:`preview-card-${++cardId}`,productId}));
  let finances=createFinancialState(ids,RULES.startingCash);let result:PublicDecision|null=null;
  const offerAmount=decision?.offerAmount??4;
  if(resolving||options.scene==='summary') {
    const contraband=options.scene.endsWith('contraband');const action=options.scene.startsWith('inspect-')?'INSPECT':'PASS';
    const resolved=resolveBag({cards:cards(contraband?['apple','moonshine','crossbow']:['apple','bread','cheese']),declaredProductId:'apple',
      action,merchantId,sheriffId:ids[0],offer:{submitted:true,amount:offerAmount,version:1},finances,rules});
    finances=resolved.finances;
    result={id:`preview-result-${options.scene}`,roundIndex:3,merchantId,sheriffId:ids[0],action,bagCount:resolved.bagCount,
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
    gameId:lobby||aborted?null:'00000000-0000-4000-8000-000000000001',roundIndex:lobby||aborted?0:finished?options.players*rules.sheriffTurnsPerPlayer:3,
    totalRounds:options.players*rules.sheriffTurnsPerPlayer,sheriffId:lobby||aborted?null:ids[0],
    selectedMerchantId:declared?merchantId:null,result:resolving?result:null,history:result?[result]:[],debts:finances.debts,
    scores:finished?scoreGame(stashes,finances,rules):null,
    players:ids.map((id,index)=>({id,displayName:names[index],avatarId:index,ready:lobby?id!==playerId:true,
      prepared:phase!=='PREPARE'&&phase!=='LOBBY',bagLocked:declared,
      declaration:declared&&index!==0?{productId:'apple',count:3}:null,
      offer:declared&&index!==0?{submitted:true,amount:id===merchantId?offerAmount:index%2===0?0:2,version:1}:null,
      decisionId:options.scene==='summary'&&index!==0?`preview-decision-${index}`:resolving&&id===merchantId?result!.id:null,
      cash:lobby?null:finances.cash[id]})),
  };
  const own:PrivateRoomView={revision:1,playerId,controlClientId:'preview-only-client',sessionGeneration:1,
    hand:cards(['apple','apple','bread','cheese','cloth','crossbow']),
    bag:declared&&playerId!==ids[0]&&!room.players.find(player=>player.id===playerId)?.decisionId?cards(['apple','bread','moonshine']):[],
    stash:stashes.find(player=>player.id===playerId)!.stash,
    declaration:room.players.find(player=>player.id===playerId)!.declaration,offer:room.players.find(player=>player.id===playerId)!.offer??{submitted:false,amount:0,version:0},
    prepared:phase!=='PREPARE'&&phase!=='LOBBY',goodsValue:stashes.find(player=>player.id===playerId)!.stash.reduce((sum,card)=>sum+rules.products[card.productId].value,0)};
  return {room,own,playerId};
}
