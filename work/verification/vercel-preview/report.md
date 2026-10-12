# Vercel Preview — 12 ตุลาคม 2026

ผ่านการ deploy และทดสอบ browser → Vercel API → Firebase Auth/Realtime Database จริงแล้ว ใช้ Firebase Preview `merchant-s-bluff` และ Rules ที่ผู้ใช้อนุมัติไว้ ไม่เปลี่ยน game engine, ราคา, ค่าปรับ, ค่าชดเชย หรือ UI

- Repository: https://github.com/sirasakswnk/Merchant-s-Bluff
- Branch `preview`; source commit `77e9660dfcb42e826eb4924e9ccd7717d7befeec`
- Vercel project `merchant-s-bluff` ใน `mingmings-projects-c4169f4b`; Node 24.x, Functions `sin1`
- URL ที่ตรวจ: https://merchant-s-bluff-buombdlfv-mingmings-projects-c4169f4b.vercel.app
- Deployment `dpl_HgG5ifxnEs71eB7Xg5tZRw6aAnh2`, READY, REST API target `staging` = Preview; runtime logs ยืนยัน environment `preview`
- Firebase 10 ค่า + `NODE_OPTIONS=--experimental-require-module` อยู่เฉพาะ Preview; private key เป็น Secret ไม่มี Production application variables
- Deployment Protection เปิดอยู่ เปิด URL ด้วยบัญชี Vercel ที่เข้าถึง project ได้; การเปิดให้เพื่อนทั่วไปเป็นขั้นแยก

| ตรวจ | ผล |
|---|---|
| Browser games | 4/5/6 คนจบ 8/10/12 รอบ นายด่านคนละ 2 ครั้ง |
| Conservation | 311 checkpoints: total/unique 360, ID ชุดเดิมและจำนวนรายสินค้าตรง config, เงินรวม N×50 |
| Privacy | 51 live Rules assertions ผ่าน owner/member/presence allow และ friend/nonmember/guest/root/forged write deny |
| Recovery/finance | เกม4คนผ่าน INSPECT compensation/fine, PASS bribe/no-offer, unknown-response retry ID เดิม, control takeover, offline draft/reload, rematch |
| Capacity | เกม5/6คนแลก3 ขน5 PASSทุกครั้ง; เกม6คนมี discard reshuffle จริง ไพ่ไม่หาย/ซ้ำ |
| HTTP | health200, createไม่มีFirebase token401, production POST diagnostics404; create/join/commandจริง200 รวม803 command responses |
| Mobile/browser | contexts 360/390/430/1280; final scores ตรงกัน ไม่มี overflow/pageerror; ไม่ใช่โทรศัพท์จริง |
| Client bundle | ตรวจ9 deployed JavaScript responses ไม่มี private key/email, มี projectจริง; Emulator requests0 |
| Cleanup | รอบสุดท้าย3ห้อง/16 anonymous test usersลบครบ; รอบ checkpoint เดิม1ห้อง/5usersลบครบ |
| Protection cleanup | revokeเฉพาะ bypass ที่ `vercel curl` สร้างรอบนี้ APIยืนยันไม่มีคงเหลือ; unauthenticated request302กลับหน้าVercel login |

หลักฐาน: `deployment-report.json`, `env-metadata.json`, `live-flow-report.json`, `game-live-4/5/6.json`, `protection-cleanup.json` ภาพอยู่ใน workspace และกันออกจาก Git ส่วน credentials/raw logs/runtime files อยู่ใน ignore patterns

ตั้งIgnored Build Stepให้ข้ามbuildเมื่อเปลี่ยนเฉพาะเอกสาร/หลักฐาน Commitส่งมอบจึงไม่เปลี่ยนartifactที่ทดสอบแล้ว หากsource/build configเปลี่ยนจะbuildตามปกติ ดูdocs/deployment-env.md

เก็บผลเริ่มต้นที่ไม่ผ่านแยกไว้: OIDC development tokenถูกปฏิเสธด้วย environment mismatch; runtime Firebase Admin `jwks-rsa → jose` เกิด ERR_REQUIRE_ESM จึงเพิ่ม NODE_OPTIONS แล้ว redeploy; checkpoint เดิมอ่าน authoritative/public แยกกันข้ามจังหวะ GAME_OVER จึงแก้เฉพาะ harness ให้อ่าน envelope เดียวและ assert revisionตรงกันก่อนรันทวนครบ3เกม ไม่มีการลด privacy assertion หรือแก้กติกา

Deploymentแรกถูกบริการจัดเป็นProduction จึงยกเลิกระหว่างbuild ก่อน READY; deploymentที่เปิดใช้งานและทดสอบทั้งหมดเป็นPreview ไม่มี Production release ดู [Vercel first deployment notice](https://github.com/vercel/vercel/pull/17206) REST APIใช้ค่า `staging` สำหรับPreview ส่วนค่า `preview` ถูกปฏิเสธในคำขอหลังจากนั้น

M0–M3/M5 ผ่านเกณฑ์ที่บันทึกไว้และเพิ่มหลักฐานVercelจริงแล้ว M4ยังจำกัด responsive/accessibility และพักงานภาพขั้นสุดท้าย เกมใหม่ยังใช้0.2/360ใบ เกมที่เริ่มแล้วคงsnapshotเดิม รอบนี้ไม่ได้ทวน matrixไม่แลก/แลก3ทั้ง6กรณีบนVercelอีกครั้ง; matrixครบมีผลlocal/Emulatorsใน `../rules-0.2/report.md`

ก่อนเปิดProductionยังต้องแยกFirebase Production, ตรวจretention/usage/cost และทดสอบโทรศัพท์จริง/human playtest ขั้นที่อนุมัตินี้เสร็จแล้ว รอคำสั่งขั้นต่อไป
