# Production release — 12 ตุลาคม 2026

พร้อมเล่นที่ **[merchant-s-bluff.vercel.app](https://merchant-s-bluff.vercel.app)** ผู้ใช้เลือกให้เข้า URL หลักได้โดยไม่ต้องมีบัญชี Vercel ส่วน Preview และ URL ของแต่ละ deployment ยังป้องกันตามเดิม ไม่เปลี่ยน Firebase Rules, credentials, กติกา, ราคา หรือ UI ในขั้นนี้

Preview/Production ใช้ Firebase Auth/RTDB `merchant-s-bluff` ร่วมกันตามคำอนุมัติเดิม ตัวแปร Vercel แยก scope และคงแผนฟรี งานภาพสุดท้ายของ M4 ยังพัก

## รุ่นที่เผยแพร่และขอบเขตผลตรวจ

- Release source: `b4b68d2ad20941e4abb598f1497c96e63274abff`
- สร้าง Production แบบ staged: `dpl_G322moM1bDSobZFR2kTVcdxccTe3` ทดสอบเกมเต็มก่อน promote
- หลัง promote ส่ง commit เดียวกันไป GitHub `main`; Git integration สร้าง `dpl_79birapraqG3C2ks5BKYMS4HYE54` เป็น Production ปัจจุบัน READY / Node 24.x / Functions `sin1`
- ตรวจ URL หลักหลัง Git deployment READY ด้วยเบราว์เซอร์ใหม่ 4 ชุดโดยไม่มี Vercel cookie, share token หรือ bypass header
- ผลเกมเต็มด้านล่างอยู่บน staged artifact ผล public smoke อยู่บน Git artifact commit เดียวกัน ไม่อ้างว่ารันเกมเต็มซ้ำบน artifact หลัง

หลักฐาน: [deployment.json](deployment.json), [staged-deployment.json](staged-deployment.json), [promotion.json](promotion.json), [summary.json](summary.json)

## เกมเต็มบน Production และ Firebase จริง

| ผู้เล่น | รอบ | ผล | จุดตรวจไพ่ |
|---|---|---|---|
| 4 | 8 | GAME_OVER, นายด่านคนละ 2 ครั้ง | 65 |
| 5 | 10 | GAME_OVER, นายด่านคนละ 2 ครั้ง | 101 |
| 6 | 12 | GAME_OVER, นายด่านคนละ 2 ครั้ง | 145 |

ไพ่ทุกกองรวม 360 ใบ / instance ไม่ซ้ำ 360 / ID ชุดเดิมและจำนวนรายสินค้า ตลอด 311 จุดตรวจ เกม 4 คนผสม INSPECT/PASS ตรวจค่าปรับ ค่าชดเชย เงินเสนอ retry หลัง commit, offline draft/reload, control takeover และ rematch เกม 5/6 คนแลก 3 ขน 5 ให้ผ่านทุกรอบ และ 6 คนสับกองทิ้งกลับจริง

Live Rules 54 assertions ผ่าน รวมสมาชิกอ่าน public/เจ้าของอ่าน private, ปฏิเสธไพ่เพื่อน/authoritative/root/client state forgery และ retention metadata เงินและคะแนนตรงกัน ไม่มี Emulator requests หรือ page errors

ตรวจ deployed JS responses 9 ไฟล์ ไม่พบ private key, service-account email, Cron secret หรือ bypass token ใช้ Firebase จริง Health 200 / unauthenticated create 401 / diagnostics 404 / maintenance ไม่มี secret 401 / มี secret 200 dry-run

หลักฐาน: [live-flow-report.json](live-flow-report.json), [game-live-4.json](game-live-4.json), [game-live-5.json](game-live-5.json), [game-live-6.json](game-live-6.json)

รอบนี้ไม่ได้รัน PASS5 ทั้งไม่แลก/แลก3ทั้งหกกรณีบน Production ซ้ำ ผล matrix ครบอยู่ในการตรวจ Emulators/engine เดิม [rules 0.2](../rules-0.2/report.md) และ [retention](../retention/report.md)

## การเข้าผ่าน URL หลัก

Fresh Chromium 4 contexts ขนาด 360/390/430/1280px เข้า public domain ได้ HTTP 200 สร้าง/เข้าห้อง กดพร้อม เริ่มเกม แลก3/ขน5/PASSครบหนึ่งรอบ กดส่งต่อตำแหน่งไปรอบ2 แล้ว reload กลับ UID/ที่นั่งเดิมผ่าน ไม่มี horizontal overflow/page errors ไม่มี Vercel cookie หรือ custom auth headers

API ยังต้องใช้ Firebase identity (ไม่มี token ได้ 401) Preview ยังได้ 302 จาก Deployment Protection นโยบาย `all_except_custom_domains` เดิมรองรับ URL หลักอยู่แล้ว จึงไม่เปลี่ยนนโยบายทั้ง project ลิงก์ทดสอบเพื่อนเดิมไม่ได้ถอน

LOBBY deadline 24 ชั่วโมง / PLAYING ไม่มี deadline / resume ต่ออายุ metadata โดย game ไม่เปลี่ยนผ่าน บน URL หลัก maintenance ที่มี secret ทำเฉพาะ dry-run (`RETENTION_APPLY_ENABLED=false`), candidate 0 / legacy 2 ไม่เปิด automatic deletion Daily Cron ในรุ่นนี้จึงเป็น dry-run จนกว่าจะเปิด apply ในขั้นถัดไป

หลักฐาน: [public-smoke.json](public-smoke.json), [public-http.json](public-http.json), [protection-cleanup.json](protection-cleanup.json)

## การส่งขึ้นบริการและ cleanup

CLI upload audit: 124 ไฟล์ตรงกับ Git มี normalization เฉพาะ CRLF ของ tsconfig และ empty directory markers 5 รายการ ไม่มีเนื้อหาจาก env/runtime/credentials ถูกส่งขึ้น ตรวจ source ใน [source-audit.json](source-audit.json)

ล้างเฉพาะข้อมูลที่สร้างในรอบนี้ครบ **4 ห้อง / 20 Anonymous users** (เกมเต็ม 3/16 และ public smoke 1/4) พร้อม presence, รหัสห้อง และ test rate limits ไม่มี cleanup errors ไม่แก้ห้องผู้เล่น ถอน automation bypass ที่งานนี้สร้าง 1 รายการแล้ว URL ของ staged artifact กลับมาถูกป้องกัน 302 / main domain ยัง 200 / Preview ยัง 302

อ่าน runtime error logs ของ public artifact หลังตรวจ ด้วยขอบเขตย้อนหลัง30นาที/ไม่เกิน20รายการ สำเร็จและไม่พบรายการ เป็นหลักฐานช่วงทดสอบ ไม่รับประกันว่าอนาคตจะไม่มีข้อผิดพลาด ดู [runtime-logs.json](runtime-logs.json)

ไม่แก้ source ของ engine/backend/data access/UI, rulesVersion หรือสำรับ ไม่อัปเกรดแพ็กเกจ ไม่เปลี่ยน IAM/Rules ไม่เปิด endpoint demo และไม่เปิดการล้างห้องอัตโนมัติ

## รับงานต่อ

ผู้ใช้แจ้งว่าการเล่นหลายคนกับเพื่อนก่อนหน้านี้ผ่านแล้ว ผลรอบนี้เป็น browser automation และขนาดหน้าจอมือถือ ไม่ใช่ผลตรวจโทรศัพท์จริงของ Production หรือหลักฐานสมดุลราคา หากมีเกมค้างในลิงก์ Preview เดิมให้เล่นจบที่ลิงก์เดิม แล้วเริ่มห้องใหม่ที่ Production เพราะ Anonymous identity แยกตาม browser origin

ขั้น deploy/เปิด URL หลักและตรวจเสร็จแล้ว หยุดตามคำสั่งทำทีละขั้น งานถัดไปคือเปิดและตรวจ retention apply ตามนโยบาย 24 ชั่วโมงเมื่อผู้ใช้สั่ง งานภาพสุดท้ายของหน้าเกมยังรอเลือกดีไซน์
