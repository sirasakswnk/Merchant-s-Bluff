# หน้าแรกจาก home.html

## ล่าสุด — คืนสไตล์และแอนิเมชันต้นฉบับครบ

12ตุลาคมผู้ใช้เลือกกลับมาทำdesignและต้องการเอฟเฟกต์เหมือนhome.htmlโดยตรง ขั้นนี้ย้ายCSS/SVGinline/Chonburi+Sarabun/อวาตาร์และinteractionของหน้าแรกครบ แสงประตู/ไฟ/ธง/ดาว อวาตาร์พลิก แจกไพ่/tilt/glare กระเป๋าเคลื่อนและglow spinner/stampตรงต้นฉบับ ฟอร์มยังใช้APIจริง stampเล่นหลังreceiptเท่านั้น สำรับ360และราคาเดิมอ่านconfig ไม่ใช้ข้อมูล120หรือsimulationของprototype

เทียบ14จุดของheader/hero/formที่360/390/430/1280ตรงกัน ภาพheroเท่ากันระดับpixelครบ4ขนาด Keyframes13ชุดตรงต้นฉบับ ตรวจ4ผู้เล่นสร้าง/เข้าห้องเล่นครบหนึ่งรอบและreloadบนEmulatorsผ่าน No pageerror ผลTypeScript/lint/buildและM0/M4targetedผ่าน ดู [รายงาน](../work/verification/home-fidelity/report.md)

สีปกติคงต้นฉบับ มีcontrastข้อจำกัด1จุดที่ป้ายtag-legal3.77 เพิ่มโหมดprefers-contrast:moreโดยไม่เปลี่ยนสีปกติ โหมดนี้axe0violationsผ่าน10snapshots ไม่อ้างว่าสีปกติผ่านaxe0 หน้าเกมยังเป็นขั้นต่อไป ขั้นนี้ยังไม่deployProduction

## ประวัติการรับต้นแบบและการแปลงครั้งแรก

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

การแปลงReactครั้งแรกใช้SVGผ่านpublic/art/ และฟอนต์ที่เครื่องมี จึงยังไม่มีแอนิเมชันภายในSVGและเอฟเฟกต์ครบตามprototype ฟอร์มเชื่อมAPIจริงแล้ว ข้อความสินค้ามาจากconfigชุดเดียว รอบล่าสุดด้านบนแก้ความต่างนี้ ส่วนหน้าเกมยังใช้panelsและปุ่มเดิมรอขั้นต่อไป

หลักฐานหน้า React และทุกเฟสมือถืออยู่ work/verification/m3/ และ m4/ Browser contexts 4 คนเล่นครบ 8 รอบจริง รวม reload ขณะจัดกระเป๋า อุปกรณ์มือถือจริงและ production ยังเป็นขอบเขตที่ต้องตรวจเมื่อมี environment
