# หน้าแรกจาก home.html

ผู้ใช้ส่ง `home.html` เป็นดีไซน์หน้าแรกเมื่อ 11 ตุลาคม 2026 ใช้ไฟล์ต้นฉบับนี้เป็น reference สำหรับหน้าแรก ไม่ใช้ merchant-gate.html และไม่ขยายเป็นการเลือกดีไซน์หน้าล็อบบี้/เกม/ผล/คะแนนโดยอัตโนมัติ

## ภาพและ layout ที่นำไปใช้

- โต๊ะสีเขียวเข้ม ขอบไม้ กระดาษและรายละเอียดสีทอง
- ภาพประตูเมือง SVG, ชื่อเกม Merchant’s Bluff, ฟอนต์ Chonburi/Sarabun
- Desktop: hero ด้านซ้าย ฟอร์มใบผ่านด่านด้านขวา; mobile: เรียงเป็นคอลัมน์
- ฟอร์มสร้างห้อง/เข้ารหัส ชื่อ และอวาตาร์ 8 แบบ
- กติกาย่อ ผลการตัดสิน และไพ่สินค้า 7 ชนิด

## การเชื่อมระบบจริงใน M2–M3

- แปลงเป็น React components โดยแยก presentation จาก client data access และ backend
- ชื่อ/ราคา/จำนวนสินค้าต้องอ่านจาก shared config ห้ามมี GAME_CONFIG สินค้าสำเนาอีกชุดใน UI
- ไม่ใช้ randomCode, setTimeout จำลองผล, scenario selector, resume banner จำลอง หรือ success panel จำลองเป็นระบบจริง การจองรหัสและสร้าง/เข้าห้องต้องผ่าน API/RTDB transaction
- ขนาดรหัสห้อง 4 ตัวและชื่อสูงสุด 16 ตัวเป็นสมมติฐานใน prototype ให้กำหนดและ validate ร่วมกันทั้ง client/server ใน M2
- Resume ต้องอาศัย identity/membership/session ที่ server ตรวจ ไม่อาศัย query parameter หรือชื่อผู้เล่น
- Glow ต้องรับ boolean/resultId ที่ server อนุญาตให้เผย ไม่รับข้อมูลลับเพื่อคำนวณใน UI
- ข้อความคะแนนในต้นแบบยังขาดลูกหนี้คงค้างและหนี้คงค้าง ต้องให้ตรงสูตรใน plan.md รวมการแบ่งโบนัสเมื่อเสมอและ tie-break
- เกณฑ์รับ milestone ยังคง M0 → M1 engine → M2 ห้อง/multiplayer → M3 UI ครบเกม ปัจจุบันผู้ใช้อนุมัติ360ใบ/rulesVersion0.2แล้ว หน้าอื่นใช้ placeholder ได้ต่อ งานภาพที่ยังไม่ได้เลือกพักไว้

## ผลตรวจต้นแบบจริง

ผลตรวจต้นแบบเดิมก่อนอนุมัติ360ใบ: เปิด home.html ด้วย Chromium ที่ 390×844 และ 1280×900 ไม่พบ horizontal overflow หรือ pageerror มีการ์ดสินค้า7ชนิด และแสดง “สำรับ120ใบ” ตามconfigเดิม เก็บไฟล์referenceต้นฉบับไว้ หน้าReactจริงอ่านconfigปัจจุบันเป็น360ใบ/จำนวนรายชนิดใหม่ ส่วนห้องที่เริ่มแล้วอ่านsnapshotของเกมนั้น

ตรวจภาพทั้งสองขนาดแล้ว หลักฐานอยู่ work/verification/home-design/ เป็นการตรวจต้นแบบ

หน้าแรกจริงแปลงเป็น React แล้ว ใช้ SVG จาก home.html ผ่าน scripts/import-home-assets.mjs และ public/art/ ฟอร์มสร้าง/เข้าห้อง ชื่อ อวาตาร์และ resume เชื่อม API จริง ข้อความสินค้ามาจาก config ชุดเดียว หน้าเกมยังใช้ panels และปุ่มชั่วคราว ไม่อ้างเป็นดีไซน์ที่ผู้ใช้อนุมัติ ฟอนต์ใช้ Sarabun/Leelawadee UI/Tahoma ตามที่เครื่องมี ไม่รอ asset เพิ่ม

หลักฐานหน้า React และทุกเฟสมือถืออยู่ work/verification/m3/ และ m4/ Browser contexts 4 คนเล่นครบ 8 รอบจริง รวม reload ขณะจัดกระเป๋า อุปกรณ์มือถือจริงและ production ยังเป็นขอบเขตที่ต้องตรวจเมื่อมี environment
