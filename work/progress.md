# Progress — 12 ตุลาคม 2026

## ขั้นตอนล่าสุด — GitHub และ Vercel Preview ผ่าน

ส่งinitial commit `77e9660` ขึ้นrepo https://github.com/sirasakswnk/Merchant-s-Bluff ทั้งmain/preview แล้วเชื่อมVercel project `merchant-s-bluff` ใน `mingmings-projects-c4169f4b` ตั้งFirebase10ค่าและNODE_OPTIONSเฉพาะPreview, private keyเป็นSecret Credentials/env/runtime/ภาพ/raw logsกันออกจากGitและCLIuploadแล้ว

URLที่ตรวจจริง: https://merchant-s-bluff-buombdlfv-mingmings-projects-c4169f4b.vercel.app — READY/Preview (`staging` ในREST API), Node24.x/Functions sin1 Deployment Protectionยังเปิดอยู่ ต้องล็อกอินVercelที่มีสิทธิ์เข้าถึงproject

4/5/6 browser contextsเล่นจบ8/10/12รอบครบ นายด่านคนละ2ครั้ง Conservation311จุด/ไพ่360และunique360/รายชนิด/IDเดิม/เงินรวมN×50 ผ่าน Liveprivacy51 assertionsผ่าน เกม4คนผ่านค่าปรับ/ชดเชย/เงินเสนอ/retryหลังcommit/offline/reload/controltakeover/rematch เกม5/6แลก3ขน5PASSตลอดและ6คนสับdiscardกลับจริง Health200/unauthcreate401/diagnostics404, command responses200จำนวน803 ไม่มีEmulatorrequests/pageerror/finalscoreoverflow ตรวจ9 deployedJSresponsesไม่มีprivate key/email

ล้างเฉพาะรอบสุดท้าย3ห้อง/16usersและรอบcheckpointเดิม1ห้อง/5usersครบ Revoke bypassที่CLIสร้างสำหรับรอบทดสอบแล้ว อัปเดตเอกสารและตรวจเกณฑ์M0–M5: ขอบเขตเดิมผ่าน M4งานภาพขั้นสุดท้ายยังพัก ไม่มีgame/rule/price/UI changes รอบนี้เพิ่มNODE_OPTIONSตามERR_REQUIRE_ESMที่พบจริง และปรับเฉพาะharnessให้อ่านstate/publicในenvelopeเดียว ไม่ถือผลเดิมเป็นหลักฐานURLใหม่

Deploymentแรกที่บริการจัดเป็นProductionยกเลิกระหว่างbuildก่อนREADY ต่อมาสร้างและทดสอบเฉพาะPreviewได้ ไม่มีProduction release รายละเอียด/ผลเริ่มต้นที่ไม่ผ่านอยู่ [verification/vercel-preview/report.md](verification/vercel-preview/report.md)

ขั้นนี้เสร็จแล้ว รอคำสั่งถัดไป ก่อนเปิดให้เพื่อนทั่วไปต้องกำหนดการเข้าถึงPreview ส่วนProductionยังต้องแยกFirebase project, retention/usage/cost, โทรศัพท์จริงและhuman playtest ไม่ทวนmatrixไม่แลก/แลก3ทั้ง6กรณีบนVercelซ้ำ ผลmatrixครบอยู่rules-0.2ตามเดิม

## ประวัติ — deploy RTDB Rules และทดสอบ Firebase จริงผ่าน

ตามการอนุมัติล่าสุด เผยแพร่เฉพาะ Rules ไปยัง `merchant-s-bluff` / `merchant-s-bluff-default-rtdb` ที่ Singapore อ่านฉบับก่อนเผยแพร่ตรงกับ review PUT200 และอ่านกลับตรงกับ repository/proposal root read/write=false ไม่เปลี่ยนบัญชี CLI/IAM ไม่ deploy Vercel

| ตรวจรอบนี้ | ผล | หลักฐาน |
|---|---|---|
| Rules deployment/readback | ผ่าน hashตรงกันหลังเผยแพร่ | verification/firebase-preview/deployment-report.json, deployed-database.rules.json |
| Live browser/API/Auth/RTDB | 4/5/6คนจบครบ8/10/12รอบ นายด่านคนละ2ครั้ง | verification/firebase-preview/live-flow-report.json, games-summary.json |
| Inventory/เงิน | 311 checkpoints, ไพ่360/unique360/รายชนิดและIDชุดเดิม เงินรวม N×50 | verification/firebase-preview/game-live-4/5/6.json |
| Live privacy/Rules | 51 assertions ผ่าน; owner/member allow, friend/guest/stranger/root/write forgery deny, own presence allow | verification/firebase-preview/live-flow-report.json |
| Recovery | 4คนผ่าน retryหลังcommit IDเดิม, control takeover, offline draft/reload, rematch | verification/firebase-preview/game-live-4.json |
| Production build/client bundle | ผ่าน; public configจริง ไม่มี demo/key/email/server markersใน14static files | verification/firebase-preview/build.log, client-bundle-report.json |
| HTTP smoke | health200, unauthenticated create401, production POST diagnostics404 | verification/firebase-preview/live-flow-report.json |
| Cleanup | latest3rooms/16users + initial1room/5users ลบเฉพาะข้อมูลทดสอบครบ; stop serverแล้ว | verification/firebase-preview/live-flow-report.json, live-flow-initial-report.json, server-cleanup.json |

รอบนี้เว็บ/API รันด้วย local production build และใช้ Firebaseจริง ไม่มี Emulator requests เกม4คนผสม INSPECT/PASS ตรวจค่าปรับ/ชดเชย/เงินเสนอ เกม5/6คนแลก3/ขน5/PASSทุกturn และ6คนสับ discardกลับจริง ไพ่ไม่ซ้ำ/หาย คะแนนทุกclientตรงกัน No pageerror/score overflow ไม่อ้างว่าทวนทั้งหก matrix บน Firebaseจริง (matrixครบยังมีผลEmulatorsเดิม)

แก้เฉพาะตัวเรียก/test harness ใน `work/runtime/firebase-preview/`: buildครั้งแรกส่ง --env-file เข้า NODE_OPTIONSของworkerแล้วล้ม จึงโหลด envก่อนspawn Nextด้วยexecArgvว่าง; live testครั้งแรก timeout5sช่วงcontrol takeover จึงรอsync20/30sแล้วรันทวนครบ3เกมผ่าน เก็บinitial logsไว้ ไม่มี product/runtime/UI/rule/price changes รายงาน [verification/firebase-preview/report.md](verification/firebase-preview/report.md)

ขั้นที่อนุมัตินี้เสร็จแล้ว ขั้นต่อไปคือ Vercel Preview environment/deploymentและตรวจบนURLจริง ยังไม่มี public URL ไม่ได้ตรวจโทรศัพท์จริง/human balance/production cost/retention และงานภาพสุดท้ายยังพัก

## ประวัติ — credentials ครบก่อนอนุมัติ deploy Rules

ผู้ใช้วาง service account JSON ใน `work/runtime/firebase-preview/` ด้วยชื่อเดิมจาก Firebase ตรวจ project/email/token endpoint/RSA key ตรงกับ `merchant-s-bluff` แล้วเติม `.env.preview.local` เฉพาะในเครื่อง ไม่แสดง key/token ไม่เปลี่ยน runtime/game/UI และไม่แก้ `.env.local` สำหรับ Emulator

- Environment checks ผ่าน 10/10 `ready=true`: `verification/firebase-preview/env-report.json`
- เรียก server module `firebase-admin.ts` จริง ได้ service account OAuth token และ Admin SDK อ่าน RTDB probe path สำเร็จ ไม่เขียนข้อมูลเกม
- Anonymous Auth ด้วย Web SDK จริงและ Admin SDK verify ID token/project/provider ผ่าน ลบเฉพาะ test user ที่สร้างใหม่แล้ว: `verification/firebase-preview/preflight-report.json`
- Live Rules อ่านด้วย OAuth ได้ HTTP200 แต่เป็น Test mode เปิด root read/write จน 10 พฤศจิกายน 2026 เวลา00:00 Asia/Bangkok ไม่ตรงกับ Rules ที่ป้องกันไพ่ลับของเกม: `verification/firebase-preview/rules-report.json`
- Rules read ครั้งแรก parse ไม่ผ่านเพราะ JSON มี comments ใช้ parser รองรับ comments ทวนเฉพาะ Rules สำเร็จ บันทึก initial report ไว้ ไม่แก้ product code เพื่อให้ผ่าน

ยังไม่เปิด Next Preview server หรือสร้างห้องทดสอบจริง เพราะ Rules เป็น boundary ที่ไม่ผ่าน ยังไม่ได้ deploy Rules/Vercel จัดเตรียม Rules ปัจจุบัน/Rules ที่เสนอและรายงานพร้อมผล Emulator integration16ที่เคยผ่านแล้ว รออนุมัติเผยแพร่ Rules ไปยัง instance นี้ ดู [verification/firebase-preview/rules-review.md](verification/firebase-preview/rules-review.md) หลังเผยแพร่จึงทวน browser→API→RTDB/realtime และ live privacy เป็นขั้นต่อไป CLI account เดิมยังไม่ได้เปลี่ยน แต่ service account ใช้ OAuth อ่าน Rules ได้แล้ว

## ประวัติ — เตรียม Firebase Preview ก่อนผู้ใช้วาง credentials

ผู้ใช้ระบุ project ID `merchant-s-bluff` ตรวจ project ที่เปิดอยู่ใน Edge/Firebase Console จริง มี Web app `Merchants-Bluff` และ RTDB instance `merchant-s-bluff-default-rtdb` ที่ Singapore (asia-southeast1) อ่าน config/service account email แล้วสร้าง `.env.preview.local` แยกจาก Emulator `.env.local` ตั้ง emulator mode=false และ host overrides ว่าง Anonymous Auth แสดง Enabled ใน Console

ตัวตรวจ `node --env-file=.env.preview.local scripts/check-deployment-env.mjs` พบ 9/10 ค่า ขาด `FIREBASE_PRIVATE_KEY` เท่านั้น exit1 ตามคาด บันทึก `verification/firebase-preview/env-report.json` และ `status.json` ไม่มี key หรือ config values ในรายงาน Firebase CLI มีบัญชีที่ล็อกอินอยู่ แต่เป็นคนละบัญชีกับ Console การอ่าน apps/RTDB ของ project นี้ได้ 403 PERMISSION_DENIED จึงอ่าน public config จาก Console แทน

ขั้นนี้ยังไม่ได้สร้าง private key, ลงชื่อเข้า CLI ใหม่, เปลี่ยน Auth/Rules/IAM, เชื่อม backend, เขียนข้อมูลเกมจริงหรือ deploy ให้ผู้ใช้เก็บ service account JSON ไว้ที่ `work/runtime/firebase-preview/service-account.json` (โฟลเดอร์ ignored เตรียมแล้ว) โดยไม่ส่ง key ในแชท จากนั้นจึงเติม server credentials และตรวจการเชื่อมต่อจริง งาน config ขั้นนี้ไม่มี runtime/game/UI changes จึงตรวจเฉพาะ environment ไม่ rerun ผลเกมด้านล่าง ดูวิธีต่อใน docs/deployment-env.md

## ประวัติ — สำรับ 360 ใบ / rulesVersion 0.2 และทวน M5 local ผ่าน

ตามการอนุมัติล่าสุด เพิ่มจำนวนเป็น แอปเปิล 84, ขนมปัง 72, ชีส 60, ผ้า 54, เหล้าเถื่อน 36, หน้าไม้ 30, ใบกัญชา 24 รวม 360 ใบ อัปเดต config, fixtures, tests, docs และ rulesVersion เป็น 0.2 ราคา ค่าปรับ ค่าชดเชยและกติกาอื่นทั้งหมดคงเดิม มี regression เทียบทุกค่ากับ snapshot 0.1 โดยยกเว้นเฉพาะจำนวนและ version

เกมใหม่รวมหลัง rematch ใช้ snapshot 0.2 เกมที่เริ่มแล้วคง snapshot และไพ่เดิม ไม่ migrate หรือเติมไพ่ Integration บันทึกเกม 0.1 ลง RTDB Emulator แล้ว resume/แลกผ่าน service instance ใหม่ ยืนยันยัง 120 ใบ ก่อนยุติ/rematch/เริ่มใหม่จึงเป็น 360 ใบ Server entropy เพิ่มจาก 256 เป็น 360 samples เพื่อสับสำรับใหม่ครบ โดยใช้ชุดเดิมเมื่อ transaction retry

| ตรวจรอบนี้ | ผล | หลักฐาน |
|---|---|---|
| Unit / pure engine | 80 ผ่าน รวม 18 เกมขน 5 ใบ/PASS ตลอด และตรวจ 4,644 transitions | verification/rules-0.2/unit.log, engine-capacity.json |
| Integration / Firebase Rules | 16 ผ่าน บน Auth/RTDB Emulators รวม snapshot เดิมและ rematch ใหม่ | verification/rules-0.2/acceptance.log |
| Chromium E2E | ผ่านครบ 17 กรณี: full run ผ่าน 15 และ targeted rerun ผ่าน 2 หลังแก้ test harness | verification/rules-0.2/acceptance-initial.log, recheck.log |
| Matrix ขน 5 ใบ/PASS ทุกครั้ง | 4/5/6 คน ทั้งไม่แลกและแลก 3 ใบทุกเทิร์น ถึง GAME_OVER ครบ 8/10/12 รอบ นายด่านคนละ 2 ครั้ง | verification/rules-0.2/browser-capacity-summary.json และ browser-*.json |
| จำนวนไพ่ / instance | ทุก checkpoint รวม 360, unique 360, จำนวนรายชนิดตรง config และ ID ชุดเดิม | verification/rules-0.2/browser-*.json, engine-capacity.json |
| Responsive / accessibility | 40 axe snapshots, 0 violations, 0 incomplete; keyboard/reflow/reduced motion ผ่าน | verification/rules-0.2/accessibility-summary.json และ verification/m4/ |
| lint / typecheck / production build | ผ่าน; client static bundle ไม่พบ private server markers | verification/rules-0.2/{lint,typecheck,build}.log, client-bundle-scan.json |
| Cleanup | หยุด server/emulators ที่เปิดเพื่อทดสอบแล้ว ports 19000/19099/3100/3200 ไม่มี listener | verification/rules-0.2/cleanup.json |

ใน full run สองกรณีติดการรอของชุดทดสอบ: โหลดห้องครั้งแรกเกิน phase expectation 5 วินาที และชุด M3 เดิมกดต่อก่อนคำสั่งเตรียมของครบ ปรับ phase wait เป็น 15 วินาทีและรอ own-command commit/aria-pressed ใน harness แล้วรันทวนเฉพาะสองกรณีบน server ใหม่ผ่าน ไม่เปลี่ยน engine หรือ product UI เพื่อแก้ผลทดสอบ ไม่อ้างว่า full run ผ่าน 17 ในครั้งเดียว รายงานและ trace เดิมอยู่ [verification/rules-0.2/report.md](verification/rules-0.2/report.md)

เกณฑ์ M0–M5 ในขอบเขต local ผ่านการทวนสำหรับ 0.2 รวม race/dedup/privacy/retry/offline/reconnect, เกมครบ 4/5/6 คน และ restart Next API คนละ PID ระหว่าง RESOLUTION งาน M4 เฉพาะ responsive/accessibility ยังคงผ่าน หน้าแรกอ้างอิง home.html และงานภาพสุดท้ายของ merchant-gate.html ยังพักตามคำสั่ง

ขั้นถัดไปคือเชื่อม Firebase Preview จริงเมื่อ project พร้อม ผู้ใช้แจ้งว่ายังไม่ได้สร้างและจะไปสร้าง แม่แบบและตัวตรวจ environment เตรียมแล้ว ดู docs/deployment-env.md ยังไม่มีผลทดสอบ Firebase/Vercel จริง ไม่มี public deployment และไม่ได้ตรวจโทรศัพท์จริงหรือ human balance playtest ไม่ส่ง private key ในแชท

## ประวัติ — เตรียม environment ก่อนปรับสำรับ 360 ใบ

ตามคำสั่งใหม่ ทำครั้งละหนึ่งขั้นตอน → ทดสอบ → สรุป → หยุดรอ ไม่เดินต่ออัตโนมัติ ขั้นนี้สร้าง .env.production.example แบบว่าง, docs/deployment-env.md, scripts/check-deployment-env.mjs และ scripts check:deployment/test:deployment แยกจากแม่แบบ local demo ไม่มีการแก้ .env.local หรือ source ของ engine/backend/UI

ตัวตรวจอ่าน process env เท่านั้น ระบุไฟล์ได้ด้วย Node --env-file ตรวจค่าจำเป็น10ชื่อ/ปิดEmulator/demo/projectและURLตรงกัน/RTDBHTTPSroot/hostname/serviceaccountemail/RSAprivatekey/credentialsที่พบในpublicvariables โดย outputเฉพาะชื่อและเหตุผลคงที่ ไม่มีค่าลับ ไม่เรียกnetwork ready=true คือ config checks ไม่ใช่ proofว่าสิทธิ์หรือRulesจริงถูกต้อง

| ตรวจรอบนี้ | ผล | หลักฐาน |
|---|---|---|
| test:deployment | 7 tests ผ่าน รวม CLI exit codes และไม่เปิดเผยค่าใน output; RSA fixture สร้างชั่วคราวใน memory | verification/deployment-env/tests.log |
| lint / typecheck | ผ่าน | verification/deployment-env/lint.log, typecheck.log |
| ค่าปัจจุบัน .env.local | ready=false: ยังเป็นdemo/มีEmulatorhosts/ขาดAdminemailและkey; exit1ตามคาด | verification/deployment-env/local-report.json |
| แม่แบบ production ว่าง | ready=false: ขาด9ค่า; exit1ตามคาด | verification/deployment-env/template-report.json, exit-codes.json |

ไม่ได้ rerun browser/เกมเต็มในรอบนี้ เพราะเปลี่ยนเฉพาะ tooling/แม่แบบ/เอกสาร ไม่มีการเปลี่ยน runtime หรือกติกา 120ใบ ผลM0–M5ด้านล่างเป็นผลเดิมที่เคยตรวจไว้ ยังไม่ได้สร้างproject/ตั้งค่าบัญชี/deployRules/deployเว็บ/ทดสอบFirebaseจริง ขั้นต่อไปเมื่อผู้ใช้สั่งคือเตรียม Firebase project/config จริงสำหรับ Preview แยกจาก Production ห้ามส่ง private key ในแชท ตอนนี้หยุดรอคำสั่งถัดไป

## ประวัติสถานะส่งมอบ local — rulesVersion 0.1 / 120 ใบ

M0–M3 ผ่าน, M4 responsive/accessibility ผ่าน (ภาพสุดท้ายยังพัก), M5 local verification ผ่าน หน้าแรกอ้างอิง home.html; merchant-gate.html ยังไม่อนุมัติ สำรับ **120 ใบ** ตามการยืนยันล่าสุด ไม่เปลี่ยนราคา/จำนวนรายชนิด กติกา 0.1

| ผลล่าสุด | จำนวน/ผล | หลักฐาน |
|---|---|---|
| Pure engine/unit | 73 ผ่าน | verification/m5/unit.log |
| Integration/Rules บน Emulators | 15 ผ่าน | verification/m5/acceptance.log |
| Chromium E2E | 11 ผ่าน | verification/m5/acceptance.log |
| Browser games | 4/5/6 คนครบ 8/10/12 รอบ; sheriff ทุกคน 2 ครั้ง | verification/m5/game-5.json, game-6.json; m3/ |
| Accessibility/responsive | 40 axe snapshots ไม่พบ violations; 5 viewports, 200% text reflow, keyboard/reduced motion | verification/m4/ |
| lint/typecheck/build | ผ่าน | verification/m5/{lint,typecheck,build}.log |
| Production HTTP smoke | home/health200, diagnostics404, unauthenticated create401 | verification/m5/production-smoke.json |
| Production dependency audit | 0 รายการ | verification/m5/audit-production.json |

Unknown-result test ทิ้ง HTTP response หลัง commit จริง กด retry payload/commandId เดิมได้ผลเดิม ผ่านทั้งกรณีกลับหน้าแรกแล้วกลับห้องและหลายแท็บ ออฟไลน์แก้ draft ได้ คำสั่งไม่ถูก queue ตรวจ stale offer หลังเปิด confirmation และ double decision พร้อมกันไม่เก็บเงินซ้ำ

Financial UI test ใช้ precondition เฉพาะ Emulator (นายด่าน cash0 จาก earlier ledger payment และจัดมือ legal โดยรักษา120instances) จากนั้นผู้เล่นกดตรวจจริงเกิดหนี้2+2 และ PASSเงิน3ชำระหนี้แรก2/หนี้ถัดไป1 เหลือ1 ทุกหน้าจอเงินรวม200และหนี้ตรงกัน ดู finance-ui.json และ fifo-debt-ui.png ไม่ใช่การตั้งราคาหรือผลเกมในแอป

Restart test หยุด Next API process จริง แล้วเปิดใหม่คนละ PID ปิด/เปิด client tabs ใน contextเดิม, resume/claim lease และอ่าน RESOLUTION เดิมพร้อมเงิน/resultIdเดิม ก่อนกดเดินเกมต่อ ฐานข้อมูล Emulatorยังรันอยู่ นี่ไม่ใช่การ restart Database Emulator ที่ไม่มี export หรือผลตรวจ production Firebase

ตรวจ HTTP ผ่าน local IP interfaceบนเครื่องเดียวพร้อม isSecureContext=false; UUID ใช้ getRandomValues fallback และ clipboardมีช่องคัดลอกเอง อ่านวิธีชวนเพื่อน LAN ใน README โทรศัพท์จริง/เครือข่าย Wi-Fi/production deployยังไม่ได้ตรวจ ไม่มี public URL, commit หรือ push

ข้อจำกัดสำรับ: PASS5ทุกคนทุกรอบ4คนจะเติมมือหลังรอบ7ไม่พอ endRoundคืน INSUFFICIENT_CARDS และรักษา ROUND_SUMMARY/ไพ่/เงินเดิม ไม่เพิ่มไพ่หรือสับคลังเอง การรับประกันสำรับพอทุกลำดับต้องให้ผู้ใช้ตัดสินใจกติกาเพิ่มเติม ผู้จัดยุติแล้ว rematchได้ ไม่มี fake winner

Dev ปิด Turbopack filesystem cache หลังพบ reused-cache HMR restart loopบนWindows แล้ว local suiteผ่านซ้ำ ไม่ลบ cacheเก่า Product effectsใช้ผล serverเท่านั้น; glowคง eventเดิมผ่าน revision update และไม่ replayในแท็บใหม่ รายงานตรวจเฉพาะ glow-refresh อยู่ verification/m5/glow-refresh.log

แก้ grpc transitive dependencyด้วย override1.14.6 Full development auditยัง15รายการ (moderate4/high11) อยู่ audit-all.json ไม่มี auto-major upgrades Retentionห้องเก่าหรือการตรวจค่าใช้จ่าย productionยังไม่ได้ทำ ผลเก่าด้านล่างเป็นประวัติแต่ละ milestone ไม่ใช่สถานะปัจจุบัน

## M0 — ผ่านแล้วด้วยสำรับ 120 ใบ

- [x] ตรวจ workspace และ ancestor instructions: เดิมมี plan.md เท่านั้น ไม่มี Git repository/โค้ดเดิม/AGENTS.md
- [x] ตั้ง Next.js App Router/TypeScript สำหรับ Vercel Node.js API และ Firebase Auth/Realtime Database
- [x] แยก game config/types, server services, RTDB data adapters, client data access และ UI
- [x] Scripts dev/build/start/typecheck/lint/unit/integration/emulator/E2E พร้อม package-lock.json
- [x] Configสินค้า 7ชนิดตามชื่อ ราคา และจำนวนในตารางเดิม Rules version 0.1 snapshot และ seeded fixtures (test-only)
- [x] README, .env.example และ .env.local แบบ demo ไม่มี credentials จริง
- [x] เปิดหน้าเว็บและ health API จริง
- [x] เปิด Auth/Database Emulators จริง และตรวจ token → API → RTDB → realtime listener
- [x] Browser reload ใช้ anonymous UID เดิม
- [x] ผู้ใช้ยืนยันล่าสุดให้ใช้ 120 ใบแทน 140 ยอดรวมตรงกับตาราง จำนวนรายชนิดและราคาคงเดิม

## ผลตรวจจริง

| Check | ผล | หลักฐาน |
|---|---|---|
| npm run build | ผ่าน production build | verification/m0-120/build.log |
| npm run typecheck | ผ่าน | verification/m0-120/typecheck.log |
| npm run lint | ผ่าน ไม่มี warnings | verification/m0-120/lint.log |
| npm test | 49 ผ่าน | verification/m0-120/unit.log |
| npm run test:m0 | integration 5 + E2E 2 ผ่าน โดย script เริ่ม/หยุด Emulators ให้เอง | verification/m0-120/emulators-browser.log |

Integrationตรวจ Anonymous Auth/Admin verifyIdToken, server write→Web SDK listener, owner-only read, denyเพื่อน/guest/client write, deny root/rooms/authoritative/views/index และ forged token การทดสอบ Rulesโหลดไฟล์ rules โดยตรงใน namespace ของ test environment ส่วน app smokeใช้ namespace default-rtdbตาม config ไม่มี credentials จริง

Browserตรวจ API401สำหรับไม่มี token/ปลอม,403สำหรับ originไม่ตรง,200สำหรับ browserที่ authenticated แล้ว, realtime responseและ reload UIDเดิม ตรวจ UI 360×740,390×844,430×932,740×360,1280×800 ไม่พบ horizontal overflow ปุ่มอย่างน้อย44×44และ Tab focusได้ ตรวจภาพ360และ1280จริง ภาพทั้งหมดอยู่ verification/m0/ มี connected-390.pngสำหรับผลเชื่อมต่อสำเร็จ

Client bundle scan ไม่พบ FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL/firebase-adminใน .next/static/chunks (rg exit1 = ไม่มี match)

## รายละเอียดที่แก้จากการตรวจจริง

- ใช้ ESLint9.39.5เพราะ React lint pluginยังไม่รองรับ ESLint10 และ npm lsไม่มี peer conflict
- Emulator CLI configแยกใน work/runtime/firebase-config เพราะ workspaceจำกัดสิทธิ์เข้าถึง config ส่วนตัว ไม่แก้ configหรือcredentialsส่วนตัว
- E2Eใช้ .next-e2eแยกจาก dev build และreuse serverได้เฉพาะ local; CIเปิดserverใหม่
- Next allowedDevOriginsจำกัด localhost/127.0.0.1/IP localของเครื่อง เพื่อให้ client hydrateและLANโดยไม่ต้องแก้sourceแต่ละเครื่อง ไม่เปิดwildcard
- Origin validationเทียบ Originกับ Hostของrequestจริง เพราะ Request.urlใน Next devใช้hostnameภายในได้

## ขอบเขตตอนผ่าน M2 — ประวัติ ก่อนการส่งมอบด้านบน

M0–M2 ผ่านแล้ว ยังไม่ได้เล่นครบเกม4browser contextsผ่านUI(M3), full-flow responsive/accessibility(M4), release/E2E4–6คน/actual process restart(M5) LAN/มือถือจริงและVercel/Firebaseจริงยังไม่ได้ตรวจ ไม่มีcommit/push/deploy

UIชั่วคราวไม่ยึด merchant-gate.html M4เลื่อนงานภาพขั้นสุดท้ายจนผู้ใช้เลือกดีไซน์ ยังไม่เปลี่ยนกติกาหรือราคา

ขั้นต่อไปในเวลานั้น: M3 UI สร้าง/เข้าห้องและ gameplay ครบเฟส ผ่าน API/RTDB จริง ใช้ home.html สำหรับหน้าแรกและ placeholder สำหรับเกม (เสร็จแล้ว ดูผลล่าสุดด้านบน)

## รับดีไซน์หน้าแรก — home.html

ผู้ใช้ส่ง home.html เป็นดีไซน์หน้าแรกแล้ว อ่าน source และตรวจภาพด้วย Chromium ที่ 390×844 และ1280×900 ไม่พบ horizontal overflow/pageerror มีสินค้า7ชนิดและแสดงสำรับ120ใบ

บันทึก component/data/API mapping และจุดที่ต้องรักษากติกาไว้ใน docs/home-design.md ยังไม่ได้เปลี่ยนหน้า Next.js ต้นฉบับ home.html คงเดิม การสร้าง/เข้าห้องในไฟล์ยังเป็น simulation ต้องเชื่อม APIจริงใน M2–M3 หน้าอื่นยังใช้placeholderและพักงานภาพที่ไม่ได้เลือกตามคำสั่งเดิม จำนวน 120 ใบตรงกับคำสั่งผู้ใช้ล่าสุดแล้ว

## M1 — ส่วนคำนวณที่ไม่ขึ้นกับจำนวนสำรับ

ส่วนนี้ทำก่อนปิด M0 ขณะยอดรวมเดิมขัดกับตาราง ปัจจุบันผู้ใช้แก้ยอดรวมเป็น 120 ใบแล้วและ M0 ผ่าน M1 ยังต้องทำ phase machine และ simulation ครบเกมต่อ

- resolution.ts: ตัวอย่างผลตรวจทั้ง 4 กรณีตามแผน ผ่าน legal ที่ต่างคำแจ้ง ปรับเฉพาะ contraband ไม่มี compensation เมื่อพบ contraband INSPECT ไม่โอนข้อเสนอ PASS โอนข้อเสนอและคืน boolean สำหรับ glow
- ledger.ts: เงินสดไม่ติดลบ ค่าปรับ/ชดเชยส่วนขาดเป็นหนี้ เงินรับชำระ FIFO และส่งต่อแบบ queue หนี้วงกลมยุติได้ ไม่มี netting เอง BRIBE ห้ามกู้ ทุกผลเป็นข้อมูลใหม่ไม่แก้ input
- scoring.ts: มูลค่าสินค้าเฉพาะ stash + เงินสด + โบนัส + ลูกหนี้ − หนี้ แบ่งโบนัส floor(8/k) ไม่มีผู้ถือไม่แจก คะแนนเท่ากันเทียบจำนวน legal แล้วยังเสมอชนะร่วม
- typed financial/ledger/resolution/score contracts และ GameRuleError อยู่ชั้น game ไม่มี dependency UI/backend

| ผลก่อนผู้ใช้ยืนยันแก้ยอดรวมเป็น 120 | ผลจริงในรอบนั้น | หลักฐาน |
|---|---|---|
| npm run test:calculations | 44 ผ่าน (ledger/resolution/scoring) | verification/m1-calculations/calculations.log |
| npm run typecheck | ผ่าน | verification/m1-calculations/typecheck.log |
| npm run lint | ผ่าน ไม่มี warnings | verification/m1-calculations/lint.log |
| npm test | 48 ผ่าน / 1 ไม่ผ่าน: สำรับยัง 120 จากตารางที่กำหนด เทียบกับ expected 140 | verification/m1-calculations/unit.log |

Ledger stress test ใช้ 600 payments ต่อ simulation สำหรับ 4/5/6 คน ตรวจเงินสดคงที่ทุกครั้งและผล deterministic ไม่ใช่ simulation ครบเฟสเกม การตรวจ boolean ภายใน resolution ไม่ใช่หลักฐาน privacy ของ API/RTDB/DOM ซึ่งยังเป็นงาน M2/M3 ยังไม่ได้รัน integration/browser ใหม่ในรอบนี้เพราะไม่ได้เปลี่ยน backend/UI

## M1 — Pure engine ผ่านแล้ว

- แจก/สับ/เปลี่ยน/lockBag และ barriers ครบ ระบุจำนวนกระเป๋าจากของจริง ปิดแล้วแก้ไม่ได้
- Round rotation/sheriff 2 ครั้ง/merchant 6,8,10 ครั้งสำหรับ 4,5,6 คนครบ ผ่าน full simulation แบบ deterministic พร้อม inspect/pass และการสับกองทิ้ง
- ข้อเสนอ submitted=0 แยกจากไม่เลือก ตรวจ stale offer version ก่อนตัดสินและล็อกหลังตัดสิน ผล commit ก่อน manual acknowledge/endRound
- Every transition ตรวจไพ่จริงใน deck+discard+hand+bag+stash ครบ 120 ไม่ซ้ำ/หาย พร้อมเงินสดรวม N×50 จบเกมได้คะแนนและ shared winners
- Engine pure ไม่มี Firebase/UI/HTTP; command context รับ fixed server entropy เพื่อประเมิน transaction retry ซ้ำได้โดยไม่ mutate input

ผลจริง: npm test 73 ผ่าน, typecheck/lint ผ่าน หลักฐาน verification/m1/{unit,typecheck,lint}.log ไม่ใช่หลักฐาน multiplayer

ข้อจำกัดสำรับที่พิสูจน์ด้วย test: 4 คน PASS กระเป๋า 5 ใบทุกรอบจะขาดไพ่เติมมือหลังรอบ 7 คำสั่ง endRound ถูกปฏิเสธด้วย INSUFFICIENT_CARDS โดย state อยู่ ROUND_SUMMARY เดิม ไพ่/เงินไม่สูญหาย ไม่รีไซเคิล stash หรือเพิ่มไพ่เอง ตามข้อ 2.3 ของแผน

## M2 — ห้องและ API multiplayer ผ่านแล้ว

- create/join/ready/start/capacity, anonymous verified token, strict commands และ origins
- RTDB serialization ครอบ room/snapshot/membership/public/private revision พร้อมกัน พร้อม dedup fingerprint และ stale offer checks
- pending reservation recovery, generation control takeover, read-only resume, abort/rematch reset/epoch policy และ host succession ที่ server ตรวจ presence
- Rules เปิดเพียง exact views paths ตามสมาชิก/UID และ validated own presence Deny root/ancestor/authoritative/index/membership/client game writes
- Privacy เปรียบเทียบ public view ทั้ง object/serialized RTDB payload สำหรับ PASS ขนาดเท่ากัน contraband 1 vs 4 ใบ ต้องเหมือนกัน ไม่มี instanceId/stash/goodsValue/secret product IDs
- API tests ใช้ Firebase Web SDK clients 4 instances มี Anonymous Auth จริง เล่นครบหนึ่งรอบ ผ่าน HTTP และ realtime snapshots ไม่ใช่ browser contexts 4 คนครบเกม ซึ่งอยู่ M3

ผลจริง: unit 73 ผ่าน, integration 15 ผ่าน, E2E 5 ผ่าน, typecheck/lint/build ผ่าน หลักฐาน verification/m2/ ทดสอบ two Admin SDK instances และ service instances ใหม่ แต่ยังไม่ทดสอบ restart OS process จริง

Runner Windows แก้ Oracle javapath ที่ปล่อย JVM child ค้าง โดย resolve java.home แล้วใช้ JDK bin เฉพาะ child env ตรวจหลัง emulator run ไม่เหลือ listeners 19000/19099/3100 ไม่แก้ installation/ระบบ PATH
