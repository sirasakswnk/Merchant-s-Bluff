# ล็อบบี้โต๊ะกลม — 12 ตุลาคม 2026

ทำตามขอบเขตที่ผู้ใช้เลือก: เฉพาะล็อบบี้ก่อนเกม โต๊ะไม้กลม ตัวละครที่เลือกจริง ผู้ชมอยู่ล่าง พร้อมสถานะ/ผู้จัดห้อง รหัสและเชิญเหนือโต๊ะ พร้อมใต้ตัวเอง เริ่มกลางโต๊ะ ดู [ข้อกำหนดดีไซน์](../../../docs/lobby-design.md)

## การแยกส่วน

LobbyView เป็น presentation ของ RoomView ทั้งเกมจริงและ `/preview` ลำดับที่นั่งสำหรับวาดอยู่ใน components/lobby/seats.ts ใช้สำเนา array ไม่เปลี่ยน seatOrder จริง Avatar ใช้ artwork ที่นำเข้าจาก home.html เดิม CSS Modules และฟอนต์จำกัดไว้ที่ล็อบบี้ แยก RoomStatus จาก markup เดิมเพื่อใช้สถานะผิดพลาด/pending/control ร่วมกัน

ไม่แก้ src/lib/game/server/client/shared, Firebase Rules, ราคา/ค่าปรับ/ชดเชย, สำรับ360หรือ rulesVersion0.2 หน้า PLAYING/ABORTED/FINISHED ยังใช้ renderer/controls เดิม ไม่ทำตำแหน่งนายด่านบนหรือ animation เปลี่ยนรอบในขั้นนี้

## ผลตรวจ

ผลรวมที่ตรวจจากรายงานรอบสุดท้ายอยู่ [validation.json](validation.json) รวมการตรวจsource/client bundleไม่พบAdmin key/email/Cron secret

- TypeScript, ESLint, production build ผ่าน (buildมี `/preview` และ `/room/[roomId]` ไม่ใช่การ deploy)
- E2E5กรณีผ่านในรอบสุดท้ายเดียวกัน: lobby2 + preview2 + M4home/lobby-rules1
- Layout24กรณี: 4/5/6ผู้เล่น × สมาชิก/ผู้จัดห้อง × 360/390/430/1280px โต๊ะกว้าง=สูง ผู้ชมล่าง avatarIdตรง โปรไฟล์ไม่ซ้อนและไม่ล้นแนวนอน
- ล็อบบี้ชุดสีปกติ axe WCAG2/2.1/2.2 A/AAไม่พบ violations ที่4ขนาด ตรวจปุ่ม/summary/link44px, keyboardพร้อม/ยกเลิก, enlarged text200%, 320px reflow และ reduced-motion ผ่าน
- สถานะ offline/read-only/pending/busy/error ปิด actions/เปิด retry/control ถูกต้อง และ offlineมีเครื่องหมายประกอบ ไม่พึ่งสีอย่างเดียว Previewไม่เรียกAPI/Firebaseและยังคง isolation/storage checks จากงานก่อน
- ห้องจริงผ่าน Next → API → local Auth/RTDB Emulators: 6browser contexts ชื่อ16ตัว อวาตาร์2–7 ตั้งแต่1คนจน6คน เห็นข้อมูลพร้อม realtime กดยกเลิก โหลดใหม่ที่นั่งเดิม ออฟไลน์ปิดคำสั่ง แล้วทุกคนพร้อม/เริ่ม PREPAREรอบ1ได้ seatOrderจริงไม่เปลี่ยน game snapshot0.2/360 ไม่มีpageerrorหรือrequestsไปFirebaseจริง ดู [live-flow.json](live-flow.json)
- M4ทวนหน้าแรกและล็อบบี้/กติกา เปิดลิงก์fallbackผ่าน ชุดสีหน้าแรกใช้ high contrast ตามข้อจำกัด home.html เดิม ไม่อ้างว่าชุดสีหน้าแรกปกติผ่านcontrastทั้งหมด

ตรวจ React: componentsไม่มี fetch/SDK หรือ derived-state effects, keysเป็นplayer IDs, decorative artซ่อนจากscreen reader, semantics/focus/disabled เดิมครบ, SVGใช้เฉพาะข้อมูลคงที่ในrepository ฟอนต์SSRและclientตรงกัน ไม่เพิ่มCanvas/animation loop

รอบเริ่มต้นตัวทดสอบพยายามคลิกradio inputที่ซ่อนแทนtokenตัวละคร และอ่านsnapshotที่rootห้องผิดตำแหน่ง แก้เฉพาะharnessให้คลิกlabelและอ่าน authoritative/snapshot ไม่แก้ระบบเพื่อผ่าน ล้างข้อมูลเฉพาะห้อง/บัญชีที่การตรวจสร้าง รวมidentityจากรอบแรกตามเวลาและยืนยันว่าไม่มีห้อง ก่อนลบบนEmulatorเท่านั้น [cleanup-initial.json](cleanup-initial.json)

ภาพ lobby-6-360.png, lobby-5-390.png, lobby-4-430.png, lobby-6-1280.png, lobby-text-200.png ถูกignored; geometry/axeอยู่ [visual-check.json](visual-check.json) และ [accessibility.json](accessibility.json) รายงาน M4เฉพาะรอบนี้อยู่ m4-regression/

เป็น Chromiumจำลองขนาดมือถือ/เดสก์ท็อปและEmulators ไม่ใช่การทดสอบโทรศัพท์จริงหรือFirebaseProduction และไม่ได้เล่นเกมเต็มรอบซ้ำในขั้น UIล็อบบี้นี้

## ส่งมอบ

เปิด http://localhost:4100/preview?scene=lobby&role=sheriff&players=6&width=390 ใช้UIเดียวกับห้องจริง คงงานHome/previewที่แก้ไว้ก่อนหน้า ไม่commit/push/deploy ขั้นนี้เสร็จและหยุด ขั้นถัดไปคือหน้าเล่นเกมและตำแหน่งนายด่านตามข้อตกลงเมื่อผู้ใช้สั่ง
