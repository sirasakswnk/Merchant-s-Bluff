# Architecture — M0 / M1

11 ตุลาคม 2026: โฟลเดอร์เดิมมี plan.md เท่านั้น ไม่มี AGENTS.md, README, package manifest, Git repository หรือ codeให้ย้าย/ทับ เลือก Next.js App Router + TypeScriptตามแผน Backend เป็น Node.js Route Handlersสำหรับ Vercel Firebase Anonymous Authให้ identity และ RTDBเป็น persistence/realtime transport

Dependency versionsตรวจ registryและเอกสารทางการก่อนใช้ เก็บ package-lock.json ใช้ TypeScript 5.9.3สำหรับ toolchainที่รองรับร่วมกัน Node 24 LTSร่วมกับ Firebase Admin/Rules testing

## ขอบเขตชั้น

UI → client API/data access → Route Handler → authentication/service → RTDB repository

Engineอยู่ src/lib/game รับ/คืน plain serializable data ไม่มี React/Firebase/HTTP Rules snapshotจะบันทึกต่อเกมใน M1/M2 UIอ่านชื่อ/ราคาจาก configเดียวกัน Seeded PRNGอยู่ fixturesเท่านั้น RNGจริงและ private stateจะเป็น server-only

Health APIพิสูจน์ liveness ส่วน emulator-only endpointพิสูจน์ token verification + Admin write/read + owner-scoped Web SDK listener M2 เพิ่ม room commands/transactions/projections และ Rules แล้ว

## ส่วนคำนวณ M1 ที่ทดสอบแล้ว

- ledger.ts รับ/คืน FinancialState แบบ serializable โอนเฉพาะเงินสดที่มี บันทึกส่วนขาดเฉพาะค่าปรับ/ชดเชย ห้ามกู้เพื่อเสนอเงิน และชำระหนี้เก่าตาม createdOrder
- การชำระต่อใช้ queue ลด outstanding ก่อนส่งเงินให้เจ้าหนี้ หนี้วงกลมจึงลดลงจริง ไม่มี recursion หรือการหักกลบหนี้เอง รายการโอนและหนี้ใช้ลำดับจาก state ไม่ใช้เวลาจาก client
- resolution.ts คำนวณผลตามสินค้าจริง Legal ต่างจากคำแจ้งยังผ่านและชดเชย ตรวจไม่จ่ายข้อเสนอ PASS โอนยอดข้อเสนอเท่านั้น
- scoring.ts ใช้คลังสินค้า เงินสด โบนัส ลูกหนี้และหนี้คงค้าง แบ่งโบนัสแบบ floor และจัดอันดับด้วยคะแนน/จำนวน legal ชนะร่วมได้
- ฟังก์ชันเหล่านี้ไม่ mutate input และไม่ import UI/Firebase/HTTP ผล resolution/score มีข้อมูลลับ เป็น authoritative-only ต้องผ่าน projection ใน M2 ก่อนส่ง API/RTDB ให้ client
- ฟังก์ชันคำนวณถูกเชื่อมใน engine.ts แล้ว Engine ตรวจ phase/round/role/ownership/offer version และเปลี่ยน state แบบ atomic copy แต่ยังไม่เรียก API จริง Authentication, session, gameId และ commandId dedup อยู่ใน M2 การเรียกฟังก์ชันซ้ำไม่ใช่หลักฐาน network idempotency

FinancialState ที่ commit แล้วต้องไม่มีเงินใช้ได้เหลืออยู่กับผู้มีหนี้คงค้าง การรับเงินชำระหนี้และส่งต่ออยู่ใน transformation เดียวกัน Engine invalidate ข้อเสนอที่เกินเงินใช้ได้แล้วบังคับยืนยันใหม่ การตัดสินใช้ expectedOfferVersion และ resultId คงที่จาก commandId

## Pure phase engine

startGame / applyGameCommand รับ entropy เป็น samples ที่ server สร้างก่อน transaction ทุกการประเมินเริ่ม cursor ใหม่จาก samples ชุดเดิม Callback retry จึงไม่สุ่มซ้ำ Seeded generator อยู่ tests/fixtures เท่านั้น State เก็บ deck/discard/hands/bags/stashes, selected merchant, resolution/history, finance ledger, rules snapshot และ manual phase เต็มรูปแบบ ไม่มี clock/timer/animation เดินเฟส

ทุก transition ตรวจ source catalog instance IDs ตาม rules.totalCards ของ snapshot นั้น: เกมใหม่0.2ครบ360ใบ เกมเดิม0.1ยัง120ใบ ทุก active zone และเงินสดรวม N×50 การแลกจั่วก่อนทิ้งไพ่ที่เลือก แก้จำนวนไพ่ไม่พอด้วย error ที่ input ไม่เปลี่ยน นายด่านเก็บมือเดิมและไม่จั่วในรอบตัวเอง การเดิน RESOLUTION/ROUND_SUMMARY ต้อง command นายด่าน

Phase engine ไม่อ่าน display name หรือ host role Host ไม่ได้รับสิทธิ์นายด่านเพิ่มเติม SetOffer ของพ่อค้าที่ยังไม่ถูกตัดสินทำได้ขณะผลคนอื่นรอ acknowledge ด้วย

## M2 ที่ต้องรักษา

- Transactionที่ rooms/{roomId} commit authoritative/members/dedup/public/private viewsพร้อม revisionเดียวกัน ไม่มี process-local mutex
- Callbackเป็น pure transformation ใช้ entropy/command inputsคงที่ตลอด retries
- Rules default-deny; publicเฉพาะสมาชิก privateเฉพาะเจ้าของ authoritative/root/index server-only
- ไม่ส่ง deck/hand/bag/stash/score secretใน public/API responseระหว่างเกม
- Commandsตรวจ UIDจาก token, session generation, membership/role/phase/gameId/offer version
- Control leaseคนละเรื่องกับ presence ทุก decision idempotentด้วย commandId
- Browser subscribeเฉพาะ public/private paths รอ revisionตรงกันก่อนทำ actions
- Presence onDisconnectต่อ connection ใช้แสดงสถานะ ไม่เดินเกมหรือ auto-pass

## M2 room persistence และ privacy

room-service.ts เป็น application service รับ UID จาก HTTP adapter หลัง verify token room-repository.ts ทำ RTDB transaction ที่ rooms/{roomId} โดย storeRoom commit authoritative snapshot/members/public/private พร้อม revision เดียว ไม่มี process-local locks/state

Snapshot และ view ใช้ JSON string เพื่อให้ RTDB ไม่ลบ empty arrays/nulls callbacks เป็น pure transformations อ่าน room snapshot ล่าสุด ทดสอบ callback retry กับ Admin SDK สอง instances Command receipt มีเพียง commandId/roomId/code/revision/gameId ไม่คืน engine state/ไพ่

Public PASS event ไม่ส่ง card IDs/product IDs/stash breakdown/score delta มีเพียงจำนวนรวมที่ประกาศไว้แล้ว เงินข้อเสนอ และ boolean glow Public view มี rules snapshot เป็น catalogue ที่ทุกคนรู้ ไม่ใช่ distribution ของไพ่ Public INSPECT เปิดชนิดสินค้าที่ตรวจและผลที่อนุญาต คะแนนทุกคนเผยเฉพาะ FINISHED private ผูก UID/สมาชิก แสดงมือ/กระเป๋า/คลังของตัวเอง

Code reservation pending/ready ผูก deterministic room ID จาก UID+creation commandId และ request fingerprint Join หรือ create retry repair room จาก server-authored reservation ได้ Commands ผูก fingerprint/UID, generation/clientId, gameId และ round/offer/result versions Dedup ตรวจและคืน receipt เดิมก่อนเขียนผลซ้ำ

Rematch ล้างเกมทั้งหมดและ processed records ของเกมเก่า พร้อมเพิ่ม generation ทุกที่นั่งเพื่อให้ command epoch เก่าใช้ซ้ำไม่ได้ Creation receipt คงไว้เพื่อ retry API สร้างห้องเดิม Host succession เฉพาะ lobby ตรวจ presence ฝั่ง server และเลือกลำดับที่นั่ง ไม่เปลี่ยน sheriff

Rate limit เก็บ RTDB requestLimits server-only ไม่ใช้หน่วยความจำของ Function Input schemas strict/ความยาวจำกัด Same-origin HTTP พร้อม verified Auth Token Snapshot/history/commands จำกัดต่อเกม ไม่มี public endpoint สำหรับ seed/debug ไพ่ทั้งหมด

## Client / UI

client/rooms.ts รับผิดชอบ API, public/private subscriptions และ presence UI ไม่มี Firebase imports โดยตรง RoomClient รอ public/private revision ตรงกันและไม่น้อยกว่า receipt ล่าสุดก่อนเปิด actions เก็บ pending command พร้อม payload/UID ใน sessionStorage และ retry เฉพาะผู้เล่นกด commandId เดิม หลัง 4xx ที่ยืนยันปฏิเสธจึงล้าง pending ไม่มี offline gameplay queue

Game controls อ่านสินค้า/ราคา/ขนาดจาก public rules snapshot ของเกมนั้น Private draft ผูก room/UID/game/round/phase อยู่ sessionStorage ปิดถุงแล้วใช้ข้อมูล server ไม่รับ draft กลับมาเปลี่ยนกติกา UUID ของ session/command/presence ใช้ Web Crypto รองรับ local HTTP LAN ส่วน game RNG ยัง server-only

Glow รับเพียง boolean และ resultId มี duration เดียวสำหรับทุก secret distribution ใช้ sessionStorage กัน replay ภาพ ไม่เดิน phase การเลือกพ่อค้า/offer confirmation จับ expectedOfferVersion และปิดยืนยันหากข้อมูลเปลี่ยน

## Environment

Web SDKใช้ public configเท่านั้น Adminติด server-only import ไม่ถูก importจาก client Initเป็น lazyให้ build/pageทำงานได้โดยไม่มี credentials SDK app cacheไม่ใช่ game state

Local modeต้อง demo project IDsตรงกันและมีทั้ง Auth/Database emulator hosts Productionปฏิเสธ emulator flags/hosts/demo ID Diagnostics routeปิดใน production Emulator runnerแยก CLI configใน workspace ไม่ใช้ credentialsส่วนตัว

## Design

หน้าแรกใช้ referenceจาก home.html หน้าเกมยังเป็น UIชั่วคราวภาษาไทย responsiveและ semantic controls ไม่ยึด merchant-gate.htmlเป็นดีไซน์สุดท้าย M4ตรวจ responsive/accessibility/safe-area/reduced-motion/error/loadingแล้ว ภาพตกแต่งขั้นสุดท้ายของหน้าที่ยังไม่ได้เลือกพักไว้ การเปลี่ยน UIไม่ต้องเปลี่ยน engine

## จำนวนสำรับที่ยืนยันแล้ว

ผู้ใช้อนุมัติ360ใบในrulesVersion0.2: จำนวนแต่ละชนิดเป็น3เท่าของ0.1 ราคา/ค่าปรับ/ชดเชย/กติกาอื่นคงเดิม startGame สร้าง snapshot ใหม่เฉพาะตอนเริ่มเกม (รวมหลัง rematch) applyGameCommand, scoreGame, projections และ UI ใช้ room.game.rules ที่บันทึกไว้ เกมเดิมไม่ถูก migrate หรือเพิ่มไพ่ ไม่มีการแก้ authoritative state ทุกห้องจากการเปลี่ยน config

Server สร้าง entropy360 samples จาก Node crypto ก่อนเข้าtransaction: ใช้1sampleเลือกนายด่านและ359สับสำรับใหม่ รองรับdiscard reshuffleและเกมเดิมด้วย Callback retryใช้samplesชุดเดิมและcursorใหม่ Fixtures seededใช้จำนวนตามsnapshot Testsมี snapshot0.1แยกสำหรับ regression และพิสูจน์ resume/แลกไพ่ผ่าน service instance ใหม่ยัง120ใบ จากนั้น abort/rematch/startใช้0.2/360ใบ
