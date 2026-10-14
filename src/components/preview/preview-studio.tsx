'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PREVIEW_SCENES, PREVIEW_STATES, previewQuery, type PreviewOptions } from '@/lib/preview/scenarios';

export function PreviewStudio({initialOptions}:{initialOptions:PreviewOptions}) {
  const [options,setOptions]=useState(initialOptions);const [reset,setReset]=useState(0);
  const [frameHeight,setFrameHeight]=useState(900);const observerRef=useRef<ResizeObserver|null>(null);
  const popupObserverRef=useRef<MutationObserver|null>(null);
  const frameRef=useRef<HTMLIFrameElement|null>(null);
  const fitFrame=useCallback(()=>{
    observerRef.current?.disconnect();
    popupObserverRef.current?.disconnect();
    const content=frameRef.current?.contentDocument?.querySelector('.preview-frame-page');
    if(!content)return;
    const fit=()=>setFrameHeight(content.querySelector('[data-sheriff-popup]')
      ? window.innerHeight : Math.max(520,Math.ceil(content.getBoundingClientRect().height)));
    observerRef.current=new ResizeObserver(fit);observerRef.current.observe(content);fit();
    let visiblePopup:Element|null=null;
    const revealPopup=()=>{
      const popup=content.querySelector('[data-sheriff-popup][open]');
      fit();
      if(popup&&popup!==visiblePopup)frameRef.current?.scrollIntoView({block:'start',inline:'nearest'});
      visiblePopup=popup;
    };
    popupObserverRef.current=new MutationObserver(revealPopup);
    popupObserverRef.current.observe(content,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});revealPopup();
  },[]);
  useEffect(()=>{fitFrame();window.addEventListener('resize',fitFrame);return ()=>{observerRef.current?.disconnect();popupObserverRef.current?.disconnect();window.removeEventListener('resize',fitFrame);};},[fitFrame]);
  function update(values:Partial<PreviewOptions>) {
    const next={...options,...values};setOptions(next);window.history.replaceState(null,'',previewQuery(next));
  }
  return <main id="main" tabIndex={-1} className="preview-studio">
    <header className="preview-heading"><div><p className="eyebrow">Merchant’s Bluff</p><h1>พรีวิวหน้าจอเกม</h1><p>เลือกดูทุกเฟสได้ทันที ปุ่มในตัวอย่างเปลี่ยนเฉพาะภาพ ไม่มีการสร้างห้องหรือบันทึกเกม</p></div><Link className="button secondary" href="/">ดูหน้าแรก</Link></header>
    <section className="preview-toolbar" aria-label="ตั้งค่าพรีวิว">
      <label>หน้าจอ<select aria-label="หน้าจอ" value={options.scene} onChange={event=>update({scene:event.target.value as PreviewOptions['scene']})}>{PREVIEW_SCENES.map(scene=><option key={scene.id} value={scene.id}>{scene.label}</option>)}</select></label>
      <label>มุมมอง<select aria-label="มุมมอง" value={options.role} onChange={event=>update({role:event.target.value as PreviewOptions['role']})}><option value="merchant">พ่อค้า / สมาชิก</option><option value="sheriff">นายด่าน / ผู้จัดห้อง</option></select></label>
      <label>จำนวนผู้เล่น<select aria-label="จำนวนผู้เล่น" value={options.players} onChange={event=>update({players:Number(event.target.value) as PreviewOptions['players']})}>{[4,5,6].map(count=><option key={count} value={count}>{count} คน</option>)}</select></label>
      <label>สถานะ<select aria-label="สถานะ" value={options.state} onChange={event=>update({state:event.target.value as PreviewOptions['state']})}>{PREVIEW_STATES.map(state=><option key={state.id} value={state.id}>{state.label}</option>)}</select></label>
      <label>ขนาดหน้าจอ<select aria-label="ขนาดหน้าจอ" value={options.width} onChange={event=>update({width:event.target.value as PreviewOptions['width']})}><option value="auto">พอดีกับหน้าต่าง</option>{[360,390,430,1280,1440].map(width=><option key={width} value={width}>{width} px</option>)}</select></label>
      <div className="preview-toolbar-actions"><button type="button" className="secondary" onClick={()=>setReset(value=>value+1)}>โหลดตัวอย่างใหม่</button><Link className="button secondary" href={previewQuery(options,true)} target="_blank" rel="noopener">เปิดตัวอย่างเต็มหน้า</Link></div>
    </section>
    <div className="preview-canvas"><iframe ref={frameRef} key={reset} title="ตัวอย่างหน้าจอ Merchant’s Bluff" src={previewQuery(options,true)} style={{width:options.width==='auto'?'100%':Number(options.width)}} height={frameHeight} onLoad={fitFrame} /></div>
    <p className="preview-caption">พรีวิวใช้หน้าจอเดียวกับเกมจริง ข้อมูลทั้งหมดเป็นตัวอย่าง · สำรับ 360 ใบ · เลือกเฟสใหม่ได้จากแถบด้านบน</p>
  </main>;
}
