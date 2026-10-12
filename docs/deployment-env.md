# เตรียม environment สำหรับ Vercel / Firebase

Firebase Preview project `merchant-s-bluff` พร้อม credentials และเผยแพร่ RTDB Rules ตามอนุมัติแล้ว ทดสอบ browser/API multiplayer ผ่าน local production build กับ Firebase Auth/RTDB จริงครบ4/5/6คนจนจบเกม และ live privacy51กรณีผ่าน ยังไม่ได้เผยแพร่เว็บ/APIขึ้น Vercel ปัจจุบันเกมใหม่ใช้สำรับ360ใบ/rulesVersion0.2ตามการอนุมัติ ส่วนเกมที่เริ่มแล้วคง snapshot เดิม

ใช้ `.env.example` สำหรับ local Emulator ใช้ `.env.production.example` เป็นแม่แบบว่างสำหรับ Preview/Production โดยกรอกค่าแยกกันตาม Firebase project ของ environment นั้น Preview ต้องไม่ใช้ฐานข้อมูลเกมจริงของ Production

## Preview ที่ตรวจแล้ว — 12 ตุลาคม 2026

- Project `merchant-s-bluff`, Web app `Merchants-Bluff`, RTDB instance `merchant-s-bluff-default-rtdb` ที่ Singapore (`asia-southeast1`) ตรวจจาก Console ที่ผู้ใช้เปิดอยู่
- `.env.preview.local` กรอก Web app config และ credentials จาก service account JSON ที่ผู้ใช้วางแล้ว ปิด Emulator และมี empty process overrides ของ host ไม่แก้ `.env.local` เดิม ไฟล์นี้และ `work/runtime/` อยู่ใน ignore patterns
- Anonymous sign-in/ID token และ browser→API→RTDB/realtimeจริงผ่านครบ4/5/6คนใน8/10/12รอบ ดู `work/verification/firebase-preview/report.md` ลบเฉพาะห้องและบัญชีที่สร้างเพื่อทดสอบแล้ว
- `node --env-file=.env.preview.local scripts/check-deployment-env.mjs` ผ่าน 10/10 ค่า `ready=true` ผลอยู่ `work/verification/firebase-preview/env-report.json`
- ผลตรวจCLIเมื่อ11ตุลาคมใช้บัญชีต่างจากConsoleและได้403 รอบนี้ใช้service-account OAuth/REST เพื่อเผยแพร่และอ่านกลับ Rules ไม่เปลี่ยนบัญชี/IAM หากใช้CLIในภายหลังต้องตรวจสิทธิ์บัญชีนั้นอีกครั้ง
- Live Rules เปลี่ยนจาก Test mode เป็น Rules ของเกมตามคำอนุมัติ12ตุลาคมแล้ว: root/client state writesปิด, viewsจำกัดสมาชิก/เจ้าของUID, presenceตรวจข้อมูล อ่านกลับ hashตรงกับsourceและliveassertions51กรณีผ่าน ดู `work/verification/firebase-preview/deployment-report.json`, `live-flow-report.json` และ `deployed-database.rules.json`

Next.js ไม่โหลด `.env.preview.local` อัตโนมัติ อย่า copy ทับ `.env.local` สำหรับ Emulator ตัวตรวจstandaloneใช้Node `--env-file`ได้ แต่ Next16.4 workerจะส่งflagนี้เข้าNODE_OPTIONSและทำให้buildล้มเมื่อเรียกCLIตรง ๆ รอบตรวจจริงจึงใช้ตัวเรียกเฉพาะworkspaceใน `work/runtime/firebase-preview/next-preview.mjs` ซึ่ง `process.loadEnvFile` ก่อนspawn Nextด้วยexecArgvว่าง Buildและstartผ่านแล้ว Vercelใช้variablesที่ตั้งในdeployment processตามปกติ ไม่ใช้ตัวเรียกlocalนี้

```powershell
# ตัวเรียก local Preview ที่ใช้ใน workspace นี้; อ่าน .env.preview.local โดยไม่พิมพ์ค่า
node work/runtime/firebase-preview/next-preview.mjs build
node work/runtime/firebase-preview/next-preview.mjs start --hostname 127.0.0.1 --port 3100
```

หลังตรวจรอบ12ตุลาคมหยุดserverที่เปิดเพื่อทดสอบแล้ว ยังไม่มีpublicURL ขั้นต่อไปตั้งvariablesแยกscopeบนVercel Preview แล้วdeployและทวนURLจริง

ผู้ใช้วาง JSON ชื่อเดิมจาก Firebase ไว้ใน `work/runtime/firebase-preview/` แล้ว ตรวจตัวตนของ service account/key และนำ `client_email`/`private_key` เข้า server env ในเครื่องโดยไม่พิมพ์ค่าออก log หรือแชท ไม่สร้าง key เพิ่มหรือเปลี่ยนชื่อไฟล์ ไม่รวม JSON/env ที่มี key กับ source หากต้องเตรียมเครื่องใหม่ใช้ key ที่ผู้ใช้จัดเตรียมในเครื่องตามแนวทางเดียวกัน

เผยแพร่ Rules และตรวจ live privacy/browser/APIจริงแล้ว รอบนี้localproductionfrontend/backendใช้FirebasePreviewจริง ไม่ใช่ผลตรวจVercel deployment การส่งเว็บ/APIขึ้นVercelเป็นขั้นต่อไป และProductionต้องแยกproject/configจากPreviewก่อนใช้งานจริง

## ค่าที่ต้องตั้ง

| Variable | รับค่าจาก | ขอบเขต |
|---|---|---|
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | ตั้ง `false` | client |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Project settings → Web app config: `apiKey` | client |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web app config: `authDomain` เฉพาะ hostname | client |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web app config: `projectId` | client |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database → URL ของ instance ที่เลือก | client |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app config: `appId` | client |
| `FIREBASE_PROJECT_ID` | project เดียวกับ client | server |
| `FIREBASE_DATABASE_URL` | instance เดียวกับ client | server |
| `FIREBASE_CLIENT_EMAIL` | Service account: `client_email` | server |
| `FIREBASE_PRIVATE_KEY` | Service account: `private_key` | server secret |

Private key รองรับ PEM หลายบรรทัดหรือข้อความที่ใช้ `\n` เมื่อใส่ในไฟล์ env ให้ใส่เครื่องหมาย double quote ครอบทั้งค่า ส่วนช่องใน Vercel ใส่ตัวค่าโดยไม่เติม quote จากรูปแบบไฟล์ env เก็บ key ใน server variable เท่านั้น ไม่ใส่ใน HTML, `NEXT_PUBLIC_` หรือ `VITE_` และไม่ส่ง key ในข้อความแชท

ลบ `FIREBASE_AUTH_EMULATOR_HOST`, `FIREBASE_DATABASE_EMULATOR_HOST`, `NEXT_PUBLIC_FIREBASE_EMULATOR_HOST`, `MERCHANT_E2E` และ `MERCHANT_RESTART_TEST` จาก Vercel settings ในแม่แบบ local มี host ว่างไว้ override ค่า demo เดิมใน `.env.local` โดยไม่แก้ไฟล์นั้น

## ตรวจในเครื่อง

```powershell
Copy-Item .env.production.example .env.production.local
# กรอกค่าจริงใน .env.production.local ผ่าน editor
node --env-file=.env.production.local scripts/check-deployment-env.mjs
npm.cmd run test:deployment
```

แม่แบบว่างต้องออกด้วย exit code 1 พร้อมรายชื่อค่าที่ขาด เมื่อค่าครบและตรวจรูปแบบผ่านจะได้ `ready: true` และ exit code 0 Output มีชื่อ variable และเหตุผลคงที่ ไม่มีค่า config/private key หรือ error จากตัวอ่าน key ไม่แก้ไฟล์ env และไม่เชื่อม network

`npm.cmd run check:deployment` ตรวจเฉพาะ environment ของ process ปัจจุบัน ใช้บน CI/Vercel ที่ตั้งค่าไว้แล้ว Script ไม่อ่าน `.env.local` โดยอัตโนมัติ; คำสั่ง `node --env-file=...` ระบุไฟล์ที่จะตรวจโดยตรง ค่าที่อยู่ใน process ก่อนแล้วมีลำดับสูงกว่าไฟล์

Next.js production โหลด `process.env` → `.env.production.local` → `.env.local` → `.env.production` → `.env` โดยเลือกค่าที่พบก่อน การรันตรวจไฟล์เดียวจึงไม่ใช่การตรวจ environment ที่รวมทุกไฟล์ของ Next.js หากมีไฟล์อื่นหรือ shell overrides ต้องตรวจค่าที่ build/runtime ใช้จริงอีกครั้ง

`ready` หมายถึงผ่านการตรวจค่าใน process: ค่าจำเป็นครบ, ปิด Emulator, ไม่เป็น demo, client/server project และ RTDB URL ตรงกัน, URL/hostname/PEM มีรูปแบบที่รองรับ และไม่มี credentials ที่ตรวจพบใน public variables ยังไม่ยืนยันว่า API key/appId ใช้งานได้, key เป็นของ service account นั้น, database เป็นของ project นั้น หรือเปิด Anonymous Auth/Rules ถูกต้อง ต้องตรวจการเชื่อมต่อจริงในขั้นถัดไป

## นำค่าขึ้น Vercel ในขั้นถัดไป

ตั้งแต่ละค่าให้ถูก scope ใน Project settings → Environment Variables แยก Preview/Production แล้วตั้ง public config ก่อน build เพราะ `NEXT_PUBLIC_*` ถูกฝังใน client bundle ตอน build การเปลี่ยนค่าเหล่านี้ต้อง build/deploy ใหม่ ใช้ Next.js preset และ Node.js 24.x ตาม README เก็บ `FIREBASE_PRIVATE_KEY` เป็น Secret

ไฟล์ `.env.preview.local`, `.env.production.local` และ service account JSON ต้องเก็บส่วนตัว แม่แบบ `.env.production.example` ไม่มีcredentialsจึงรวมกับsourceได้ การdeployเว็บและdeploy `firebase/database.rules.json`เป็นคนละขั้น ตอนนี้RulesของPreviewเผยแพร่แล้ว ส่วนVercelเว็บ/APIยังไม่ได้deploy

อ้างอิง: [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables), [Vercel environment scopes](https://vercel.com/docs/environment-variables), [Firebase Admin service accounts](https://firebase.google.com/docs/admin/setup), [RTDB URL ตาม region](https://firebase.google.com/docs/database/web/start)
