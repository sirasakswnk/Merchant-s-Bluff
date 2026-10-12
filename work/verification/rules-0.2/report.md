# ผลทวน rulesVersion 0.2 / สำรับ 360 ใบ

วันที่ 11 ตุลาคม 2026 — M0–M5 ผ่านการทวนในขอบเขต local/Emulators งาน M4 ตรวจ responsive/accessibility ตามที่อนุมัติ งานภาพสุดท้ายยังพัก

## สิ่งที่เปลี่ยน

จำนวนสินค้าใหม่: แอปเปิล 84, ขนมปัง 72, ชีส 60, ผ้า 54, เหล้าเถื่อน 36, หน้าไม้ 30, ใบกัญชา 24 รวม 360 ใบ rulesVersion เป็น 0.2 ราคา ค่าปรับ ค่าชดเชยและกติกาอื่นเท่า snapshot 0.1 มี test เทียบทุกค่า โดยยกเว้นเฉพาะ count/totalCards/rulesVersion

Config ใช้ตอนเริ่มเกมใหม่เท่านั้น Engine, projections และ UI ใช้ snapshot ที่บันทึกกับเกม ไม่มี migration หรือเพิ่มไพ่เข้าเกมเดิม Integration ใช้ RTDB Emulator จริง เก็บเกม 0.1/120 ใบแล้ว resume และส่งคำสั่งแลกผ่าน service instance ใหม่ ยืนยันยัง 0.1/120 ใบ จากนั้นยุติ/rematch/เริ่มเกมใหม่จึงได้ 0.2/360 ใบ

Server entropy เพิ่มเป็น 360 samples: หนึ่ง sample เลือกนายด่านและ 359 samples สับสำรับตอนเริ่มเกม เตรียม entropy ก่อน transaction และใช้ชุดเดิมเมื่อ callback retry ไม่เปลี่ยนกติกาสับกองทิ้ง

## Matrix ขน 5 ใบ / ให้ผ่านทุกครั้ง

เล่นครบผ่าน UI → HTTP API → Firebase Auth/RTDB Emulators → realtime UI ด้วย Chromium contexts แยก UID ไม่ seed authoritative state ในหกเกมนี้ นายด่านเลือกและยืนยัน PASS เองด้วย automation ทุกคำสั่งเดินรอบเป็น manual ไม่มี auto-pass/timer

| คน | แลกต่อ merchant turn | รอบจบ | กองจั่ว | กองทิ้ง | มือรวม | ถุงรวม | คลังรวม | รวม / unique |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 4 | 0 | 8 | 236 | 0 | 4 | 0 | 120 | 360 / 360 |
| 4 | 3 | 8 | 164 | 72 | 4 | 0 | 120 | 360 / 360 |
| 5 | 0 | 10 | 155 | 0 | 5 | 0 | 200 | 360 / 360 |
| 5 | 3 | 10 | 35 | 120 | 5 | 0 | 200 | 360 / 360 |
| 6 | 0 | 12 | 54 | 0 | 6 | 0 | 300 | 360 / 360 |
| 6 | 3 | 12 | 3 | 51 | 6 | 0 | 300 | 360 / 360 |

ทุกเกมถึง GAME_OVER ทุกคนเป็นนายด่านสองครั้ง พ่อค้าขนห้าใบทุก merchant turn และเสนอศูนย์ ทุก checkpoint ตรวจจำนวนสินค้า 84/72/60/54/36/30/24, total 360, unique 360 และ instance IDs ตรงกับชุดเริ่มต้น เงินทุกคนยัง 50 คะแนนสุดท้ายแสดงตรงกันทุก client ไม่มี pageerror หรือ horizontal overflow ที่หน้า GAME_OVER กรณีหกคนแลกสามใบครอบคลุมการสับกองทิ้งกลับจริงตามกติกาเดิม

อ่าน [สรุปหกเกม browser](browser-capacity-summary.json) และรายละเอียดแต่ละ checkpoint ใน browser-4/5/6-exchange-0/3.json ภาพ final-4/5/6-exchange-0/3.png เป็นหน้าคะแนนจากเกมจริงบน Emulator ประวัติการตัดสินอ้างอิงไพ่ที่ย้ายแล้ว จึงไม่นับเป็นกองไพ่เพิ่ม

Pure engine เพิ่มหกกรณี × seeds 7/42/73 รวม 18 simulations ถึง GAME_OVER ตรวจ inventory อิสระหลังทุก command รวม 4,644 transitions และตรวจนายด่าน/เงิน/คะแนน/ประวัติ PASS ดู [engine-capacity.json](engine-capacity.json)

## เกณฑ์ M5 และผลตรวจ

| ตรวจ | ผล | หลักฐาน |
|---|---|---|
| npm.cmd test | 80 ผ่าน / 6 files | [unit.log](unit.log) |
| Integration/Rules ใน test:local | 16 ผ่าน / 2 files | [acceptance.log](acceptance.log) |
| E2E full run | 15 ผ่าน / 2 ไม่ผ่านก่อนแก้ harness | [acceptance-initial.log](acceptance-initial.log) |
| test:e2e -- --last-failed บน server ใหม่ | 2 ผ่านหลังแก้ harness | [recheck.log](recheck.log) |
| E2E รวมกรณีที่ยืนยันผ่าน | 17 distinct cases ผ่าน รวมหกเกม capacity | logs สองรอบด้านบน |
| lint / typecheck | ผ่านหลังแก้ harness | [lint.log](lint.log), [typecheck.log](typecheck.log) |
| Production build | ผ่าน; หลัง build แก้เฉพาะ tests/docs | [build.log](build.log) |
| Client static bundle | private server markers 0 | [client-bundle-scan.json](client-bundle-scan.json) |
| Accessibility | 40 axe snapshots: violations 0, incomplete 0 | [accessibility-summary.json](accessibility-summary.json) |
| Cleanup | ไม่มี listener ที่ ports 19000/19099/3100/3200 หลังหยุดทดสอบ | [cleanup.json](cleanup.json) |

E2E เดิมยังตรวจครบ gameplay INSPECT/PASS/bribe/no-offer/glow, FIFO หนี้ผ่าน UI, privacy ใน DOM/RTDB payloads/API, unauthorized writes, race/dedup, unknown response หลัง commit และ retry ID เดิม, offline draft, control takeover, stale offer confirmation, rematch และ restart Next API เป็นคนละ PID ขณะ RESOLUTION พร้อมผลเงิน/result เดิมก่อนเดินรอบต่อ Financial test ใช้ precondition เฉพาะ Emulator ส่วนหกเกม capacity สร้างและเล่นผ่าน UI ทั้งหมด

สอง failure ของ full run เป็นการรอใน harness: เกม 4 คนไม่แลกติด first-load LOBBY expectation 5 วินาที และ M3 เดิมกดต่อก่อน own prepare command commit ครบ ปรับ phase wait เป็น 15 วินาที ใช้ keyboard press และรอ own-command completion/selection ก่อนเดินต่อ รันทวนสองกรณีผ่านบน server ใหม่ เก็บ initial-cold-start-trace.zip และ initial-m3-command-trace.zip ไว้ ไม่อ้างว่า full run ผ่านทั้ง 17 ในครั้งเดียว

Unit รอบแรกมี expectation มือสุดท้ายผิดเป็น N+5 แก้เป็น N ตามกติกานายด่านเก็บมือหนึ่งใบจาก merchant turn ก่อนหน้า แล้ว 80 tests ผ่าน ไม่แก้ engine เพื่อให้เข้ากับ expectation เดิม เก็บ unit-initial-expectation.log เป็นประวัติ

Accessibility ตรวจ home/lobby/rules/pack/sheriff/inspect/glow/score ที่ 360/390/430, 740×360 และ 1280×900 พร้อม keyboard, focus, text reflow และ reduced motion จาก E2E M3/M4 งานภาพสุดท้ายยังพัก ภาพและรายงานรายหน้าอยู่ ../m4/

## ขอบเขตที่ยังต้องทำต่อ

ผลนี้เป็น browser automation กับ Auth/RTDB Emulators และ local production build ยังไม่มี Firebase project จริงหรือ Vercel public deployment ผู้ใช้แจ้งว่าจะไปสร้าง Firebase project ขั้นถัดไปเชื่อม Preview เมื่อ project พร้อม โดยใช้แม่แบบและตัวตรวจใน docs/deployment-env.md ไม่ส่ง private key ในแชท

ยังไม่ได้ตรวจโทรศัพท์จริงบน Wi-Fi, screen reader จริง, human balance playtest, production Rules หรือ production cost/retention งานภาพสุดท้ายตามดีไซน์ที่ยังไม่อนุมัติยังพัก เกม 0.1 เดิมยังคงข้อจำกัดสำรับ 120 ใบตาม snapshot
