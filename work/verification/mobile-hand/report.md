# ไพ่มือถือยื่นพ้นกล่องและปัดดู — 13 ตุลาคม 2026

## ปรับเพิ่มเติม — พัดโค้งบนมือถือ

ผู้ใช้ขอให้เรียงโค้งเหมือนถือไพ่บอร์ดเกม ปรับCSSมือถือให้ไพ่และพื้นที่แตะหมุนด้วยกันตามมุมของแต่ละใบ ไพ่กลางสูงกว่าปลายพัด และเพิ่มพื้นที่สำหรับปลายไพ่เอียง/การยกไพ่ คงขนาด132px ซ้อน24px ปัด/แตะเลือก/เพดานเดิม

ผลหลังปรับ: E2E **8/8ผ่านในชุดเดียว** (gesture6มุม prepare/pack×320/390/430 + regression touch24มุม/keyboard/ข้อความ200%/readonly/reduced motion2กรณี) ปัดซ้าย–ขวาไม่เลือกไพ่ แตะไพ่โผล่ริมจอและkeyboardเผยไพ่เต็มใบผ่าน ไม่พบaxe violationsหรือhorizontal page overflow ตรวจภาพปลายพัดทั้งสองด้านครบ3ขนาด พื้นที่ไพ่สูง336pxไม่มีvertical overflow Desktop1280ภาพเหมือนก่อนปรับทุกbyte ดู [curved-layout.json](curved-layout.json) ProductionbuildและTypeScriptผ่าน ภาพอยู่ `work/runtime/mobile-hand/curved-{320,390,430,1280}.png` และ `curved-right-{320,390,430}.png`

ส่วนนี้ตรวจUIด้วยChromiumจำลองtouch ไม่ได้รันเกมEmulatorsซ้ำหลังการเปลี่ยนCSS ผลเกม4คนด้านล่างเป็นหลักฐานขั้นก่อนหน้า ยังไม่ทดสอบโทรศัพท์จริง/Safari

## ประวัติ — เพิ่มการปัดมือไพ่

ผู้ใช้อนุมัติให้มือถือใช้ไพ่ใหญ่และปัดซ้าย–ขวาแทนพัดที่เบียดกัน เพิ่ม scroll container ใน MerchantHand และ CSS ของพื้นที่ไพ่ มือถือไม่เกิน600pxไพ่กว้าง132px ซ้อน24px ยื่นพ้นขอบpanelเต็มความกว้างจอ แตะเลือกแล้วยก32px/อยู่ด้านหน้า แตะซ้ำเอาออก ไพ่ที่แตะริมจอหรือรับkeyboard focusเลื่อนให้เห็นเต็มใบ การปัดใช้ native scrolling ไม่เปลี่ยนselectionหรือhand order Desktopยังใช้พัดเดิม

MerchantControlsยังถือdraft/limits/คำสั่งตามinstanceId ราคามาจากrules snapshot ไม่มีการเปลี่ยนengine/backend/data access/Firebase Rules/ราคา/ค่าปรับ/ชดเชย/360ใบ/rulesVersion0.2

## ผลตรวจสุดท้าย

- TypeScript, lint และ production build ผ่าน โดยbuildใช้outputแยกจากdev server
- E2E **11/11ผ่านในชุดเดียว**: merchant-hand3กรณี + mobile-hand6กรณี + Previewเดิม2กรณี
- Gesture6มุม: prepare/pack × 320/390/430px ด้วยChromium mobile/touch emulation และCDP touch input ปัดซ้าย/ขวาทั้งที่เลือกไพ่อยู่แล้วไม่เปลี่ยนselection แตะไพ่ที่โผล่ริมจอเลือก/เอาออกได้ เลือกใบสุดท้ายแล้วยกอยู่ด้านหน้า keyboard Shift+Tabเลื่อนเผยแต่ละใบ เลื่อนหน้าแนวตั้งผ่านพื้นที่ไพ่ได้ ไม่มีhorizontal page overflow ไพ่กว้าง132pxและviewportเต็มจอ
- Axeเฉพาะชุดไพ่ทั้ง6มุมไม่พบviolations พรีวิวไม่มีpageerror/API/Firebase requests
- Regression touch24มุม: prepare/pack × 4/5/6คน × 360/390/430/1280px เพดาน3/5 สินค้าเดียวกันต่างinstanceId เอาออก/เลือกใหม่ผ่าน Keyboard Space/Enter/Tab, ข้อความ200%, 320px, reduced motion และreadonly/busy/pending/offlineผ่าน
- Previewเดิมตรวจscene/role/count/state/iframe และไม่เขียนplayer storageผ่าน
- Desktop1280px: ภาพชุดไพ่ก่อนและหลังเหมือนทุกbyte ผล [desktop.json](desktop.json)
- ห้องจริง4browser contextsกับAuth/RTDB Emulators: พ่อค้าทุกรายแลก3ใบ ขน5ใบ แจ้งbread ให้ผ่านครบหนึ่งรอบ/เริ่มรอบ2 ร่างและคำแจ้งอยู่หลังreloadทั้งprepare/pack cardIdsที่APIรับตรงselectionและbagจริง
- Inventory10จุด total360/unique360/IDs/รายชนิดครบ seatOrderคงเดิม ล้างเฉพาะfixture1ห้อง4anonymous users

Gestureผลแยกอยู่ `gestures-{prepare,pack}-{320,390,430}.json` ผลเดิมที่รันใหม่อยู่ [touch.json](touch.json) และ [live-4-player.json](live-4-player.json) ภาพselected-320/390/430แสดงscroll viewportเต็มจอ Raw Playwright reportอยู่ `work/runtime/mobile-hand/e2e.json` รายงานและภาพขั้นพัดก่อนหน้าใน `work/verification/merchant-hand` คงไว้เป็นประวัติ

ตรวจด้วยChromiumจำลองขนาดจอและtouch ยังไม่ทดสอบโทรศัพท์จริง/SafariหรือFirebaseจริงในขั้นนี้ ไม่มีcommit/push/deploy
