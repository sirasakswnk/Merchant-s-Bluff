# Retention 24 ชั่วโมง — 12 ตุลาคม 2026

นโยบายตามคำตอบผู้ใช้: ห้อง LOBBY / FINISHED / ABORTED ที่ไม่มีการใช้งานผ่าน API ที่ถูกต้องอย่างน้อย 24 ชั่วโมงและไม่มีผู้เล่นออนไลน์เข้าเกณฑ์ล้าง ส่วน PLAYING และห้องเก่าที่ metadata ไม่ครบถูกข้ามเสมอ

เพิ่ม metadata ฝั่ง server แยกจาก game snapshot, เครื่องมือ dry-run/apply, transaction และ presence fence กันการล้างระหว่าง reconnect/resume/rematch พร้อม marker ขนาดเล็กกัน create request เก่าสร้างห้องคืน ไม่เปลี่ยน rulesVersion 0.2, สำรับ 360 ใบ, ราคา, ค่าปรับ หรือค่าชดเชย

| ชั้นที่ตรวจ | ผล |
|---|---|
| TypeScript / ESLint | ผ่านบน source สุดท้าย |
| Unit | 89 ผ่าน |
| Firebase Emulator integration | 28 ผ่าน รวม Rules, race, lease, create retry, orphan และข้อมูลผิด schema |
| Browser E2E บน Emulator | 17 ผ่าน รวมเกม 4/5/6 คน ทั้งไม่แลกและแลก 3 ใบ ขน 5 และให้ผ่านตลอด; conservation 360 |
| Deployment environment checks | 7 ผ่าน |
| Local production build | ผ่าน; มี maintenance route |
| Client bundle | 14 ไฟล์ ไม่มี private credential หรือ server marker; ใช้ Firebase project จริง |
| Firebase Preview Rules | เผยแพร่เฉพาะ presence fence แล้วอ่านกลับตรง source |
| Firebase Preview fixtures | 8 ชุดผ่าน; expired 3 ห้องและ orphan 1 รายการล้างได้; PLAYING/online/recent/legacy อยู่ครบ |
| Fixture cleanup | ล้าง fixture ทั้ง 8 ชุด; ไม่แก้ห้องผู้เล่นและไม่สร้าง Auth user |
| CLI กับข้อมูลผู้เล่นจริง | dry-run พบ candidate 0, legacy 2; apply manifest ว่างไม่ลบห้อง |

หลักฐาน JSON อยู่ในโฟลเดอร์นี้ ส่วน credentials, manifest ที่มี room ID, browser authentication และ logs อยู่ใน ignored runtime เท่านั้น E2E รันก่อนการปรับ create retry / fence ขั้นสุดท้าย และ integration รันทวนหลังการปรับครบแล้ว

Vercel Cron และ endpoint เตรียมไว้สำหรับขั้น Production โดยต้องมี secret และ explicit opt-in ที่ตรง project ก่อนล้างข้อมูล ตอนนี้ยังไม่เปิด automatic deletion และยังไม่ deploy Production งานภาพสุดท้าย M4 ยังพัก

Git integration สร้าง Preview จาก commit `034a2c7899c8f8dd01bef517b79fcb492ece28c5` สำเร็จ: `dpl_6Kprgk2BRkBkTCAarCQYaCarYJxz`, READY, environment preview, Node 24.x, region sin1, build 28.4 วินาที ดู `deployment.json`

[Preview ที่ตรวจแล้ว](https://merchant-s-bluff-mw353kn6x-mingmings-projects-c4169f4b.vercel.app) ใช้ Vercel Authentication ตามเดิม ทดสอบผ่าน development OIDC ของ project เดียวกัน ไม่สร้าง temporary bypass หรือเปลี่ยนการป้องกัน ลิงก์กลุ่มเพื่อนเดิมยังชี้ deployment ก่อนเพิ่ม retention และยังคงไว้ให้กลุ่มเดิมเล่นต่อได้

`preview-smoke.json`: Chromium ใหม่ 4 contexts ที่ 360/390/430/1280px สร้าง/เข้าห้อง พร้อม เริ่มเกม แลก 3 ขน 5 และให้ผ่านครบหนึ่งรอบ เข้า PREPARE รอบ 2 และ reload กลับที่นั่งเดิม ผ่านทั้งหมด ตรวจ conservation 360 และ game snapshot ไม่เปลี่ยนจาก resume ไม่มี page error หรือ horizontal overflow

metadata ของ LOBBY มี deadline 24 ชั่วโมง, PLAYING ไม่มี deadline, public view ไม่มี retention, resume เพิ่ม activity ถูกต้อง; maintenance endpoint ยัง 404 เพราะไม่มี secret ส่วน API สร้างห้องโดยไม่มี Firebase identity ได้ 401 ล้างห้องทดสอบ 1 ห้องและ anonymous account 4 บัญชีที่สร้างในรอบนี้ครบ

`deployed-bundle-report.json`: อ่าน client JavaScript จาก deployment จริง 9 ไฟล์ ไม่พบ private key หรือ service-account email และพบ Firebase project ที่ถูกต้อง ไม่ใช่การทดสอบด้วย bundle local อย่างเดียว
