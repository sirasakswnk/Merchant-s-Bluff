# มือไพ่เคลื่อนตามครึ่งวงกลม — 13 ตุลาคม 2026

ผู้ใช้อนุมัติการเคลื่อนแบบตัวอย่าง `work/design/semicircle-hand-motion.html` ใช้กับMerchantHandในช่วงแลกไพ่และจัดกระเป๋า ทั้งห้องจริงและพรีวิว มือถือ≤600pxใช้ไพ่132×192pxที่มีจุดหมุนร่วมใต้ขอบจอ ปัดแล้วตำแหน่งและมุมเปลี่ยนพร้อมกัน ปล่อยแล้วชะลอ320msเข้าสู่ใบกลางที่ตั้งตรง มีแรงเฉื่อยจำกัดและหยุดที่หัว/ท้ายมือ ไพ่ยื่นพ้นpanelเต็มความกว้างจอ

แยกmotionในuseArcHand ขนาดจริง/resize/ข้อความ200%ถูกวัดใหม่ การเคลื่อนไหวถี่ใช้refs/CSS variables/requestAnimationFrame Reactอัปเดตเมื่อใบกลางเปลี่ยน ล้างframe/observer/media listeners/pointer captureเมื่อเลิกใช้ เลือกตามinstanceIdผ่านguardเดิม เพดาน3/5และdisabledเดิม ไพ่เลือกยก32pxตามรัศมี การปัดไม่เลือก Touchใช้ตำแหน่งไพ่ที่มองเห็นเพื่อกันbrowserปรับtapไปneighborและระงับnativeclickซ้ำ Keyboardยังใช้nativeclick ปุ่ม44pxก่อน/ถัดไปและTab/ลูกศร/Home/Endเข้าถึงทุกใบ

คงdesktopและtexture/artเดิม แก้shared reduced-motion hover ruleให้ไม่ล้างตำแหน่งไพ่ Motionไม่มีAPI/Firebase/storage/คำสั่งเกม MerchantControlsยังถือdraft/declaration/sendเดิม ไม่แก้engine/backend/data access/Firebase Rules/ราคา/ค่าปรับ/ชดเชย/360ใบ/rulesVersion0.2

## ผลตรวจสุดท้าย

- TypeScript, lint และproduction buildผ่าน buildใช้outputแยกจากdev server
- E2E **11/11ผ่านในชุดเดียว**: merchant-hand3 + mobile-hand6 + Previewเดิม2
- Motion6มุม prepare/pack×320/390/430pxใช้Chromium mobile/touchและCDP touch input ติดตามตำแหน่งrenderจริงระหว่างปัดแล้วfitวงกลมเดียวกัน ทุกจุดคลาดเคลื่อนต่ำกว่า1px ไพ่ผ่านจุดสูงตรงกลางแล้วลงอีกด้าน มุมเปลี่ยนพร้อมตำแหน่งและsnapหยุด
- ปัดซ้าย/ขวาขณะมีselectionไม่เปลี่ยนIDs แตะใบที่โผล่ริมจอเลือกใบที่เห็นและเผยเต็มใบได้ เลือกใบสุดท้ายแล้วยกและอยู่ด้านหน้า Keyboardเผยทุกใบและปุ่มหัว/ท้ายdisabled เลื่อนหน้าแนวตั้งบนพื้นที่ไพ่ได้ ไม่มีhorizontal page overflowหรือaxe violationsในชุดไพ่ทั้ง6มุม
- Touch regression24มุม: prepare/pack×4/5/6คน×360/390/430/1280px เลือกสินค้าเดียวกันต่างinstanceId/เพดาน3และ5/เอาออกเลือกใหม่ผ่าน ชุด24มุมใช้reduced motionเพื่อตรวจselection ขณะที่ชุดgesture6มุมตรวจmotionปกติ
- Keyboard Space/Enter/Tab, reduced motion, ข้อความ200%, 320px และreadonly/busy/pending/offlineผ่าน
- Previewเดิมทุกscene/role/count/state/iframeผ่าน ไม่มีAPI/Firebase requestsหรือการเขียนplayer storage และไม่มีpageerror
- Desktop1280pxภาพชุดไพ่ก่อนและหลังเหมือนทุกbyte ผล [desktop.json](desktop.json)
- เกมจริง4browser contextsกับAuth/RTDB Emulatorsเปิดtouch พ่อค้าทุกรายtapเลือกแลก3ใบ ขน5ใบ แจ้งbread ให้ผ่านครบหนึ่งรอบ/เข้าสู่รอบ2 ร่างและคำแจ้งอยู่หลังreloadทั้งสองเฟส คำสั่งAPIรับcardIdsตรงselectionและbagจริง
- Inventory10จุด total360/unique360/IDs/รายชนิดครบ seatOrderเดิม ล้างเฉพาะfixture1ห้อง4anonymous users

ผลgestureอยู่ `gestures-{prepare,pack}-{320,390,430}.json` ผลselectionอยู่ [touch.json](touch.json) เกมจริงอยู่ [live-4-player.json](live-4-player.json) ภาพselected-320/390/430/1280และtext-200อยู่ในโฟลเดอร์นี้และถูกignore Raw Playwright reportอยู่ `work/runtime/arc-hand/e2e.json` รายงานขั้นก่อนหน้าใน `work/verification/mobile-hand` คงไว้เป็นประวัติ

ตรวจด้วยChromiumจำลองtouch/ขนาดจอ ยังไม่ทดสอบโทรศัพท์จริง/SafariหรือFirebaseจริงในขั้นนี้ ไม่มีcommit/push/deploy
