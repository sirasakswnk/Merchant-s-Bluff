# Production environment สำหรับเว็บเล่นกับเพื่อน

วันที่ 12 ตุลาคม 2026 ผู้ใช้ระบุ project ID `merchant-s-bluff` และยืนยันให้ใช้ Firebase ร่วมกันระหว่าง Preview และ Production เป็นข้อยกเว้นจากข้อกำหนดแยก project ในแผนเดิม คงแผนฟรีและข้ามงานคำนวณค่าใช้จ่ายตามที่ตกลงไว้

ทั้งสอง environment ใช้ Auth และ RTDB instance เดียวกัน จึงเห็นห้องและข้อมูลเกมชุดเดียวกัน ส่วนตัวแปร Vercel แยก scope ของ Production และ Preview ใช้ `.env.production.local` สำหรับตรวจในเครื่อง และคง `.env.local` ของ Emulator กับ `.env.preview.local` เดิม

## ค่าที่เตรียมเสร็จแล้ว

Vercel project `merchant-s-bluff` (`prj_sHBgyJCUNYQYl3mIfGgNYUWStx7I`) ใน `mingmings-projects-c4169f4b` ใช้ Node 24.x และ Functions region `sin1` เพิ่มตัวแปรเฉพาะ Production 14 ชื่อ:

| กลุ่ม | จำนวน | รายละเอียด |
|---|---|---|
| Firebase config | 10 | Client/server ใช้ project และ URL ตรงกัน; Emulator mode=false |
| Runtime | 1 | `NODE_OPTIONS=--experimental-require-module` ตาม runtime ที่ทดสอบแล้ว |
| Maintenance | 3 | `CRON_SECRET`, `RETENTION_APPLY_ENABLED=false`, `RETENTION_FIREBASE_PROJECT_ID=merchant-s-bluff` |

`FIREBASE_PRIVATE_KEY` และ `CRON_SECRET` เป็น Secret ส่วนค่าอื่นเป็น Config ตรวจอ่านกลับ Config ทั้ง 12 ค่าตรงกับไฟล์ในเครื่อง Secret ไม่ถูกอ่านกลับและไม่อยู่ใน Git ค่า Preview และ Deployment Protection ไม่เปลี่ยน

ไฟล์ `.env.production.local` มี credentials และ secret จึงถูก ignore ไฟล์ที่ pull จาก Vercel อยู่ใน `work/runtime/firebase-production/vercel-production.env` และมี placeholder ของ Secret ใช้ไฟล์ที่ pull นี้แทน environment เต็มไม่ได้

## ผลตรวจขั้นนี้

- Environment ผ่าน 10/10 ค่าจำเป็น และ `test:deployment` ผ่าน 7 กรณี
- Service-account OAuth ผ่าน; อ่าน Rules จริงตรงกับ source, root read/write ปิด และ Anonymous Auth เปิด
- Production build ในเครื่องผ่านพร้อม TypeScript; สแกน client static bundle 14 ไฟล์ ไม่พบ private key, service-account email, Cron secret หรือ server module และไม่ใช้ demo project
- Local HTTP จาก production build: health 200, dev endpoint 404, create ที่ไม่มี Firebase identity 401, maintenance ที่ไม่มี Bearer 401
- Maintenance ที่มี Bearer ตรงกันได้ 200 และทำเฉพาะ dry-run (candidate 0, legacy 2) ไม่เปิดการล้างอัตโนมัติ
- ไม่สร้างห้องหรือบัญชีทดสอบ ไม่เผยแพร่ Rules ซ้ำ และหยุด server ที่เปิดเพื่อตรวจแล้ว

HTTP รอบนี้ใช้ local production build โดยจำลอง `VERCEL_ENV=production` ยังไม่ใช่ผลทดสอบ URL Production บน Vercel ดูหลักฐาน [รายงาน environment](../work/verification/firebase-production/report.md)

ตัวเรียกใน workspace นี้อ่าน environment ก่อนเปิด Next และไม่ส่ง `--env-file` เข้า worker:

```powershell
node --env-file=.env.production.local scripts/check-deployment-env.mjs
npm.cmd run test:deployment
node work/runtime/firebase-production/next-production.mjs build
```

## ขั้นเผยแพร่ถัดไป

Production environment พร้อมสำหรับขั้น deploy แต่ในขั้นนี้ยังไม่ได้ deploy เว็บไซต์ Production หรือเปิด automatic deletion สาขา Production ของ Vercel ยังคือ `main`; โค้ดล่าสุดที่ผ่านเกมและ retention อยู่ที่ `preview` ต้องใช้โค้ดล่าสุดในการเผยแพร่ ไม่ deploy จาก `main` รุ่นเริ่มต้นโดยไม่ตรวจ

หลัง deploy ให้ตรวจ URL Production จริงและวิธีเข้าเล่นของกลุ่มเพื่อน ก่อนเปิด retention apply ลิงก์ทดลองเดิมยังใช้ deployment ก่อนเพิ่ม retention และคงไว้ให้เกมเดิมเล่นต่อได้ เมื่อเปลี่ยน URL ให้ทุกคนเล่นเกมเดิมให้จบในลิงก์เดิม แล้วเข้า URL ใหม่เพื่อเริ่มห้องใหม่ เพราะบัญชี Anonymous เก็บแยกตาม browser origin

การทดสอบภายหลังใช้ Emulator เป็นหลัก หากต้องทดสอบกับ Firebase project ที่ใช้ร่วมกัน ให้สร้างและล้างเฉพาะ fixture ที่ระบุเจ้าของการทดสอบชัดเจน วิธีนี้เป็นการใช้ project ร่วมกันตามคำอนุมัติ ไม่ใช่การแยกฐานข้อมูล
