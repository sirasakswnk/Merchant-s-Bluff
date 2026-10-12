# คืนหน้าแรกและเอฟเฟกต์ตาม home.html — 12 ตุลาคม 2026

ผู้ใช้เลือกกลับมาทำงาน design และต้องการเอฟเฟกต์/แอนิเมชันเหมือน `home.html` ขั้นนี้คืนหน้าแรกจากต้นฉบับโดยตรง ไม่ใช้ merchant-gate.html ไม่เปลี่ยนกติกา ราคา จำนวนสินค้า หรือระบบเกม/backend/data access หน้าเกมยังใช้ UI เดิมสำหรับขั้นต่อไป

สาเหตุเดิม: ใช้ SVG ผ่าน `<img>` ทำให้ CSS ของหน้าควบคุมแสง/ธง/ดาวภายในไม่ได้ และแปลง layout เพียงบางส่วน โดยไม่ได้ย้ายชุดสไตล์ ฟอนต์ อวาตาร์ และ interaction เดิมมาครบ

## สิ่งที่เปลี่ยน

- ใช้ SVG inline ที่ดึงจากต้นฉบับ รวม symbol ของสินค้า/อวาตาร์/อุปกรณ์บนโต๊ะ
- ย้าย CSS จากต้นฉบับด้วย scripts/import-home-assets.mjs, scope selectors และชื่อ keyframes เฉพาะหน้าแรก เพื่อไม่ทับ `.card`/bag-glow ของเกม
- ใช้ Chonburi และ Sarabun น้ำหนัก400/600/700 ผ่าน next/font เพื่อโหลดจากเว็บเดียวกัน
- คืน layout, กระดาษฉีก, พื้นผ้า/ไม้, ริบบิ้น, เหรียญ, หลังไพ่ และรูปอวาตาร์ทั้ง8แบบ
- คืนแสงประตู/โคมไฟ/เปลวไฟ/ธง/ดาว หยุดฉากเมื่อพ้นจอ อวาตาร์พลิก แจกไพ่7ใบเมื่อเลื่อนถึงสินค้า ไพ่เอียง/สะท้อนตามเมาส์ และตัวอย่างกระเป๋าเคลื่อน/เรืองแสง
- ฟอร์มสร้าง/เข้าห้องใช้ API จริงและรักษา commandId/retry/draft/identity เดิม Spinnerแสดงขณะรอresponse; stampเล่นหลังreceiptที่servercommitแล้วเท่านั้น ก่อนเข้าล็อบบี้ ไม่มี randomCode หรือ success simulation
- ชื่อสินค้า/มูลค่า/ค่าปรับ/ค่าชดเชย/จำนวนอ่าน config จริง สำรับ360/rules0.2 ไม่คัดลอกจำนวน120จากprototype สูตรคะแนนอธิบายลูกหนี้/หนี้คงค้างและโบนัสเสมอตามกติกาปัจจุบัน

## หลักฐานการเทียบต้นฉบับ

Browser Chromium ที่360/390/430/1280px: เปรียบเทียบขนาด ตำแหน่ง สี ระยะ ฟอนต์และจังหวะของ14จุดในheader/hero/form ไม่มีความต่าง ภาพcropส่วนheroเหมือนกันระดับpixel/PNGhashทั้ง4ขนาด ไม่มีpageerror ดู [comparison.json](comparison.json)

Referenceใช้home.htmlต้นฉบับ โดยซ่อนแผงควบคุมprototypeและเลือกอวาตาร์แรกให้ตรงกัน ใช้fontfilesเดียวกันผ่านreference-localserverเพื่อให้GoogleFonts/CORSไม่ทำให้referenceตกไปใช้fallback จับanimationที่เวลาเดียวกัน home.htmlไม่ได้ถูกแก้ การเทียบนี้ไม่ใช่การอ้างว่าทุกpixelทั้งหน้าเหมือนกัน เพราะข้อมูลสำรับ/สูตรคะแนน/สถานะฟอร์มจริงต่างจากprototypeตามข้อกำหนด

Keyframesทั้ง13ชุดหลังตัดprefixสำหรับscopeแล้วตรงต้นฉบับทั้งหมด ดู [animations.json](animations.json) ตรวจinteractionจริง: tokenflip0.55s, deal0.9s/เหลื่อม120ms, กระเป๋า1.4s, spinner0.8s, stamp0.38s รวมoffscreen/reducedmotion ผ่านใน [flow.json](flow.json)

## ผลตรวจการเล่นและคุณภาพ

- TypeScript, ESLint และ production build ผ่าน
- Pointer tilt/glare/resetตรวจผ่านจริง แสงสะท้อนopacity1หลังtransition และclient JS13ไฟล์ไม่พบprivate key/service-account email/Cron secret ดู [validation.json](validation.json)
- M0/M4 testsรวม3กรณีผ่านจากM0 rerun2และM4 targeted rerun1: diagnostics Auth/API/RTDB listener/reload, responsiveขนาดมือถือ/แนวนอน/desktop, keyboard/radio, touch targets, 200% text reflow, reducedmotion, clipboard fallback และกลับเข้าlobby
- Axeในโหมดเพิ่มcontrastผ่าน0violationsทั้งhomeและlobby-rules5ขนาด (10snapshots) หลักฐานในaccessibility/
- โทนสีปกติคงต้นฉบับ: ป้าย `.tag-legal` สีขาวบนเขียว #5f8f5b มีcontrast3.77ต่ำกว่าเกณฑ์AA4.5 เป็นข้อจำกัดที่ยืนยันในflow.json จึงไม่อ้างว่าปกติผ่านaxe0 Added prefers-contrast:moreใช้สีเขียวเข้มเดิมของชุดสีเฉพาะเมื่อผู้ใช้เลือกโหมดนี้ สีปกติ/ภาพเทียบไม่เปลี่ยน
- Browser→NextAPI→FirebaseEmulatorsจริง4profiles: create/join/ready/start, exchange3/cargo5/PASS3คนครบหนึ่งรอบ, manualadvanceรอบ2และreloadUIDเดิมผ่าน ไพ่360/unique360/IDเดิมและรายชนิดครบ6checkpoints
- รับavatarIdเดิมจากradio, errorจากAPIจริงรักษาข้อความ, offlineปิดปุ่มส่ง, spinnerก่อนส่งreceiptคืนclientและstampหลังreceiptผ่าน ไม่มีpageerrorsและสไตล์cardเกมยังborder2pxเดิม
- ล้างเฉพาะfixtureจากflowสุดท้าย1ห้อง/5AnonymoususersในEmulatorsแล้ว ไม่มีการทดสอบเขียนFirebaseจริงหรือdeployRulesในขั้นนี้

ช่วงแรกพบปัญหาในharness: locator statusเดิมชนกับglow status, การคลิกhiddenradioแทนlabel, strict locatorธงสองผืน, การอ่านsnapshotก่อนUIเข้าPREPARE และตรวจhandหลังเปลี่ยนเป็นNEGOTIATE แก้ตัวตรวจให้รอboundary/เลือกtargetถูกต้อง ไม่แก้engineเพื่อผ่าน ส่วนM4ใช้timeout15sสำหรับcoldcompileของNextdevตามhelpersเดิม

ทบทวนReact: artwork/staticcatalogอยู่server, motion/form/glowเป็นclient, effects/observers/listeners/timersมีcleanup ไม่สุ่มหรืออ่านbrowserAPIระหว่างSSR ไม่อ่านไพ่ลับ ไม่มีการเปลี่ยนengine/server/data modules

## สถานะส่งมอบ

แก้และตรวจในworkspaceแล้ว มีตัวอย่างที่ http://localhost:4100 ใช้Emulatorsสำหรับการทดสอบในเครื่อง ยังไม่commit/push/deployProductionในขั้นนี้ Productionเดิมยังอยู่รุ่นreleaseก่อนหน้า งานต่อไปคือย้ายภาษาภาพเดียวกันไปหน้าห้อง/เกม/ผล/คะแนนตามขั้นที่ผู้ใช้สั่ง
