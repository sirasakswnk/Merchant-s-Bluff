# Production environment preparation — 12 ตุลาคม 2026

ขอบเขต: ตั้งค่า Production environment บน Vercel และตรวจในเครื่อง โดยใช้ Firebase `merchant-s-bluff` ร่วมกับ Preview ตามคำอนุมัติล่าสุด ไม่เผยแพร่เว็บไซต์ Production ในขั้นนี้

| ตรวจ | ผล / หลักฐาน |
|---|---|
| Local environment | 10/10 พร้อม; `.env.production.local` ถูก ignore — `local-env-report.json` |
| Vercel variables | เพิ่ม Production-only 14 ตัว, Config readback 12 ค่าตรง; private key/Cron secret เป็น Secret; Preview/protection เดิม — `env-upload.json` |
| Firebase read-only preflight | OAuth, Rules hash ตรง source, root deny, Anonymous Auth enabled — `preflight.json` |
| Deployment checker | 7 ผ่าน |
| Local production build | ผ่าน compile/TypeScript/pages; มี maintenance route |
| Local production HTTP | health 200; dev 404; unauthenticated create 401; maintenance without Bearer 401 / valid Bearer 200 dry-run — `runtime-check.json` |
| Client bundle | 14 ไฟล์ ไม่มี credential/Cron secret/server module; actual Firebase config และไม่มี demo — `runtime-check.json` |
| Cleanup / data writes | server ที่ใช้ตรวจหยุดแล้ว; ไม่สร้างห้อง/บัญชี ไม่ล้างห้อง และไม่ deploy Rules ซ้ำ |

`RETENTION_APPLY_ENABLED=false` ยืนยันจาก Config ที่อ่านกลับบน Vercel การสร้าง Cron secret ยังไม่เปิดการล้างและในขั้นนี้ไม่มีเว็บไซต์ Production ที่ READY ผล HTTP ไม่ใช่ผล deploy Production

ไม่เปลี่ยน source ของ engine/backend/UI, rulesVersion 0.2, สำรับ 360 ใบ, ราคา ค่าปรับ ค่าชดเชย หรือ Firebase Rules ในขั้นนี้ หลักฐานเก่าของเกมยังอยู่ในโฟลเดอร์ verification เดิม

Credentials, pulled environment, runtime helpers และ build logs อยู่ใน ignored `work/runtime/firebase-production/` เท่านั้น ดูขั้นเผยแพร่ต่อใน [production-setup.md](../../../docs/production-setup.md)
