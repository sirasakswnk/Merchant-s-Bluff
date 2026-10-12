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

ผล deployment Preview และ smoke test จะบันทึกเพิ่มหลัง build ของ Git integration เสร็จ
