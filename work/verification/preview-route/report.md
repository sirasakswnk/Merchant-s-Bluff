# Route preview — 12 ตุลาคม 2026

ผู้ใช้ขอหน้าพรีวิวเพื่อดูดีไซน์โดยไม่ต้องเล่นจริง เพิ่ม `/preview` พร้อมตัวเลือก11ฉาก/2มุมมอง/4–6ผู้เล่น/7สถานะ/4ขนาดและพอดีกับหน้าต่าง ใช้iframeจริงเพื่อให้responsiveตรงตามขนาดที่เลือกและขยายความสูงตามเนื้อหา มีเปิดเต็มหน้า/reset/replay glow

## การแยกหน้าจอและระบบจริง

- แยกrendererเดิมของRoomClientไป`RoomView` ใช้ร่วมกันสำหรับเกมจริงและพรีวิว รูปแบบ/ข้อความ/การแสดงผลเกมจริงคงเดิม
- RoomClientยังรับผิดชอบanonymous identity, resume, realtime/presence, minimumRevision, commandId/pending retry, clipboard และabort confirmationเดิม
- RoomPreviewส่งsynthetic public/private viewsและcallbacksในmemory ไม่มีFirebase/RoomClient/data SDK imports ส่งpersistDraft=falseเพื่อไม่อ่าน/เขียนdraftของเกมจริง
- Factoryอยู่`src/lib/preview/scenarios.ts` ไม่importtests/fixtures ใช้configปัจจุบันและpure resolveBag/scoreGameเดิมคำนวณตัวอย่าง ไม่แก้engine/backend/Rules/ราคา/rulesVersionและไม่เขียนRTDB
- URLparametersมีallow-list/ค่าเริ่มต้น room IDตัวอย่างผ่านlive validationไม่ได้ invitationกลับเข้าpreview metadata noindex ไม่มีendpointอ่านไพ่ของห้องจริง

## ผลตรวจ

TypeScript/ESLint/production buildผ่าน โดยbuildมีroute `/preview` ผล [validation.json](validation.json)

| ตรวจ | ผล |
|---|---|
| Preview isolation | ไม่มีrequestsไปRooms API/Firebase/Auth/RTDB ไม่เขียน/remove/clearplayer storage; active-room/pending/draftเดิมคงไว้ |
| Interaction | เลือกไพ่/แจ้ง1ใบตรงตัวอย่าง เลือกพ่อค้า เปิดconfirmation ให้ผ่าน เห็นglow replay/reset และrefreshURLผ่าน |
| Scene matrix | 11ฉาก×2มุมมองผ่าน รวม4/5/6ผู้เล่นและscore rowsครบ7state presets/invalidqueryfallback/noindex |
| Device frame | innerWidth360/390/430/1280ตรงจริง ไม่มีoverflowในภาพและstudioบนviewport360px ภาพสูงเต็มเนื้อหา |
| Live UI regression | 5browserplayersบนNext/FirebaseEmulatorsจบ10รอบ พร้อมlostresponse retry/offline draft/reload/controltakeover/staleoffer/rematchตามM5ผ่าน |
| Accessibility regression | M4keyboard/radio/touch/reflow/reducedmotion/clipboardfallback/home+live lobby-rulesผ่าน ตรวจcontrastใช้prefers-contrast:moreตามข้อจำกัดสีต้นฉบับจากงานก่อน |

ชุดรวม4กรณีผ่านในรอบเดียว จากนั้นทวนPreview2กรณีหลังเพิ่มauto-height/ตรวจstorage mutation/จำนวนสินค้าที่เลือกผ่าน รวมเปิดลิงก์ตรงไปฉากจัดกระเป๋า390pxแล้วความสูงiframeครอบคลุมเนื้อหาตั้งแต่โหลดแรก ใช้ทั้งonLoadและmount effectเพื่อรองรับiframeที่โหลดเสร็จก่อนhydrate ไม่รันทวนgame matrix4/5/6ทุกกรณีหรือFirebaseจริงในงานนี้

รอบแรกพบaccessible nameของselectรวมข้อความoption จึงเพิ่มaria-labelให้ตรงชื่อช่อง การรันตัวตรวจสองชุดพร้อมกันใช้folderผลร่วมกันทำให้traceENOENT จึงแยกoutputและรันเรียงชุดเดียว รวมแก้test helperให้รับorigin4100โดยdefaultเดิม3100ไม่เปลี่ยน ไม่แก้engineเพื่อผ่าน ในตัวตรวจstorageแก้typeของpropertyเพิ่มเติมเป็นoptionalแล้วbuildผ่าน

ภาพ:studio.png, studio-mobile.png, glow.png, scores.png (ignored) และaccessibility JSONในโฟลเดอร์นี้ Screenshotซ่อนNextdev indicatorเฉพาะการcapture ไม่เปลี่ยนUIจริง

## สถานะส่งมอบ

ใช้ **http://localhost:4100/preview** ได้ทันทีในเครื่อง มี [วิธีใช้](../../../docs/preview.md) และURLตัวอย่างที่copy/refreshได้ ใช้หน้าตาปัจจุบันของเกมเพื่อเป็นที่ตรวจdesignต่อ ไม่ถือเป็นการอนุมัติดีไซน์ใหม่ทุกหน้าหรือการเล่นเกมจริง

คงไฟล์ที่แก้ในงานหน้าแรกก่อนหน้า ไม่commit/push/deployในขั้นนี้ Productionจึงยังไม่ได้รับrouteจากงานนี้ งานถัดไปคือออกแบบหน้าห้อง/เกม/ผล/คะแนนผ่านพรีวิวเมื่อผู้ใช้สั่ง
