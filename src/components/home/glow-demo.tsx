'use client';
import { useEffect, useRef, useState } from 'react';
import { HomeIcon } from './art';

export function HomeGlowDemo() {
  const stageRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [result, setResult] = useState<'contra' | 'legal' | null>(null);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function preview(contraband: boolean) {
    if (busy.current || !stageRef.current) return;
    timers.current.forEach(clearTimeout); timers.current = [];
    busy.current = true; const stage = stageRef.current;
    stage.style.setProperty('--travel', Math.max(80, stage.clientWidth - 72 - 16 - 84) + 'px');
    stage.className = 'glow-stage'; void stage.offsetWidth;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { if (contraband) stage.classList.add('is-flagged'); }
    else stage.classList.add(contraband ? 'is-glowing' : 'is-moving');
    setResult(contraband ? 'contra' : 'legal');
    timers.current.push(setTimeout(() => { stage.className = 'glow-stage'; busy.current = false; }, 1600));
    timers.current.push(setTimeout(() => setResult(null), 3600));
  }
  return <div className="glow-demo tile" aria-labelledby="glow-title">
    <h3 id="glow-title">ของต้องห้ามที่หลุดผ่านด่าน</h3>
    <p>ถ้านายด่านให้ผ่านแล้วในกระเป๋ามีของต้องห้าม กระเป๋าจะเรืองแสงแดงให้ทุกคนเห็น แต่ไม่บอกว่ามีกี่ใบหรือเป็นอะไร</p>
    <div className="glow-stage" ref={stageRef}><HomeIcon name="bag" className="bag-art" /><HomeIcon name="crate" className="crate" /></div>
    <p className="glow-msg" role="status" aria-live="polite">{result ? <span className={`badge${result === 'legal' ? ' badge-plain' : ''}`}>{result === 'contra' ? 'มีของต้องห้ามผ่านด่าน!' : 'ผ่านด่าน'}</span> : null}</p>
    <div className="glow-actions"><button type="button" className="btn btn-dark" onClick={() => preview(true)}>ให้ผ่าน: มีของต้องห้าม</button><button type="button" className="btn btn-dark" onClick={() => preview(false)}>ให้ผ่าน: ของถูกกฎหมายล้วน</button></div>
  </div>;
}
