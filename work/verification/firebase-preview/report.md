# Firebase Preview — Rules เผยแพร่แล้วและทดสอบจริงผ่าน

วันที่ 12 ตุลาคม 2026 — ผู้ใช้อนุมัติ “deploy Rules และทดสอบ Firebase จริง” สำหรับ project `merchant-s-bluff` / RTDB instance `merchant-s-bluff-default-rtdb` ที่ Singapore (`asia-southeast1`)

## ผลการเผยแพร่

เผยแพร่เฉพาะ `firebase/database.rules.json` ผ่าน service-account OAuth/REST ไม่เปลี่ยนบัญชี CLI หรือ IAM อ่าน Rules ปัจจุบันก่อนเผยแพร่แล้วตรงกับฉบับที่เคยให้ตรวจ PUT ตอบ HTTP200 และอ่านกลับแล้วตรงกับ repository/proposal โดย root read/write เป็น false

Rules hash ก่อนส่งและหลังอ่านกลับตรงกัน: `099b6d6bc06fbb979ef35a152a8fb1aad1d2cf4c31bed5d4aa1ee4080abbfa45` ดู [deployment-report.json](deployment-report.json), [ฉบับก่อนเผยแพร่](rules-before-deploy.json) และ [Rules ที่ใช้งานแล้ว](deployed-database.rules.json) ตรวจเทียบโครงสร้างโดย normalize boolean เฉพาะ expressions ของ Rules

## Browser → API → Firebase → UI

ทดสอบด้วย local Next.js **production build** บน `127.0.0.1:3100` แต่เชื่อม **Firebase Auth และ RTDB จริง** ไม่ใช้ Emulators สร้าง/เข้าห้อง พร้อม เริ่มเกม แลกไพ่ จัดกระเป๋า แจ้งสินค้า เสนอเงิน ตรวจ/ให้ผ่าน เดินรอบและจบคะแนนผ่าน UI ทั้งหมด ไม่ seed/mutate ไพ่หรือผลเกมด้วย Admin SDK

| ผู้เล่น | รูปแบบ | รอบจบ | กองจั่ว | กองทิ้ง | มือรวม | ถุงรวม | คลังรวม | รวม/unique |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 4 | แลก3ทุก turn; INSPECT compensation/fine และ PASS bribe/no-offer | 8 | 166 | 73 | 4 | 0 | 117 | 360/360 |
| 5 | แลก3และขน5ทุก turn; PASS/no-offer ทุกครั้ง | 10 | 35 | 120 | 5 | 0 | 200 | 360/360 |
| 6 | แลก3และขน5ทุก turn; PASS/no-offer ทุกครั้ง | 12 | 3 | 51 | 6 | 0 | 300 | 360/360 |

ทุกคนเป็นนายด่านสองครั้ง ตรวจ inventory อิสระรวม 311 checkpoints เทียบ instance IDs กับชุดเริ่มต้น จำนวนสินค้า 84/72/60/54/36/30/24 เท่าเดิม total/unique360 และเงินสดรวม N×50 ตลอด กรณี6คนสับกองทิ้งกลับจริงหนึ่งครั้ง หน้าคะแนนทุก client ตรงกัน ไม่มี horizontal overflow ที่หน้า GAME_OVER และไม่มี pageerror

เกม4คนตรวจ payment oracle จากจำนวน/ราคาสินค้าจริง: ค่าชดเชย ค่าปรับ และเงินเสนอจ่ายตาม INSPECT/PASS เท่านั้น พร้อม unknown HTTP result หลัง server commit แล้ว retry commandId เดิม, control takeover ในสองแท็บ, offline draft/reload และ rematch ที่ได้ gameIdใหม่/เงินเริ่ม50/สำรับ360 หน้าแรกอ้างอิง home.html ส่วนหน้าเกมยังเป็น UI ชั่วคราว

รายละเอียด: [games-summary.json](games-summary.json), [4 คน](game-live-4.json), [5 คน](game-live-5.json), [6 คน](game-live-6.json), [ผลเต็ม](live-flow-report.json) และ [run log](live-flow.log) ภาพ final-live-4/5/6.png, lobby-live-4.png และ result-live-4-*.png

## Live Rules และ privacy

51 assertions ผ่านกับ Rules ที่เผยแพร่จริง (17กรณีต่อห้อง): สมาชิกอ่าน public/own-private ได้; อ่าน private เพื่อนไม่ได้; nonmember/guest อ่าน public ไม่ได้; ancestor/root/authoritative/views parent อ่านไม่ได้; client เขียน authoritative/public/private ไม่ได้; own presence ที่มี fields/time ถูกต้องเขียน/ลบได้ แต่ friend presence write และ extra fields ถูกปฏิเสธ ก่อน assert denial ยืนยัน identity ของ token/member และ positive reads เพื่อไม่ให้ invalid token กลายเป็น false pass

ตรวจ public projection ก่อน GAME_OVER ไม่มี instanceId/hand/bag/stash/goodsValue และผล PASS มี revealed/passed/confiscated เป็น null ราคาสินค้าใน catalogue เป็น public ตามกติกา ไม่ถือเป็นข้อมูลไพ่ของผู้เล่น ดู `rulesChecks` ใน [live-flow-report.json](live-flow-report.json)

## Environment/build และผลที่ทวน

- Environment checks 10/10 และ credentials อยู่เฉพาะ local ignored files
- Production build ผ่าน: [build.log](build.log) ครั้งแรกเรียก Next ผ่าน `node --env-file` แล้ว worker ส่ง flag นั้นเข้า NODE_OPTIONS จน Nodeปฏิเสธ เก็บ [build-initial.log](build-initial.log) แล้วใช้ `process.loadEnvFile` ก่อน spawn Next ด้วย execArgv ว่าง ไม่แก้ product code
- HTTP smoke: health200, unauthenticated create401, production POST diagnostics404
- Browser network พบ Identity Toolkit จริงและ RTDB namespace `merchant-s-bluff-default-rtdb`; Emulator requests0
- Client bundle 14 files มี public config ของ projectจริง ไม่มี demo config, private-key value, service-account email หรือ server credential markers: [client-bundle-report.json](client-bundle-report.json)
- Live flow ครั้งแรกผ่าน privacy17 แต่ timeout5วินาทีระหว่าง control takeover ที่กำลังรอ revision เพิ่มเวลารอใน harness เป็น20/30วินาทีและเก็บ metadata revisionsโดยไม่เก็บ tokens/cards จากนั้นรันทวนครบทั้ง3เกมผ่าน ไม่มี runtime/UI/game changes ดู [initial report](live-flow-initial-report.json), [initial log](live-flow-initial.log) และผลสำเร็จด้านบน ไม่อ้างว่า runแรกผ่าน

## Cleanup และขอบเขต

ลบเฉพาะ test rooms/presence/code reservations/requestLimits และ anonymous accounts ที่สร้างใน run นี้หลังตรวจ ownership/เวลา account แล้ว: successful run 3 rooms/16users ลบครบ; initial run 1room/5users ลบครบ ไม่มี cleanup errors หยุด Next serverที่เปิดทดสอบแล้ว พอร์ต3100/19000/19099 ไม่มี listener ดู `cleanup` ใน reports และ [server-cleanup.json](server-cleanup.json) Rules ที่เผยแพร่ยังคงใช้งานอยู่

ผลนี้ยืนยัน local production browser/API กับ Firebase Preview จริง ยังไม่ได้ deployเว็บ/Functionsขึ้น Vercel ไม่มี public URL และไม่ได้ตรวจโทรศัพท์จริงบน Wi-Fi, human balance, production retention/cost หรือแยก Production Firebase project งานภาพสุดท้ายยังพัก สำรับ/ราคา/ค่าปรับ/ค่าชดเชย/rulesVersion0.2 ไม่มีการเปลี่ยนแปลง

Matrixทั้งหมด4/5/6คนทั้งไม่แลกและแลก3 ขน5/PASSทุก turn ที่ตรวจบน Emulators อยู่ [รายงาน rules0.2](../rules-0.2/report.md) รอบ Firebaseจริงนี้ตรวจสามรูปแบบตามตาราง ไม่ใช่การทวนทั้งหก matrix บน Firebaseจริง
