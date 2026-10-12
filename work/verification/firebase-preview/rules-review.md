# Firebase Preview — ตรวจ credentials และเตรียม Rules

> สถานะปัจจุบัน 12 ตุลาคม 2026: ผู้ใช้อนุมัติและเผยแพร่ Rules แล้ว พร้อมทดสอบ browser/APIกับFirebaseจริงผ่าน ดู [report.md](report.md) ข้อความด้านล่างเป็น reviewก่อนเผยแพร่เมื่อ11ตุลาคม ไม่ใช่ live Rules ปัจจุบัน

วันที่ 11 ตุลาคม 2026 — project `merchant-s-bluff`, RTDB instance `merchant-s-bluff-default-rtdb` ที่ Singapore (`asia-southeast1`)

## ยืนยันการเชื่อมต่อแล้ว

- ใช้ service account JSON ที่ผู้ใช้วางไว้ใน `work/runtime/firebase-preview/` ชื่อเดิมจาก Firebase ตรวจ project/email/token endpoint และ RSA key ตรงกัน แล้วเติม `.env.preview.local` โดยไม่พิมพ์ key หรือ token
- Environment checks ผ่าน 10/10 ค่า ปิด Emulator และไม่มีปัญหา config: [env-report.json](env-report.json)
- เรียก server module `src/lib/server/firebase-admin.ts` จริงผ่าน Node ด้วยเงื่อนไข `react-server` สร้าง OAuth token ด้วย service account สำเร็จ และ Admin SDK อ่าน RTDB probe path ได้ ไม่เขียนข้อมูลลงฐานข้อมูล
- Web SDK เข้าสู่ระบบแบบ anonymous จริงและ Admin SDK ตรวจ ID token/project/provider ตรงกัน ลบเฉพาะ anonymous test user ที่สร้างใหม่ในขั้นนี้แล้ว ไม่แตะผู้ใช้เดิม
- รายละเอียด SDK preflight: [preflight-report.json](preflight-report.json) ขั้นอ่าน Rules ครั้งแรกได้ข้อความ JSON ที่มี comments จึง parse ไม่ผ่าน ทวนเฉพาะ Rules ด้วย parser รองรับ comments สำเร็จ: [rules-report.json](rules-report.json)

## จุดที่ยังไม่ผ่าน

Rules ที่ใช้งานอยู่ตอบ HTTP 200 และเป็น Test mode:

```json
{
  "rules": {
    ".read": "now < 1794243600000",
    ".write": "now < 1794243600000"
  }
}
```

เวลาหมดอายุคือ 10 พฤศจิกายน 2026 เวลา 00:00 น. Asia/Bangkok ก่อนเวลานั้น Rules อนุญาตให้อ่านและเขียนทั้งฐานข้อมูลโดยไม่มีเงื่อนไข auth/membership จึงยังไม่ผ่านเกณฑ์ป้องกันไพ่ลับและ client ปลอม state ของเกม หลังเวลานั้นจะไม่อนุญาต access ดังกล่าวตามเงื่อนไขเวลา ไม่มี path เฉพาะสำหรับสมาชิก/เจ้าของข้อมูล

ยังไม่เริ่ม Next Preview server, ไม่สร้างห้องหรือข้อมูลไพ่จริง และยังไม่ได้ตรวจ browser → HTTP API → RTDB realtime ด้วย Firebase จริง หยุดที่ขอบเขต Rules ตาม `vercel:verification`: "Do not continue past a confirmed broken boundary."

## การเผยแพร่ที่เตรียมให้อนุมัติ

เป้าหมาย: `https://merchant-s-bluff-default-rtdb.asia-southeast1.firebasedatabase.app/.settings/rules.json` เผยแพร่เฉพาะ Realtime Database Rules ด้วย payload จาก [proposed-database.rules.json](proposed-database.rules.json) ซึ่งตรงกับ `firebase/database.rules.json` ใน repository ไม่ deploy เว็บ/Vercel หรือเปลี่ยนกติกาเกม

| ขอบเขต | Rules ปัจจุบัน | Rules ที่เสนอ |
|---|---|---|
| Root และ authoritative/game/index paths | อ่าน/เขียนได้ก่อนหมดอายุ | Client อ่าน/เขียนไม่ได้; backend Admin SDK ทำงานได้ |
| Public room view | อ่านได้ทั่วไป | อ่านได้เฉพาะสมาชิกที่มี Auth UID ในห้อง |
| Private player view | อ่านได้ทั่วไป | อ่านได้เฉพาะ UID เจ้าของที่เป็นสมาชิกห้อง |
| เงิน/ไพ่/roles/views | Client เขียนได้ | Client เขียนไม่ได้ ต้องส่ง command ผ่าน API |
| Presence | ไม่มีการตรวจตัวตน/fields | เขียนเฉพาะ connection ของ UID ตนเองที่เป็นสมาชิก พร้อมตรวจ online/เวลา/fields |

Rules ที่เสนอเป็นไฟล์เดิมที่ผ่าน Emulator integration 16 tests ในการทวน rulesVersion 0.2 เมื่อ 11 ตุลาคม 2026 ดู [acceptance.log](../rules-0.2/acceptance.log) มีการทดสอบ owner/member/stranger/guest, deny private ของเพื่อน, deny authoritative/root/client writes และ presence forgery ผลนี้ยังไม่ใช่การตรวจ Rules บน Firebase จริง

อ่าน Rules ปัจจุบันและเปรียบเทียบกับฉบับที่อนุมัติอีกครั้งก่อนเผยแพร่ หากมีผู้แก้ Rules ระหว่างนี้ให้หยุดและทบทวนใหม่ การ PUT จะเปลี่ยน Rules ที่ instance นี้จริง แต่ไม่เขียนหรือลบข้อมูลเกม ต้องได้รับคำสั่งอนุมัติเผยแพร่ก่อน แล้วจึงทวน live Rules และ browser/API/realtime privacy ด้วย Firebase จริง

## ขอบเขตของผล

ขั้นนี้ยืนยัน config/credentials/server SDK/anonymous Auth และอ่าน live Rules เท่านั้น ยังไม่ใช่ multiplayer บน Firebase จริงครบขั้นตอน และยังไม่ใช่ Vercel deployment Runtime ของเกม/ราคา/สำรับ 360 ใบ/rulesVersion 0.2 ไม่มีการแก้ไข Private key อยู่เฉพาะไฟล์ local ที่ ignore ไม่อยู่ในรายงานนี้
