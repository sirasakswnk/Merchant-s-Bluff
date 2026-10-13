import { test, expect, type Page } from '@playwright/test';
import { PREVIEW_SCENES, PREVIEW_STATES } from '../../src/lib/preview/scenarios';
import { showHandCard } from './helpers/hand';

async function frameLoaded(page:Page,scene:string) {
  await expect.poll(()=>page.frames().find(frame=>new URL(frame.url()||'about:blank').searchParams.get('frame')==='1')?.url()).toContain(`scene=${scene}`);
  return page.frameLocator('iframe[title="ตัวอย่างหน้าจอ Merchant’s Bluff"]');
}

test('preview controls use shared room screens without Firebase, API commands or player-storage writes',async({page,context})=>{
  test.setTimeout(90000);
  const forbidden:string[]=[];
  context.on('request',request=>{const url=new URL(request.url());if(url.pathname.startsWith('/api/')||['19000','19099'].includes(url.port)||/firebaseio|firebasedatabase|identitytoolkit|securetoken/.test(url.hostname))forbidden.push(url.pathname);});
  await page.addInitScript(()=>{
    const target=window.top as Window&{previewStorageWrites?:string[]};
    if(window===window.top){localStorage.setItem('merchant-active-room','preserve-active-room');sessionStorage.setItem('merchant-pending-request','preserve-pending');sessionStorage.setItem('merchant-draft:real-room','preserve-draft');target.previewStorageWrites=[];}
    for(const method of ['setItem','removeItem'] as const){const original=Storage.prototype[method];Storage.prototype[method]=function(key:string,value?:string){if(key.startsWith('merchant-'))target.previewStorageWrites?.push(method+':'+key);return method==='setItem'?(original as typeof Storage.prototype.setItem).call(this,key,value!):(original as typeof Storage.prototype.removeItem).call(this,key);};}
    const clear=Storage.prototype.clear;Storage.prototype.clear=function(){target.previewStorageWrites?.push('clear');return clear.call(this);};
  });
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/preview?scene=pack&width=390');
  await expect(page.getByRole('heading',{name:'พรีวิวหน้าจอเกม',exact:true})).toBeVisible();
  const initialFrame=await frameLoaded(page,'pack');
  await expect.poll(()=>initialFrame.locator('.preview-frame-page').evaluate(element=>Math.ceil(element.getBoundingClientRect().height)<=innerHeight)).toBe(true);
  await page.getByLabel('หน้าจอ',{exact:true}).selectOption('pack');let frame=await frameLoaded(page,'pack');
  await expect(frame.locator('main')).toHaveAttribute('data-phase','PACK_AND_DECLARE');
  await expect.poll(()=>frame.locator('.preview-frame-page').evaluate(element=>Math.ceil(element.getBoundingClientRect().height)<=innerHeight)).toBe(true);
  await showHandCard(frame,0);await frame.locator('button.card').first().click();await expect(frame.locator('button.card').first()).toHaveAttribute('aria-pressed','true');
  await frame.getByRole('button',{name:'ปิดกระเป๋าและยืนยัน',exact:true}).click();await expect(frame.locator('main')).toHaveAttribute('data-phase','NEGOTIATE');
  await expect(frame.getByText('แจ้งสินค้า แอปเปิล 1 ใบ',{exact:true})).toBeVisible();
  await page.getByLabel('หน้าจอ',{exact:true}).selectOption('negotiate');await page.getByLabel('มุมมอง',{exact:true}).selectOption('sheriff');frame=await frameLoaded(page,'negotiate');
  await expect(frame.locator('main')).toHaveAttribute('data-own-role','sheriff');
  await frame.getByRole('button',{name:/^ให้ผ่าน · รับ \d+ เหรียญ$/}).click();await expect(frame.getByRole('heading',{name:/ยืนยันให้ผ่าน/})).toBeVisible();
  await frame.getByRole('button',{name:'ยืนยันให้ผ่าน',exact:true}).click();await expect(frame.locator('main')).toHaveAttribute('data-phase','RESOLUTION');
  await expect(frame.locator('.result-bag')).toHaveClass(/glow/);await frame.getByRole('button',{name:'เล่นเอฟเฟกต์ซ้ำ',exact:true}).click();
  await frame.getByRole('button',{name:'รีเซ็ตตัวอย่าง',exact:true}).click();await expect(frame.locator('main')).toHaveAttribute('data-phase','NEGOTIATE');
  expect(await page.evaluate(()=>(window as Window&{previewStorageWrites?:string[]}).previewStorageWrites)).toEqual([]);
  await page.reload();await expect(page.getByLabel('หน้าจอ',{exact:true})).toHaveValue('negotiate');await expect(page.getByLabel('มุมมอง',{exact:true})).toHaveValue('sheriff');
  expect(await page.evaluate(()=>[localStorage.getItem('merchant-active-room'),sessionStorage.getItem('merchant-pending-request'),sessionStorage.getItem('merchant-draft:real-room')])).toEqual(['preserve-active-room','preserve-pending','preserve-draft']);
  expect(forbidden).toEqual([]);expect(errors).toEqual([]);
});

test('preview renders all scenes and viewpoints, 4/5/6 players, state presets and actual iframe widths',async({page,context})=>{
  test.setTimeout(120000);
  const errors:string[]=[];context.on('page',child=>child.on('pageerror',error=>errors.push(error.message)));page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/preview');
  for(const role of ['merchant','sheriff']){
    await page.getByLabel('มุมมอง',{exact:true}).selectOption(role);
    for(const scene of PREVIEW_SCENES){
      await page.getByLabel('หน้าจอ',{exact:true}).selectOption(scene.id);const frame=await frameLoaded(page,scene.id);
      await expect(frame.getByText('ตัวอย่างดีไซน์ · ไม่มีห้องจริง',{exact:true})).toBeVisible();
      const phase=scene.id==='lobby'||scene.id==='aborted'?'LOBBY':scene.id==='prepare'?'PREPARE':scene.id==='pack'?'PACK_AND_DECLARE':scene.id==='negotiate'?'NEGOTIATE':scene.id==='summary'?'ROUND_SUMMARY':scene.id==='game-over'?'GAME_OVER':'RESOLUTION';
      await expect(frame.locator('main')).toHaveAttribute('data-phase',phase);
      await expect(frame.locator('main')).toHaveAttribute('data-own-role',role==='sheriff'&&phase!=='LOBBY'?'sheriff':'merchant');
      if(scene.id==='game-over')await expect(frame.locator('.scores .player')).toHaveCount(4);
      if(scene.id==='pass-contraband')await expect(frame.locator('.result-bag')).toHaveClass(/glow/);
    }
  }
  await page.getByLabel('หน้าจอ',{exact:true}).selectOption('game-over');
  for(const count of ['4','5','6']){await page.getByLabel('จำนวนผู้เล่น',{exact:true}).selectOption(count);const frame=await frameLoaded(page,'game-over');await expect(frame.locator('.players .player')).toHaveCount(Number(count));await expect(frame.locator('.scores .player')).toHaveCount(Number(count));}
  await page.getByLabel('หน้าจอ',{exact:true}).selectOption('pack');await page.getByLabel('มุมมอง',{exact:true}).selectOption('merchant');
  for(const state of PREVIEW_STATES){
    await page.getByLabel('สถานะ',{exact:true}).selectOption(state.id);const frame=await frameLoaded(page,'pack');
    if(state.id==='loading')await expect(frame.getByText('กำลังเชื่อมต่อห้อง…',{exact:true})).toBeVisible();
    else {await expect(frame.locator('main')).toHaveAttribute('data-phase','PACK_AND_DECLARE');if(state.id==='readonly')await expect(frame.getByRole('button',{name:'ใช้แท็บนี้ควบคุม',exact:true})).toBeVisible();if(state.id==='pending')await expect(frame.getByRole('button',{name:'ลองคำสั่งเดิมอีกครั้ง',exact:true})).toBeVisible();}
  }
  await page.getByLabel('สถานะ',{exact:true}).selectOption('online');
  for(const width of ['360','390','430','1280']){
    await page.getByLabel('ขนาดหน้าจอ',{exact:true}).selectOption(width);const frame=await frameLoaded(page,'pack');
    await expect.poll(()=>frame.locator('body').evaluate(()=>innerWidth)).toBe(Number(width));
    expect(await frame.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.setViewportSize({width:360,height:740});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/preview?frame=1&scene=invalid&role=invalid&players=99');await expect(page.locator('main')).toHaveAttribute('data-phase','LOBBY');await expect(page.locator('.players .player')).toHaveCount(4);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);expect(errors).toEqual([]);
});
