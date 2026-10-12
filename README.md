# พ่อค้าหน้าประตู (Merchant’s Bluff)

เว็บเกมภาษาไทยสำหรับเพื่อน 4–6 คนตาม [plan.md](plan.md) กติกา 0.2

Production environment เตรียมแล้ว: Vercel variables 14 ตัวใน scope Production, Secret สำหรับ private key/Cron, local build/API/credentials checks ผ่าน ผู้ใช้อนุมัติให้ใช้ Firebase `merchant-s-bluff` ร่วมกับ Preview และคงแผนฟรี เว็บไซต์ Production ยังไม่ deploy และ automatic deletion ยังปิด ดู [Production setup](docs/production-setup.md)

สถานะ: **Vercel Preview deploy และ multiplayer กับ Firebaseจริงผ่านแล้ว** Engine, backend, data access และ UI แยกกัน Browser contexts 4/5/6 คนเล่นครบ8/10/12รอบบนVercel พร้อมconservation311จุด/ไพ่360ไม่ซ้ำหาย, privacy51กรณีและrecoveryผ่าน ผลอยู่ [work/progress.md](work/progress.md) และ [รายงานVercel Preview](work/verification/vercel-preview/report.md)

[เปิด Preview ที่ทดสอบแล้ว](https://merchant-s-bluff-buombdlfv-mingmings-projects-c4169f4b.vercel.app) — Deployment Protectionเปิดอยู่ ต้องใช้บัญชีVercelที่เข้าถึงprojectได้ Sourceอยู่ใน [GitHub](https://github.com/sirasakswnk/Merchant-s-Bluff) branch `preview`; commitที่ทดสอบ `77e9660` ยังไม่มีProduction release

เตรียมshareable linkสำหรับกลุ่มเพื่อนแล้ว อายุ7วันถึง19ตุลาคม2026 14:37ไทย ลิงก์เต็มส่งในแชท/ไฟล์ส่วนตัวเพื่อไม่ให้tokenเข้าrepo ใช้ [วิธีเริ่มเล่นและfeedback template](docs/friend-playtest.md) ตรวจfresh browsersไม่ล็อกอินVercel4ชุดผ่านหนึ่งรอบจริง/reload และลิงก์อื่นยังถูกป้องกัน ดู [ผลตรวจ](work/verification/friend-playtest/report.md)

> ผู้ใช้อนุมัติสำรับ **360 ใบ**: แอปเปิล84 ขนมปัง72 ชีส60 ผ้า54 เหล้าเถื่อน36 หน้าไม้30 ใบกัญชา24 เปลี่ยนเฉพาะจำนวนและ rulesVersion เป็น0.2 ราคา ค่าปรับ ค่าชดเชย และกติกาอื่นคงเดิม ใช้เมื่อเริ่มเกมใหม่เท่านั้น เกมที่เริ่มแล้วคง rules snapshot เดิม ไม่มีการเติมไพ่เข้าเกมเก่า

หน้าแรกใช้ layout/สี/SVG จาก `home.html` ฟอร์มเชื่อมระบบจริงแล้ว หน้าเกมใช้ UI ชั่วคราวเรียบง่าย `merchant-gate.html` ยังไม่ใช่ดีไซน์ที่อนุมัติ M4 ทำ responsive/accessibility/safe area/reduced-motion งานภาพขั้นสุดท้ายของหน้าที่ยังไม่ได้เลือกพักไว้

## เตรียมเครื่อง

- Node.js **24.12 ขึ้นไปในสาย 24 LTS** (ตรวจบน 24.20.0), npm
- Java JDK 21 ขึ้นไปสำหรับ RTDB Emulator (เครื่องที่ตรวจมี Java 25)
- Chromium สำหรับ Playwright: `npx playwright install chromium` ครั้งแรก
- โหมด local ใช้ demo project ไม่ต้องใช้บัญชี Firebase หรือ credentials จริง

## รันในเครื่อง

Windows PowerShell ใช้ `npm.cmd`/`npx.cmd` ถ้า `npm.ps1` ถูกบล็อก ไม่ต้องแก้ Execution Policy

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run emulators
```

เปิด terminal อีกหน้าต่างในโฟลเดอร์เดียวกัน:

```powershell
npm.cmd run dev
```

เปิด http://localhost:3000 ใส่ชื่อและอวาตาร์แล้วสร้างห้อง ส่งรหัส/ลิงก์ให้เพื่อน เปิด 4–6 browser profiles หรือใช้อุปกรณ์คนละเครื่อง ทุกคนกดพร้อม ผู้จัดห้องกดเริ่มเกม ทำขั้นตอนตามปุ่มของพ่อค้า/นายด่านจนจบเกม ใช้คนละ profile สำหรับผู้เล่นคนละคน แท็บ browser เดียวกันใช้ UID เดียวกันและเป็นที่นั่งเดียว

Diagnostics ที่ “ตรวจการเชื่อมต่อ (สำหรับการพัฒนา)” → “ตรวจการเชื่อมต่อ” ตรวจ API/Auth/realtime ได้ การตรวจนี้เขียนเฉพาะข้อมูลทดสอบของ UID ที่ API ตรวจ ID token แล้ว ไม่ใช่ endpoint อ่านเกม

- Auth Emulator: port **19099**; Database Emulator: **19000**
- `GET /api/health`: liveness ไม่ใช่ database readiness
- `POST /api/dev/connect`: local smoke check ใช้ bearer token; ปิดด้วย 404 ใน production
- Emulator data เป็นข้อมูลทดสอบ จะหายเมื่อ restart ถ้าไม่ export
- Emulator scripts ใช้ Firebase CLI config ที่ `work/runtime/firebase-config/` แยกจาก credentials ส่วนตัว

## เข้า LAN

`dev` และ emulators bind 0.0.0.0 โทรศัพท์ต้องอยู่ Wi-Fi เดียวกัน เปิด `http://<IP-เครื่อง>:3000` และอนุญาต firewall ของเครื่องสำหรับ ports 3000/19099/19000 เฉพาะ private networkตามความเหมาะสม ดู IPv4 ของ Wi-Fi/Ethernet จาก `ipconfig` ตั้ง `NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=` ว่างตามตัวอย่าง Browser จะใช้ hostname ของหน้าเว็บ จึงไม่ต้องแก้ source สำหรับมือถือแต่ละเครื่อง

ตรวจ Chromium ผ่าน HTTP ของ IP interface ในเครื่องแล้ว (รวม UUID fallback, สร้าง/เข้าห้อง เล่นหนึ่งรอบและ reconnect หลัง API restart) ยังไม่ใช่ผลตรวจโทรศัพท์จริงบน Wi-Fi หากเมนูคัดลอกอัตโนมัติใช้ไม่ได้บน HTTP ให้เลือกลิงก์ในช่องแล้วคัดลอกด้วยเมนูของเครื่อง Productionใช้ HTTPS

## ตรวจและ build

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:calculations
npm.cmd run test:m0
npm.cmd run test:local
npm.cmd run build
```

`test:m0` เริ่ม/หยุด emulator ให้เอง แล้วรัน integration + Playwright บนพอร์ต 3100 ต้องปิด emulator ที่เปิดด้วยมือและ dev server ของโปรเจกต์ก่อน เพื่อไม่ชนพอร์ตหรือ Next.js dev lock

- `test:emulators`: integration + Rules บน emulators
- `test:integration`: ใช้เมื่อ emulator เปิดแล้วและตั้ง `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19099` / `FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:19000`
- `test:e2e`: ใช้ emulator ที่เปิดแล้ว; Playwrightเปิด/หยุด frontendให้อัตโนมัติ
- ผล browser: `playwright-report/`; ภาพ: `work/verification/m3/`, `m4/`, `m5/`, `rules-0.2/`
- ผลตรวจจริง/งานถัดไป: [work/progress.md](work/progress.md)
- ผลทวน 360 ใบและ M5: [รายงาน rulesVersion 0.2](work/verification/rules-0.2/report.md) — unit 80, integration 16, E2E ครบ 17 กรณีจาก full run 15 ผ่าน + targeted rerun 2 ผ่าน

`test:calculations` ตรวจผล INSPECT/PASS, cash/debt ledger และ final scoring ของ M1 (44 tests) `npm test` รวม phase machine, validation, conservation และเกม 4/5/6 คนจน GAME_OVER รวมกรณีขน5ใบ/PASSตลอดเกม ทั้งไม่แลกและแลก3ทุกครั้ง ดูผลปัจจุบันใน work/progress.md Pure engine tests แยกจากหลักฐาน browser/API/RTDB ของ test:local

สำรับ0.2มี360ใบ รองรับกรณี4/5/6คนขน5ใบและPASSทุกครั้ง ทั้งไม่แลกและแลก3ทุกเทิร์น โดยกองทิ้งยังสับกลับเมื่อกองจั่วหมด เกมเก่า0.1คง120ใบและข้อจำกัดเดิม: ถ้าไพ่จั่ว/ทิ้งไม่พอคืน `INSUFFICIENT_CARDS` โดยไม่แก้ state ครึ่งทาง ไม่รีไซเคิลคลังหรือเติมไพ่เข้าเกมนั้นเอง

Production build ต้องเอาค่า emulator ออกจาก environment และใช้ Firebase config จริงก่อน `npm run build` / `npm run start` ไม่ใช้ static export เพราะมี API Build โดยไม่มี credentials ทำได้; Firebase initialize แบบ lazy เมื่อจำเป็น

## แยกชั้น

- `src/lib/game/`: config/types/pure engine ไม่มี React/Firebase/HTTP
- `src/lib/server/`: authentication และ application services ใช้ `server-only`
- `src/lib/server/data/`: RTDB adapters และ room transaction
- `src/lib/client/`: Web SDK, anonymous persistence, subscriptions, API client
- `src/components/`, `src/app/`: UI และ HTTP adapters
- `src/lib/shared/`: schema/contracts ที่ไม่ใช่ข้อมูลลับ
- `tests/fixtures/`: seeded data เฉพาะ test ห้าม importเข้า production

ดู [docs/architecture.md](docs/architecture.md) และ [docs/rules.md](docs/rules.md) กติกาย่อและ catalogue อยู่ในห้องเล่นด้วย UI อ่าน rules snapshot ของเกมนั้น

## Vercel / Firebase (Preview ผ่านแล้ว)

Next.js Node.js Route Handlers บน Vercel กับ Firebase Auth/RTDB ไม่ใช้ Firestore, Socket.IO, local disk หรือ process-local state สำหรับเกม

แม่แบบ Preview/Production และวิธีตรวจค่าก่อนเชื่อมบริการจริง: [docs/deployment-env.md](docs/deployment-env.md) ใช้ `.env.production.example` และ `npm.cmd run check:deployment` (ตรวจ process env) หรือ `node --env-file=.env.production.local scripts/check-deployment-env.mjs` (ระบุไฟล์) ผลผ่านยังไม่ใช่การยืนยันสิทธิ์/Rules บน Firebase จริง

1. ใช้ Firebase project `merchant-s-bluff` ที่เปิด Anonymous Auth และ RTDB แล้ว Preview/Production ใช้ร่วมกันตามคำอนุมัติผู้ใช้ ส่วน local/test ใช้ Emulator
2. ตั้ง public keys ตาม `.env.example` เป็น project จริง ตั้ง `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false` ลบ `FIREBASE_AUTH_EMULATOR_HOST`/`FIREBASE_DATABASE_EMULATOR_HOST` จาก deployment env
3. ตั้ง server-only `FIREBASE_PROJECT_ID`, `FIREBASE_DATABASE_URL`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` ห้าม prefix private credentialsด้วย NEXT_PUBLIC_ หรือ commit service account JSON
4. ตั้ง Node.js 24.x ใน Vercel, installจาก lockfile, build `npm run build` ใช้ Next.js preset Previewนี้ตั้ง `NODE_OPTIONS=--experimental-require-module` หลังตรวจERR_REQUIRE_ESMจากFirebase Adminบนruntimeจริง
5. Deploy Rulesแยก: `npx firebase deploy --only database --project <project-id> --config firebase.json` เว็บ deployไม่ได้อัปเดต Rulesให้เอง
6. เพิ่ม domainsที่จำเป็นใน Firebase Auth และทดสอบ previewเมื่อมี credentials/deploymentที่อนุญาต

Rulesจริง deny root/authoritative/code index/client game writes อนุญาตเฉพาะสมาชิกอ่าน public, เจ้าของอ่าน private และเขียน presence ของตัวเองที่ผ่าน validation Emulator Rules เพิ่ม healthChecks เจ้าของเพื่อ diagnostics เท่านั้น ห้าม deployไฟล์ emulator Rulesจริง PreviewมีURLและทดสอบจริงแล้ว Productionconfigพร้อมโดยใช้Firebaseร่วมกันตามอนุมัติ ยังต้องdeployและตรวจURLจริง ใช้แผนฟรีสำหรับเล่นกับเพื่อนตามการตัดสินใจล่าสุด

M2 implementation defaults: รหัสห้อง 4 ตัวไม่ใช้ I/O/0/1 ชื่อ 1–16 ตัวและ avatar 0–7 ตาม home.html คำสั่งตรวจ UID จาก Firebase token พร้อม clientId/sessionGeneration/gameId จำกัด API 180 คำสั่งใหม่ต่อนาทีต่อ UID (retry commandId เดิมไม่นับเพิ่ม) ไม่มี deadline ของเกม

Room transaction commit authoritative + members + public/private views พร้อม revision เดียว เก็บ JSON strings เพื่อรักษา []/null ใน RTDB Command results สูงสุด 4096 ต่อเกม เก็บจน rematch แล้วเปลี่ยน session generation ทุกที่นั่งก่อนล้าง records เก่า Create code reservation pending/ready กู้ต่อได้หลัง interruption ไม่คืนห้องที่ยังสร้างไม่ครบ

`test:local` เริ่ม/หยุด emulators แล้วรัน integration + E2E ทั้งหมด `test:m0` คงเป็น alias เดิมสำหรับ workflow นี้ บน Windows runner ตรวจ runtime ของ java และใช้ JDK bin เฉพาะ child environment เพื่อหลีกเลี่ยง Oracle javapath ที่ทิ้ง JVM ค้าง ไม่แก้ PATH/Java ของเครื่อง

Dev ปิด Turbopack filesystem cache เพื่อให้การรันซ้ำบน Windowsไม่เกิด HMR restart loop ที่ตรวจพบ ไม่ลบ cacheเดิม Production buildยังใช้ค่าปกติ Restart testใช้ `.next-restart` และ port3200 แยกจาก browser tests `.next-e2e` port3100

Unknown resultเก็บ commandId/payload เดิมและต้องกดลองใหม่ก่อนส่งคำสั่งอื่น การกลับหน้าแรกไม่เขียน pending ทับ ออฟไลน์แก้ draft ส่วนตัวได้แต่ปุ่มส่งปิด ไม่มี queueตรวจ/ให้ผ่าน แท็บใหม่ต้องกดรับการควบคุม แท็บเดิมอ่านอย่างเดียว Anonymous UIDอยู่ใน browser/storage เดิม การล้าง storage/เปลี่ยนเครื่องไม่รับประกันคืนที่นั่ง

ระบบretentionตามอนุมัติ1วันพร้อมแล้ว:ห้องจบ/ยุติ/ล็อบบี้ร้างไม่มีการใช้งาน24ชั่วโมงและไม่มีคนออนไลน์เข้าเกณฑ์ล้าง ส่วนPLAYINGและlegacyที่ไม่มีmetadataถูกข้าม Default CLIเป็นdry-run พร้อมtransaction/presence fenceและdailyCronที่รอเปิดProduction ดู [วิธีใช้และข้อจำกัด](docs/retention.md) Historyจำกัดหนึ่งเกม/command records4096ตามเดิม ผู้ใช้เลือกคงแผนฟรีและข้ามการคำนวณค่าใช้จ่าย ดู [การตัดสินใจเรื่องแผนบริการ](docs/free-plan-decision.md)

Dependency audit: override `@grpc/grpc-js` เป็น1.14.6เพื่อแก้ transitive advisory; `npm audit --omit=dev` ผ่าน0รายการ Full dev-tool auditยังมี15รายการ (4 moderate/11 high) ไม่ใช้ `audit fix --force` ที่อาจเปลี่ยน majorของเครื่องมือ รายงานอยู่ work/verification/m5/

เอกสารที่ตรวจ API: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Auth Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth), [RTDB Emulator](https://firebase.google.com/docs/emulator-suite/connect_rtdb), [Rules tests](https://firebase.google.com/docs/rules/unit-tests), [Playwright accessibility](https://playwright.dev/docs/accessibility-testing), [Web Crypto on HTTP](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues), [gRPC advisory](https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j)
