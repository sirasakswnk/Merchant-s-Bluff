# Progress — 14 ตุลาคม 2026

## ขั้นตอนล่าสุด — แผงขนาบโต๊ะตามแบบ desktop ของผู้ใช้

ผู้ใช้ส่งแบบ HTML ที่ชอบกว่า และอนุมัติให้แก้ backend ได้ จัด desktop ใหม่: หัวรอบเต็มกว้าง แผงสองข้างขนาบโต๊ะในแถวเดียวกัน และพื้นที่คำสั่งเต็มแถวใต้โต๊ะ ซ้ายเป็นป้ายราคาตลาดและค่าปรับ กับกองไพ่และคิวนายด่าน ขวาเป็นคลังสินค้าของฉันพร้อมการ์ดจริงย่อ กับบันทึกหน้าด่านและตั๋วหนี้ ใช้ตัวละครจริงและพัดไพ่เดิมแทนemoji/แถวไพ่ในแบบ มือถือคงเดิม

Backend เพิ่ม `supplyCount` ใน public view = กองจั่ว+กองทิ้ง ไม่ส่งขนาดกองแยกเพราะกติกาให้แลกไพ่ลับ ถ้าส่งแยก ทุกคนจะเห็นกองจั่วลดและกองทิ้งเพิ่มตอนแต่ละคนพร้อม ซึ่งเผยจำนวนที่แลก ยอดรวมไม่ขยับระหว่างแลก unit test ใหม่ยืนยันเรื่องนี้และconservation คิวนายด่านถัดไปคำนวณจากลำดับที่นั่งเหมือนengine

typecheck/lint/unit92ผ่าน Preview E2E11/12ผ่าน ส่วน `preview.spec.ts:46` ล้มเป็นครั้งคราวด้วย "Execution context was destroyed" ซึ่งเกิดบนsourceก่อนแก้ด้วย (1ใน4ครั้ง) axe WCAG84กรณีdesktop0 violation ไม่มีoverflow ชุดreal-player/integrationยังรันในcloud sessionนี้ไม่ได้เพราะFirebase Emulators หลักฐาน [verification/board-wings/report.md](verification/board-wings/report.md)

## ประวัติ — แผงข้างโต๊ะสำหรับ desktop (รุ่นแรก ถูกแทนด้วยแบบของผู้ใช้)

ผู้ใช้เห็นว่าหน้าเกมบน desktop โล่งเกินไป มือถือดีแล้ว และอนุมัติชุดที่เสนอ จอกว้างตั้งแต่1180pxเมื่อมีเกมแล้วจัดเป็น3คอลัมน์ ซ้ายเป็นรอบ/ขั้นตอนและสมุดบันทึกด่านจากpublic history ใหม่สุดก่อน กลางเป็นโต๊ะที่ขยายเป็นmin(64cqw,520px)กับพื้นที่ของเรา ขวาเป็นการ์ดช่วยจำราคา/ชดเชย/ปรับจากrules snapshot โกดังของฉันจากprivate viewของตัวเอง และบัญชีหนี้จากpublic debts แผงข้างsticky และเลื่อนในตัวด้วยคีย์บอร์ดได้ details3ชุดที่ซ้ำกันซ่อนเฉพาะdesktop จอแคบกว่าคงcolumnเดิมทุกอย่าง PASSยังไม่เผยชนิดไพ่ ไม่แตะengine/backend/Rules/คำสั่ง/ราคา/360ใบ/rulesVersion

Previewเพิ่มประวัติรอบก่อนหน้า (สูงสุด2รอบ พ่อค้าทุกคนผ่านresolveBag) ใช้ledgerตัวอย่างแยกเพื่อไม่เปลี่ยนเงินตัวอย่างเดิม และเพิ่มขนาด1440px

typecheck/lint/unit89ผ่าน Preview E2E12/12ผ่าน axe WCAG84กรณีdesktop0 violation ไม่มีoverflow ชุดreal-player/integrationต้องใช้Firebase Emulatorsซึ่งรันในcloud sessionนี้ไม่ได้ (firebase-toolsส่งคำขอemulatorผ่านproxy) จึงยังไม่ได้รัน หลักฐาน [verification/desk-rails/report.md](verification/desk-rails/report.md)

## ประวัติ — จัด Popup นายด่านให้อยู่กลางหน้าจอ

ผู้ใช้ให้popupล่าสุดอยู่ตรงกลาง สาเหตุอยู่ที่CSSเฉพาะPreviewตั้งmarginด้านบน12pxเพื่อชดเชยiframeที่สูงทั้งหน้า ลบoverrideและให้PreviewStudioใช้ความสูงหน้าจอผู้ชมเมื่อมีpopupนายด่าน (เปิดหรือปิดชั่วคราว) พร้อมปรับเมื่อresize/cleanup listener เฟสอื่นยังfitตามเนื้อหา โต๊ะ/ข้อมูลเกม/คำสั่ง/confirmationเดิมไม่เปลี่ยน

ทวนE2Epopup2และPreview2รวม4/4ผ่าน TypeScript/lint/productionbuildผ่าน ตรวจproduction24มุม4/5/6คน×เต็มหน้า/ฝังiframe×รายชื่อ/รายละเอียด/ผลตรวจ/สรุปรอบ popupตรงกลางทั้งสองแกนคลาดเคลื่อนสูงสุด0.211px ไม่ถูกตัด ไม่มีpageerrorหรือAPI/Firebase requestsจากPreview ตรวจภาพมือถือ390×844และiframeบนdesktop1280×844แล้ว หยุดserverชั่วคราว/คืนgeneratedtype imports หลักฐาน [verification/sheriff-popup-center/report.md](verification/sheriff-popup-center/report.md) ไม่commit/push/deployในขั้นนี้

## ประวัติ — Popup เลือกพ่อค้าและตัดสินบนมือถือ

ผู้ใช้ต้องการไม่เลื่อนลงไปหากล่องเลือกพ่อค้า บนมือถือเปิดnative popupอัตโนมัติในช่วงเจรจา รายชื่อมีแค่ชื่อและตัวละครที่เลือก เมื่อแตะคนจึงแสดงโปรไฟล์ คำแจ้งและข้อเสนอล่าสุดพร้อมให้ผ่าน/ตรวจ รอselectedMerchantIdจากserverก่อนเปิดรายละเอียด ย้อนกลับรายชื่อได้ ปิด/เปิดซ้ำผ่านปุ่มลอยเหนือsafe area Closingล้างconfirmationที่ยังไม่ส่ง ผลตัดสิน/คนถัดไป/สรุปรอบ/จบรอบทำต่อได้ในpopup Desktopยังมีpanelในหน้า รองรับtouch landscape

แยกSheriffDecisionPanel/CSS Moduleเป็นpresentation ใช้media subscriptionที่มีSSR snapshot/cleanupและnative dialog/focus trap/escape/body scroll lock SheriffControlsยังถือconfirmation/version และส่งcommandsเดิม RoomStatusส่งต่อerror/pending retry/claimControlให้เห็นในmodal ใช้public result fragmentร่วมกับกล่องผลเดิม PASSไม่เปิดเผยชนิดไพ่ PreviewมีMutationObserverเลื่อนiframeเข้ามุมมองเฉพาะเมื่อpopupใหม่เปิด ไม่เลื่อนซ้ำจากข้อเสนอ/revisionทั่วไป มีcleanupครบ

ทดสอบ9กรณีที่เกี่ยวข้องผ่านหลังแก้จุดที่พบระหว่างตรวจ (7กรณีผ่านในชุดหลัก และ3กรณีผ่านในการตรวจเฉพาะจุดที่แก้ มี1กรณีซ้ำ): popup2กรณี/offer3/preview2/โต๊ะ2 รวมรายชื่อ4/5/6คน×320/390/430px, การตัดสินต่อเนื่องไม่เลื่อนหน้า, back/close/reopen/clear confirmation, Tab/Escape/focus restore, ข้อความ200%, resize/แนวนอนtouch, offline/readonly/busy/pending/error, retry/claimControl, PrivacyPASS และoffer versionที่เปลี่ยนระหว่างยืนยันผ่าน

เกมlocalAuth/RTDBEmulators4คนสองflowผ่าน เลือก/ให้ผ่าน15/ตรวจโดยไม่โอนข้อเสนอ8/ยืนยัน0/ส่งต่อนายด่าน/reload/ยุติ/rematch ไพ่12จุด360/unique360/รายชนิด/IDsครบ cleanupเฉพาะfixtureรวม2ห้อง8users แก้helperอ่านเงินจากป้ายใหม่และให้การทดสอบรอยืนยันเตรียมสินค้าแต่ละคนก่อนกดคนถัดไป จุดแรกที่พบในPreviewคือpopupในiframeอยู่นอกมุมมองที่เลื่อนค้างไว้ แก้reveal popupแล้วทวนPreviewผ่าน ไม่แก้game logicเพื่อแก้test

TypeScript/lint/productionbuildผ่าน ตรวจproductionในเครื่อง18มุมเลือก/ผลตรวจ/สรุปรอบ×4/5/6คน×390/1280px ไม่ล้น ปุ่ม44px ไม่มีpageerror/API/Firebase requestsจากPreview ภาพตรวจแล้ว React reviewผ่านเรื่องtyped props/controller ownership/SSR/media/ref cleanup/accessibility ไม่มีnew network/storage actions หลักฐาน [verification/sheriff-popup/report.md](verification/sheriff-popup/report.md) ไม่แก้backend/data/Rules/ราคา/360ใบ/rulesVersion0.2 หยุดserverชั่วคราว/คืนgeneratedtypes ไม่commit/push/deployหรือทดสอบโทรศัพท์/Firebaseจริงในขั้นนี้

## ประวัติ — จัดโต๊ะให้อยู่กึ่งกลางวงผู้เล่น

ผู้ใช้พบว่าโต๊ะดูไม่อยู่กลางวงหลังเพิ่มป้ายเงิน สาเหตุคือที่นั่งยึดกึ่งกลางรูปโปรไฟล์แต่ชื่อ/เงิน/คำแจ้ง/สถานะต่อยาวลงด้านล่าง และข้อมูลกลางโต๊ะมีoffsetอีกชุด เปลี่ยนCSSให้โต๊ะ ข้อมูลกลางโต๊ะ และตำแหน่งผู้เล่นใช้จุดกลาง50%ร่วมกัน โปรไฟล์translateตามครึ่งหนึ่งของทั้งบล็อก รัศมีที่นั่งยังแยกตามขนาดจอ/ข้อเสนอ ตัวเราอยู่ล่าง นายด่านคนอื่นอยู่บนและสลับที่นั่งเดิม Layoutจอแคบ/ข้อความขยายยังไหลอ่านได้

ตรวจตำแหน่ง54มุมจัดกระเป๋า/เจรจา/สรุปรอบ×4/5/6คน×2roles×360/390/1280px จุดกลางโต๊ะตรงกึ่งกลางโปรไฟล์บน/ล่างคลาดเคลื่อนสูงสุด0.008px แนวนอนและข้อมูลกลางโต๊ะตรงกัน ไม่ทับโปรไฟล์ ไม่ล้นจอ และพื้นที่ไพ่ต่ำกว่าทุกโปรไฟล์ ทวนE2Eโต๊ะเดิมผ่าน30layouts/60ครั้งส่งต่อนายด่าน/40scene-role-size/axe20ไม่มีviolations/keyboard/reduced motion/200%

TypeScript/lint/productionbuildผ่าน ตรวจproductionในเครื่อง12มุม4/5/6คน×2roles×390/1280pxตรงกัน ตรวจภาพmobile/desktopแล้ว ไม่มีpageerrors/API/Firebase requestsจากPreview หยุดserverชั่วคราวและคืนgenerated type importsเดิม หลักฐาน [verification/table-centering/report.md](verification/table-centering/report.md) แก้CSSการจัดวางเท่านั้น ไม่แก้engine/backend/data/Rules/ราคา/360ใบ/rulesVersion0.2 ไม่commit/push/deployในขั้นนี้

## ประวัติ — ป้ายเงินคงเหลือบนโต๊ะเกม

ผู้ใช้อนุมัติป้ายกระเป๋าเงินใต้ชื่อผู้เล่น: พื้นครีม ขอบหนังบางและรอยเย็บ ไอคอนเหรียญ ตัวเลขเข้มตัวหนา18pxบนมือถือ/20pxบนจอใหญ่ หน่วยเหรียญเล็ก และขอบทองสำหรับป้ายของเรา ใช้GameTableViewร่วมทุกช่วงหลังเริ่มเกม อ่านpublic player.cashเดิม ไม่ปะปนกับป้ายข้อเสนอที่มีคำว่าเสนอ มีข้อความเงินคงเหลือสำหรับscreen reader ไม่มีstate/effect/networkใหม่

ตรวจพบครั้งแรกว่า5/6คนบนจอ360pxป้ายใหญ่ขึ้นทำให้โปรไฟล์เบียดกัน จึงเพิ่มระยะที่นั่งแนวตั้งและพื้นที่ก่อนกล่องไพ่ตามขนาดจอ โดยคงตำแหน่งตัวเรา/นายด่านและการสลับเดิม ตรวจซ้ำโต๊ะ30มุม4/5/6คน×2roles×360/390/430/740landscape/1280px ไม่ทับกัน ส่งต่อตำแหน่ง60ครั้งและ40มุมทุกsceneผ่าน axe20กรณีไม่มีviolations keyboard/reduced-motion/200%ผ่าน

เกมlocalAuth/RTDBEmulators4คนแลก3ขน5 ให้ผ่าน/ตรวจ/ส่งต่อนายด่าน/reload/ยุติ/กลับล็อบบี้ผ่าน ไพ่ครบ360/unique360/รายชนิด/IDsเดิม และcleanupห้อง1/users4 พรีวิวเดิม2กรณีผ่าน ตรวจป้ายเพิ่ม36มุมเจรจา/สรุปรอบ×4/5/6คน×2roles×320/390/1280px และ9มุมทุกsceneที่เหลือรวม200% ไม่ล้น/ไม่ตัดยอด/ไม่ทับพื้นที่ไพ่ ไม่มีpageerrorหรือAPI/Firebase requestsจากPreview

TypeScript/lint/productionbuildผ่าน ภาพproductionในเครื่อง12มุม4/5/6คน×2roles×390/1280pxมีป้ายและยอดเดิมถูกต้อง ตรวจภาพmobile/desktopแล้วและหยุดserverชั่วคราว หลักฐาน [verification/cash-badges/report.md](verification/cash-badges/report.md) ไม่แก้engine/backend/data/Rules/ราคา/สำรับ360ใบ/rulesVersion0.2 ไม่commit/push/deployหรือทดสอบFirebaseจริง/โทรศัพท์จริงในขั้นนี้ หยุดตามงานที่อนุมัติ

## ประวัติ — ป๊อปอัปอันดับตอนจบเกม

ผู้ใช้ต้องการสรุปที่เพื่อนคุยกันต่อได้ แทนหน้าคะแนนละเอียดด้วยFinalScorePopup/native dialogเปิดอัตโนมัติเมื่อเกมจบ ใช้ผ้าใบกระสอบ/ขอบหนังเดิม แถวมีแค่อันดับ โปรไฟล์ตัวละคร ชื่อ และเงินสดคงเหลือ score.cash อันดับอ่านscore.rank/ลำดับจากserverและคงอันดับร่วม ไม่มีรายการสินค้า โบนัส หนี้หรือคะแนนรวมในแถว ไม่เปลี่ยนสูตรอันดับ

ปิดด้วย×/Escapeและคืนfocusไปดูอันดับอีกครั้ง วนTab/Shift+Tabภายใน dialog พื้นหลังinert/ล็อกscroll เปิดดูซ้ำได้ ผู้จัดห้องเล่นใหม่ด้วยcallbackเดิมและdisabledตามสถานะ ไม่เปิดใหม่จากrevisionทั่วไปเพราะผูกmountกับgameId Previewวางpopupต้นiframeให้เห็นทันทีหลังจบ โดยไม่เปลี่ยนหน้าจอเกมจริง

E2E5/5ผ่านรวมเกมlocalAuth/RTDBEmulators4คนครบ8รอบ ทุกจอเปิดpopup/rank/cashตรงauthoritative snapshot reload/Escape/rematchผ่าน ไพ่9จุด360/unique360/รายชนิดและIDsครบ cleanup1ห้อง4users ทวนUI4/4หลังปรับตำแหน่งPreview: 30มุม4/5/6คน×2roles×320/390/430/740landscape/1280px ไม่มีoverflow axe10กรณีไม่มีviolations controls44px/keyboard/200%/disabled4สถานะผ่าน ไม่มีAPI/Firebase requestsจากPreview

TypeScript/lint/productionbuildผ่าน ตรวจproductionในเครื่อง12มุม4/5/6×2roles×390/1280px auto-open/ปิด/เปิดซ้ำ/themeผ่าน ตรวจภาพแล้ว React reviewแยกpresentation/typed callbacks/native dialog/ref effectcleanupและไม่ถือกติกา ไม่แก้engine/backend/data/Rules/ราคา/360ใบ/rulesVersion0.2 หลักฐาน [verification/final-score-popup/report.md](verification/final-score-popup/report.md) ไม่commit/push/deployหรือทดสอบโทรศัพท์จริง/Firebaseจริงในขั้นนี้ หยุดตามงานที่อนุมัติ

## ประวัติ — เสนอเหรียญและถาดข้อเสนอบนโต๊ะ

ผู้ใช้อนุมัติข้อเสนอปรับยอดง่ายและแสดงให้ทุกคนเห็น เพิ่มOfferAmountPickerแยกpresentation: ยอดใหญ่ ลด/เพิ่ม1 เพิ่ม5/10 พิมพ์ยอดเองได้ จำกัดปุ่มปรับในช่วง0–เงินใช้ได้ ร่างส่วนตัวอยู่session draftเดิม ยื่นโดยปุ่มแสดงยอดเท่านั้น ปุ่มไม่เสนอเงินยืนยัน0และคืนช่องร่างเป็น0 ไม่ส่งคำสั่งจากการปรับตัวเลข

OfferDisplayอ่านpublic offersเดิม: ป้ายข้างพ่อค้าทุกคน/ถาดกลางตามคนที่ถูกเลือก/ยอดใหญ่ฝั่งนายด่าน แยกยังไม่ยื่นและยืนยัน0 ปุ่มให้ผ่านแสดงยอดรับ คงcashและคำแจ้ง แทนป้ายยื่นข้อเสนอที่ซ้ำเดิม กองเหรียญขยับ360msเมื่อconfirmed versionเปลี่ยน ไม่ขยับตอนเปิดหน้า/แก้ร่าง รองรับreduced motionและcleanup เพิ่มระยะโต๊ะเฉพาะเฟสข้อเสนอเพื่อไม่ชนพื้นที่ของเรา

ผลสุดท้าย E2E6/6ผ่านชุดเดียว: offer3 + Preview2 + game-table UI1 (layout30/สลับนายด่าน60/ฉาก40/axe20) ทดสอบpickerขอบเขต/invalid/native keyboard/explicit0/draftไม่เผย/motion/reduced-motionผ่าน UIข้อเสนอ18มุม4/5/6×2roles×320/390/1280px axe6ไม่มีviolations disabled4สถานะ/200%ผ่าน LocalAuth/RTDBEmulators4คนครบหนึ่งรอบ: unselected merchantเสนอได้ ร่างหลังreload ยอดsyncทุกจอ stale confirmationถูกปิด PASSโอน15ครั้งเดียว INSPECTข้อเสนอ8ไม่มีโอน8 ยืนยัน0แล้วตัดสินได้ ไพ่5จุด360/unique360/IDsและรายชนิดครบ ล้างfixture1ห้อง4usersแล้ว

TypeScript/lint/productionbuildผ่าน ProductionPreviewในเครื่อง12มุม4/5/6×2roles×390/1280px ปรับร่างยังไม่เปลี่ยนป้าย ยื่นแล้วป้าย/ถาดเปลี่ยนและconfirmationมีจำนวนถูกต้อง ไม่มีAPI/Firebase requestsจากPreview ตรวจตามReact Best Practices: childไม่ถือgame rules, controlled draft, hook dependencies/cleanup, native controls/labels/direct imports ตรวจภาพแล้ว ไม่แก้engine/backend/data/Rules/ราคา/360ใบ/rulesVersion0.2 หลักฐาน [verification/coin-offers/report.md](verification/coin-offers/report.md) ไม่commit/push/deployหรือทดสอบFirebaseจริง/โทรศัพท์จริงในขั้นนี้ หยุดตามขั้นที่อนุมัติ

## ประวัติ — กล่องคะแนนสุดท้าย

เปลี่ยนกรอบคะแนนสุดท้ายเป็นGamePanelผ้าใบกระสอบสีทราย ขอบหนัง7px รอยเย็บและเงานูนชุดเดียวกับกล่องเล่นเกม คงพื้นสีอ่อนของคะแนนรายคนและการจัดรายการเดิม ไม่แก้ผู้ชนะ/อันดับ/คะแนน/จำนวนสินค้า/สูตรคำนวณหรือcallbackเล่นใหม่

ตรวจ30มุม4/5/6คน×merchant/sheriff×320/360/390/430/1280px ข้อความคะแนนและรายละเอียดทุกช่องตรงกับก่อนแก้ ไม่ล้นจอ Scopedaxe12กรณีไม่พบviolations ปุ่มกลับล็อบบี้ใช้Enterได้และdisabledตามoffline/readonly/busy/pending ข้อความ200%ผ่าน Preview E2E2/2, TypeScript/lint/productionbuildผ่าน ตรวจproductionในเครื่อง12มุม4/5/6คน×2roles×390/1280pxได้ธีมและข้อมูลเดิม ภาพตรวจแล้ว หลักฐาน [verification/final-score-theme/report.md](verification/final-score-theme/report.md) ไม่ทดสอบFirebaseจริงหรือโทรศัพท์จริงซ้ำ ไม่มีcommit/push/deploy หยุดตามขั้นที่อนุมัติ

## ประวัติ — ธีมกล่องทุกช่วงของเกม

ผู้ใช้ให้กล่องเตรียมสินค้า เจรจาและข้อเสนอ รอผล/รอบถัดไป และผลของพ่อค้าใช้ธีมเดียวกับจัดกระเป๋า แยกGamePanel/CSS Moduleร่วมเป็นผ้าใบกระสอบสีทราย ขอบหนัง7px รอยเย็บและเงานูน ใช้กับMerchantControlsทุกสถานะรวมรอเพื่อน SheriffControlsและกล่องผลตัดสิน ช่องกรอกพ่อค้ามีพื้นสีอ่อนอ่านง่าย ไพ่prepare/packยังยื่นเต็มจอและปัดครึ่งวงกลมได้

TypeScript/lint/productionbuildผ่าน E2E10/10ผ่านเดิม ตรวจ80มุม8ฉาก×2roles×320/360/390/430/1280px ทุกกล่องมีthemeที่คำนวณแล้วตรงกัน ไม่ล้นจอ controls44px decorationsไม่บังpointer Scopedaxe32กรณีไม่พบviolations ตรวจเสนอเงิน7/ปฏิเสธยอดติดลบ/ไม่เสนอเงิน/ยกเลิกและยืนยันตรวจ/disabled4สถานะ/ข้อความ200%ผ่าน PASSยังไม่เผยชนิดของต้องห้าม INSPECTแสดงผลเดิม ไม่มีpageerrorหรือAPI/Firebase requestจากPreview

ตรวจproduction buildในเครื่องอีก24มุม6ฉาก×2roles×390/1280px CSSที่รวมแล้วตรงธีมและฟอร์มเสนอเงินผ่าน ตรวจตามReact Best Practices: wrapperไม่มีstate/effect/network ใหม่ ส่งต่อaria/data/result IDsเดิม keys/hooks/draft/commandcallbacksเดิม หลักฐาน [verification/game-panel-theme/report.md](verification/game-panel-theme/report.md) ไม่แก้engine/backend/data/Rules/ราคา/360ใบ/rulesVersion0.2 ไม่commit/push/deployหรือทดสอบFirebaseจริง/โทรศัพท์จริงในขั้นนี้ หยุดหลังงานที่อนุมัติ

## ประวัติ — กล่องผ้าใบกระสอบและขอบหนังเย็บ

ผู้ใช้เลือกผ้าใบกระสอบสีทรายและขอบหนังเย็บจากตัวอย่าง เปลี่ยนเฉพาะกล่องจัดกระเป๋าและแจ้งสินค้าในPACK_AND_DECLARE ด้วยCSS Module ลายผ้าจางใต้ข้อความ ขอบหนัง7px/รอยเย็บ/เงานูน แยกพื้นสีอ่อนรองรับช่องแจ้งสินค้าและปุ่ม เพิ่มพื้นที่ยื่นมือไพ่ตามความหนาขอบเพื่อคงเต็มความกว้างจอบนมือถือ ใช้MerchantControlsร่วมกันทั้งPreviewและห้องจริง

TypeScript/lint/productionbuildผ่าน E2E10/10ผ่าน รวมtouch24มุม4/5/6คน×prepare/pack×360/390/430/1280px และgesture6มุม320/390/430px พร้อมkeyboard/200%/disabled/offline/Preview isolation ตรวจกล่องใหม่โดยตรงที่320/360/390/430/1280pxไม่มีoverflowหรือaxe violations ปุ่มและselectอย่างน้อย44px ขอบตกแต่งไม่รับpointer คีย์บอร์ดและข้อความ200%ผ่าน ตรวจproduction buildในเครื่องที่390/1280pxได้ขอบ7px/รอยเย็บเดิม เลือกไพ่/แจ้งสินค้า/ปุ่มยืนยันและCSSที่รวมแล้วผ่าน ไม่มีpageerror

คงcallbacks/draft/instanceIds/เพดานเลือก/กติกา/ราคา/360ใบ/rulesVersion0.2 ไม่แก้engine/backend/data/Rules หลักฐาน [verification/packing-texture/report.md](verification/packing-texture/report.md) ขั้นนี้ตรวจUIในChromium ไม่รันเกมFirebaseจริงหรือโทรศัพท์จริงซ้ำ ไม่มีcommit/push/deploy หยุดหลังขั้นที่ผู้ใช้อนุมัติ

## ประวัติ — ภาพหน้าการ์ดจาก card.zip

ผู้ใช้ส่งภาพสินค้า7ชนิด ใช้เต็มใบแทนภาพ/ชื่อ/ตัวเลขเดิมในMerchantHandทั้งprepare/packและช่องรายละเอียด ภาพพิมพ์ราคา/ชดเชย/ค่าปรับตรงrules0.2ครบ7ชนิด เก็บpublic/art/cardsเป็นWebP lossless1024×1536px decoded pixelsตรงPNGทุกใบ Next/Imageส่งขนาดตามจอ/remและใช้contain ป้ายเลือกแล้วอยู่ใต้กรอบไม่ทับราคา คงปัดครึ่งวงกลม/ขนาดไพ่/instanceIds/เพดาน3และ5/keyboard/disabled ราคาและscreen reader/detailsยังอ่านrules snapshotเดิม

TypeScript/lint/productionbuildผ่าน E2E10/10ผ่านชุดเดียว: motion6กรณี prepare/pack×320/390/430px + selection/keyboard2 + Preview2 รวมtouch24มุม4/5/6คน การหมุน/ปัดไม่เลือก/แตะใบริมจอ/200%/readonly/busy/pending/offlineผ่าน ไม่มีpage overflow/axe violations/APIหรือFirebase requestsจากพรีวิว ตรวจภาพมือถือ390และdesktop1280/DPR2 โหลดครบ object-fit contain และdraggablefalse Optimizer384pxของภาพทั้ง7ชนิดตอบ200 ภาพที่ส่งราว22–29KBต่อใบ ต้นทางยังความละเอียดเต็ม

ตรวจUI/ภาพเท่านั้นในขั้นนี้ ไม่รันเกมEmulator4คนซ้ำหลังเปลี่ยนassets หลักฐานเกมก่อนหน้าอยู่verification/arc-hand ไม่แก้engine/backend/data/Rules/ราคา/360ใบ/rulesVersion ไม่เปลี่ยนหน้าแรก ผล [verification/card-art/report.md](verification/card-art/report.md) และข้อมูล [../docs/card-art.md](../docs/card-art.md) ยังอยู่ในเครื่อง ไม่มีcommit/push/deployหรือทดสอบโทรศัพท์จริง/Safari

## ประวัติ — ปัดมือไพ่ตามแนวครึ่งวงกลม

ผู้ใช้อนุมัติตัวอย่างsemicircle-hand-motion นำมาใช้กับMerchantHandทั้งprepare/packจริงและพรีวิว แยกuseArcHandเฉพาะpresentation มือถือ≤600pxไพ่132×192pxหมุนรอบpivotร่วมต่ำกว่าจอ ตำแหน่งและมุมเปลี่ยนพร้อมกันตามนิ้ว ปล่อยแล้วใช้แรงเฉื่อยจำกัดและชะลอ320msหยุดที่ใบกลาง หยุดหัวท้ายไม่วน ไพ่ยื่นพ้นpanelเต็มจอ เลือกแล้วยก32pxตามรัศมี แตะใบริมจอแล้วหมุนเข้ากลาง ปัดไม่เลือกและยังเลื่อนหน้าแนวตั้งได้ ปุ่มก่อน/ถัดไป/Tab/ลูกศร/Home/Endอ่านครบทุกใบ ลดmotionแล้วหยุดทันที แก้shared hover ruleให้ไม่ล้างตำแหน่งไพ่เมื่อใช้reduced motion

ผลสุดท้าย E2E11/11ผ่านชุดเดียว: gesture6มุม prepare/pack×320/390/430pxติดตามตำแหน่งจากrenderจริงและfitเป็นวงกลมเดียวกัน ไม่มีเลือกขณะปัด/แตะneighborผิด/keyboardclip/page overflow/axe violations ชุดtouch24มุม4/5/6คนและสองเฟสที่360/390/430/1280ใช้reduced motionเพื่อตรวจselection/เพดาน3และ5/สินค้าเดียวกันคนละID ส่วนgesture6มุมตรวจmotionปกติ Keyboard/200%/readonly/busy/pending/offlineผ่าน Previewเดิม2กรณีผ่านไม่มีAPI/Firebaseหรือplayer-storagewrites

ห้องlocalAuth/RTDBEmulators4browser contextsเปิดtouch เลือกไพ่ด้วยtap แลก3ขน5ทุกพ่อค้า แจ้งbread PASSครบหนึ่งรอบ/เริ่มรอบ2 ร่าง/คำแจ้งอยู่หลังreloadและAPIรับinstanceIdsตรงselection Inventory10จุด360ใบ/unique360/รายชนิดและIDsครบ seatOrderเดิม ล้างเฉพาะfixture1ห้อง4users TypeScript/lint/productionbuildผ่าน Desktop1280ภาพเหมือนก่อนปรับทุกbyte ผล [verification/arc-hand/report.md](verification/arc-hand/report.md) ไม่แก้engine/backend/data/Rules/ราคา/360ใบ/rulesVersion0.2 ยังเป็นChromiumจำลองมือถือ ไม่มีphoneจริง/Safari/Firebaseจริงหรือcommit/push/deployในขั้นนี้

## ประวัติ — มือไพ่มือถือเป็นพัดโค้ง

ผู้ใช้ต้องการทรงโค้งเหมือนถือไพ่บอร์ดเกม ปรับเฉพาะCSSมือถือให้ตัวไพ่และพื้นที่แตะเอียงไปด้วยกันจากซ้ายไปขวา ไพ่กลางสูงกว่าปลายพัด เพิ่มพื้นที่รอบไพ่เอียงและไพ่ยกขึ้น คงไพ่ใหญ่132px/ซ้อน24px/ยื่นพ้นpanel/ปัดซ้าย–ขวา/แตะเลือกยก32px/instanceIdและกติกาเดิม

ตรวจหลังเปลี่ยนCSS: E2E8/8ผ่าน (gesture6มุม prepare/pack×320/390/430px + regression touch/keyboard/200%/readonly/reduced motion2กรณี) เลือกใบริมจอ ปัดไม่เลือก และfocusเลื่อนเผยไพ่ผ่าน ไม่มีhorizontal page overflow/axe violations ตรวจภาพปลายพัดซ้ายและขวาครบ3ขนาด ไม่มีvertical overflowในพื้นที่ไพ่ ภาพdesktop1280ยังเหมือนก่อนปรับทุกbyte ProductionbuildและTypeScriptผ่าน ผล [verification/mobile-hand/report.md](verification/mobile-hand/report.md) ยังเป็นChromiumจำลองมือถือ งานอยู่ในเครื่อง

## ประวัติ — ไพ่บนมือถือยื่นพ้นกล่องและปัดซ้าย–ขวา

ผู้ใช้อนุมัติให้ไพ่มือถือยื่นพ้นขอบกล่องและปัดมือไพ่ได้ ใช้ทั้งช่วงแลกและจัดกระเป๋า จอไม่เกิน600pxแสดงไพ่132px ซ้อนเพียง24px เต็มความกว้างจอ มีใบถัดไปโผล่ริมจอให้รู้ว่าปัดต่อได้ แตะแล้วยก32pxและอยู่ด้านหน้า แตะซ้ำเอาออก แตะใบที่เห็นบางส่วนหรือใช้keyboardแล้วเผยเต็มใบ ไม่เลือกไพ่ขณะปัด แก้เฉพาะMerchantHand/CSSและระยะbleedของpanel คงdesktop/instanceId/hand order/เพดาน3และ5/engine/backend/data/Rules/ราคา/360ใบ/rulesVersion0.2

TypeScript/lint/productionbuildผ่าน E2Eสุดท้าย11/11ผ่านในชุดเดียว: ชุดไพ่เดิม3 + gestureมือถือ6 (prepare/pack×320/390/430px) + Previewเดิม2 ตรวจnative touchซ้าย/ขวาไม่เปลี่ยนselection, แตะใบริมจอ, keyboardเลื่อนเผยไพ่, เลื่อนหน้าแนวตั้งบนพื้นที่ไพ่, ไม่มีpage overflowหรือaxe violationsในชุดไพ่มือถือ6มุม พรีวิวไม่เรียกAPI/Firebaseหรือเขียนplayer storage Desktop1280ภาพชุดไพ่ก่อน/หลังเหมือนทุกbyte

ห้องlocalEmulators4browser contextsแลก3ขน5ทุกพ่อค้า PASSครบหนึ่งรอบ/เข้าสู่รอบ2 ร่างและคำแจ้งคงอยู่หลังreload คำสั่งตรงinstanceIdที่เลือก Inventory10จุดยัง360ใบ/unique360/รายชนิดและIDsครบ ล้างเฉพาะfixture1ห้อง4users ผล [verification/mobile-hand/report.md](verification/mobile-hand/report.md) ตรวจด้วยChromiumจำลองขนาดและtouch ยังไม่ทดสอบโทรศัพท์จริง/Safari งานอยู่ในเครื่อง ยังไม่commit/push/deploy

## ประวัติ — ไพ่พ่อค้าเป็นพัดโค้งตื้น

ผู้ใช้เลือกพัดไพ่โค้งตื้นและแตะแล้วยกขึ้น แยก MerchantHand/CSS Modules เป็นส่วนแสดงไพ่ส่วนตัว ใช้ภาพสินค้าและ texture กระดาษชุดเดิมของหน้าแรก ไพ่เลือกแลก/จัดกระเป๋าทั้ง6ใบคงลำดับและinstanceIdจากมือเดิม มุมสินค้า/มูลค่ามองเห็นขณะซ้อน เลือกแล้วยก32pxพร้อม✓ แตะซ้ำเอาออก มีรายละเอียดไพ่ที่กำลังดู จอแคบมากและข้อความ200%กาง2คอลัมน์อัตโนมัติ ใช้พื้นที่แตะอย่างน้อย44px/keyboard/reduced motion ไม่เพิ่มdragหรือแก้เกม engine/backend/data/Rules/ราคา/360ใบ/rulesVersion0.2

E2Eสุดท้าย5กรณีผ่านชุดเดียว: touch24มุม prepare/pack×4/5/6คน×360/390/430/1280, ไพ่สินค้าเดียวกันคนละใบ/เพดาน3และ5/เอาออกเลือกใหม่ผ่าน axe2มุมไม่มีviolations, readonly/busy/pendingไม่เปลี่ยนselection offlineแก้draftได้แต่ส่งไม่ได้, keyboard/reflow320/200%/reduced motionผ่าน Previewเดิม2กรณีผ่านไม่มีFirebase/API/player-storagewrites

ห้องจริงlocalEmulators4คนแลก3ขน5ทุกพ่อค้า PASSทุกรายครบหนึ่งรอบและส่งต่อนายด่านสู่รอบ2ผ่าน draftและคำแจ้งbreadอยู่หลังreloadทั้งprepare/pack cardIdsในคำสั่งตรงไพ่ที่แตะ inventory10จุด total360/unique360/IDและรายชนิดครบ seatOrderเดิม ล้างเฉพาะfixture1ห้อง4users TypeScript/lint/productionbuildผ่าน ไม่มีpageerror หลักฐาน [verification/merchant-hand/report.md](verification/merchant-hand/report.md) ขั้นนี้ยังไม่commit/push/deploy ไม่claimphysicalphoneหรือFirebaseจริง

## ประวัติ — texture หัวห้องตรงกับหน้าแรก

ย้ายลายไม้ SVG เดิมจาก home.html เป็น CSS token ร่วมใน globals.css หน้าแรกและหัวห้องใช้พื้นหลัง/เงาชุดเดียวกัน รวมหน้าเล่นเกมที่ใช้หัวห้องร่วมกับล็อบบี้ คงข้อความและขนาดเดิม แก้เฉพาะ CSS ไม่เปลี่ยนกติกาหรือข้อมูลเกม

ตรวจใน Chromium หน้าแรก/preview lobby/pack ที่360/390/1280px: background/border/shadow/repeat/size/positionตรงกันครบ6มุม ไม่มีล้นแนวนอน ปุ่มหน้าแรกสูงอย่างน้อย44px ไม่มีpageerror ภาพหัวหน้าแรก390pxก่อน/หลังตรงกันทุกbyte ProductionbuildและTypeScriptผ่านโดยแยกoutputจากdev server ไม่deploy หลักฐานในwork/runtime/header-texture ยังไม่commit/push

## ประวัติ — หน้าเล่นเกมโต๊ะกลม

ผู้ใช้รับข้อเสนอและสั่งลงมือ ใช้โต๊ะไม้กลมทุกเฟส ตัวละครเดิม/ชื่อ/เงิน/คำแจ้ง/สถานะ ผู้ชมล่างเสมอรวมเมื่อเป็นนายด่าน นายด่านคนอื่นบน สลับภาพไม่เกิน2คนและDOMยังเรียงตามserver ภาพตำแหน่งเก็บmemoryของหน้าที่เปิด เมื่อreloadจัดใหม่แต่self/sheriffตามเงื่อนไขและseatOrderจริงเดิม ไพ่และปุ่มใต้โต๊ะ มีjump link กลางโต๊ะเฉพาะpublictarget/bag/result รายละเอียดผล/score/rematchด้านล่าง

แยกGameTableView/game-seats/CSS Modules ใช้art/fontsร่วมกับLobbyView RoomClient/controls/draft/retry/pending/offline/readonly/confirmationเดิม ไม่แก้engine/backend/data/Rules/config/ราคา/360ใบ/rulesVersion0.2 พรีวิวเปลี่ยนนายด่านได้โดยไม่แตะFirebase/playerstorage Guardเมื่อabortระหว่างresolutionไม่แสดงผลเก่าหรือลิงก์ที่ไม่มีปลายทาง

TypeScript/lint/productionbuildผ่าน E2E9กรณีสุดท้ายผ่านจากชุดรวม8+ทวน4คน/preview3หลังแก้harness: layout30กรณี4/5/6×2roles×5widths, sheriffTransitions60, scene40/axe20ไม่มีviolations, keyboard44px/200%/320px/reducedmotion/privacy/passglowผ่าน Preview2และLobby2/M4ผ่านไม่ทำลายหน้าเดิม Homecontrastยังใช้highcontrastตามข้อจำกัดเดิม

เกมจริงlocalEmulators4คนแลก3ขน5PASS1/INSPECT2ครบหนึ่งรอบ/sheriffส่งต่อ/reloadผ่าน inventory7จุด total360/unique360/IDและรายชนิดครบ จากนั้นรอบ2ถึงresolutionแล้วabort/rematchผ่าน เกม5คน10รอบ/6คน12รอบ (caseM5pack1/exchange0) นายด่านคนละ2ครั้ง/เงินคะแนนทุกbrowserตรง/retry commandเดิม/offline+reload/control takeover/staleoffer/rematchผ่าน ไม่มีpageerror ล้างเฉพาะfixture4/5/6คนที่สร้างแล้ว ไม่claimphysicalphoneหรือFirebaseจริงรอบนี้

ผล [verification/game-table/report.md](verification/game-table/report.md) แบบ [../docs/game-table-design.md](../docs/game-table-design.md) เปิดhttp://localhost:4100/preview?scene=pack&role=merchant&players=6&width=390ได้ งานก่อนหน้าส่งbranchpreview760426eแล้ว งานใหม่ขั้นนี้ไม่มีcommit/push/deploy หยุดตามงานทีละขั้น

## ประวัติ — ล็อบบี้โต๊ะกลม

ผู้ใช้เลือกเริ่มเฉพาะล็อบบี้ก่อนเกม ทำโต๊ะไม้กลมและตัวละครที่เลือกจากhome.htmlล้อมรอบ ผู้ชมอยู่ล่างเสมอ ชื่อ/พร้อม/ออนไลน์/มงกุฎผู้จัดห้อง รหัส/เชิญเหนือโต๊ะ พร้อมด้านล่าง เริ่มกลางโต๊ะ callbackเดิม ไม่มีการสลับseatOrderจริง แยกLobbyView/CSS Modules/seat layout และRoomStatus presentation ใช้ทั้งห้องจริงและpreview

TypeScript/lint/productionbuildผ่าน E2E5กรณีในรอบสุดท้ายผ่าน: layout24มุม4/5/6คน×2roles×4widths โปรไฟล์ไม่ซ้อน/ไม่มีoverflow/selfล่าง/avatarตรง default-lobby axe0ทั้ง4ขนาด keyboard44px/200%text/320px/reduced-motion/state presetsผ่าน Preview isolationเดิมผ่าน M4home+live lobby/rulesผ่าน (home contrastยังใช้high contrast)

ทดสอบห้องจริง6contextsบนNext/Auth/RTDB Emulators: ชื่อ16ตัว avatar2–7 พร้อม/ยกเลิก realtime reloadที่นั่งเดิม offlineปิดคำสั่ง ทุกคนพร้อมและstartPREPAREรอบ1ผ่าน snapshot0.2/360/seatOrderเดิม ไม่มีpageerrorหรือFirebaseจริงrequests ล้างfixtureและidentityที่สร้างแล้ว ไม่รันเกมเต็มรอบหรือโทรศัพท์จริงซ้ำในขั้นนี้

ผล [verification/lobby-table/report.md](verification/lobby-table/report.md) แบบ [../docs/lobby-design.md](../docs/lobby-design.md) เปิดhttp://localhost:4100/preview?scene=lobby&role=sheriff&players=6&width=390ได้ งานก่อนหน้าคงไว้ ไม่แก้engine/backend/data/Rules/ราคา/สำรับ/rulesVersion ไม่commit/push/deploy

ขั้นล็อบบี้เสร็จ หยุดตามงานทีละขั้น หน้าเล่นเกมยังเดิม ขั้นถัดไปค่อยทำโต๊ะร่วมและนายด่านบน โดยตัวเองล่างเสมอ รวมเมื่อเป็นนายด่าน และสลับภาพนายด่านเก่า/ใหม่ตามคำตอบผู้ใช้

## ประวัติ — /preview ดูทุกเฟสโดยไม่ต้องเล่นจริง

เพิ่มhttp://localhost:4100/previewตามผู้ใช้ พร้อม11ฉาก/2มุมมอง/4–6คน/7สถานะ/iframe360/390/430/1280และauto เลือกจากURL/refreshได้ เปิดเต็มหน้า/reset/replayglowได้ iframeสูงตามเนื้อหาทั้งหน้า ปุ่มส่งผลเฉพาะตัวอย่างและอ่านสินค้า/ราคาจากconfig0.2/360 ไม่สร้างเกมจริง

แยกRoomViewจากRoomClientเพื่อใช้presentationร่วมกัน RoomClientยังถือAuth/realtime/presence/commands/storage/clipboard/abortconfirmation ส่วนRoomPreviewใช้syntheticviewsและmemorycallbacks ไม่importFirebaseหรือtests/fixtures ใช้purecalcเดิมเพื่อแสดงผล/คะแนนตัวอย่าง persistDraft=false ไม่แตะdraft/active-room/pendingของผู้เล่น มีnoindex/allowlistquery/roomIDที่ไม่ผ่านvalidationจริง ไม่เพิ่มseed/debugdatabase endpoint

TypeScript/lint/buildผ่าน รวมE2E4กรณีผ่านในรอบเดียว: Previewisolation/scene22มุม+playercounts/statepresets/viewportจริง/URLfallbackผ่าน requestsAPI/Firebase0 และplayerStorageไม่มีwrite/remove/clear M4keyboard/reflow/reducedmotion/clipboard/home+live-lobbyผ่าน และM5เกมจริง5contextsจบ10รอบพร้อมretry/offline/controltakeover/staleoffer/rematchผ่าน จากนั้นทวนPreview2หลังautoheight/storageaudit/เลือกไพ่1ใบตรงviewผ่าน ไม่claimFirebaseจริงหรือfullmatrixรอบนี้

ผล [verification/preview-route/report.md](verification/preview-route/report.md) วิธีใช้docs/preview.md คงงานหน้าแรกก่อนหน้าทั้งหมด ยังไม่commit/push/deployProduction ขั้นpreviewเสร็จแล้วหยุดตามงานทีละขั้น พร้อมใช้ตรวจdesignหน้าห้อง/เกม/ผล/คะแนนต่อ

## ประวัติ — คืนหน้าแรกและเอฟเฟกต์ตรง home.html

ผู้ใช้เลือกกลับมาทำdesignและต้องการเอฟเฟกต์/animationเหมือนhome.htmlโดยตรง ขั้นนี้คืนหน้าแรกด้วยSVGinline/CSSจากต้นฉบับ/Chonburi+Sarabun/อวาตาร์8แบบ ไม่เปลี่ยนengine/backend/data access/กติกา/ราคา/360ใบ/rulesVersion ฟอร์มใช้APIจริง spinnerรอresponseและstampหลังreceiptที่commitแล้ว ก่อนเข้าล็อบบี้ ไม่มีrandomCodeหรือsuccesssimulation

เทียบheader/hero/form14จุด360/390/430/1280ไม่มีความต่าง ภาพheroเท่ากันระดับpixelทั้ง4ขนาด Keyframes13ชุดตรงsource แสงประตู/ไฟ/ธง/ดาว offscreenpause tokenflip0.55s deal0.9s+delay120ms tilt/glare bag1.4s spinner0.8s stamp0.38s และreducedmotionพร้อม CSSscope/keyframeprefixไม่ทับหน้าเกม

TypeScript/lint/productionbuildผ่าน M0/M4targeted3กรณีผ่าน (2+1rerun) keyboard/radio/touch/200%text/reducedmotion/Auth/API/RTDB/reload/clipboardfallbackผ่าน Axeในโหมดเพิ่มcontrast0violations10snapshots ส่วนสีปกติคงต้นฉบับมีtag-legalcontrast3.77เป็นข้อจำกัดที่บันทึกไว้ ไม่อ้างว่าปกติaxe0

ทดสอบbrowser→NextAPI→FirebaseEmulators4profilesสร้าง/เข้าห้อง/พร้อม/เริ่ม แลก3ขน5PASSครบหนึ่งรอบ/manualadvanceรอบ2และreloadผ่าน Conservation360/unique360/IDเดิม/รายชนิด6checkpoints ไม่มีpageerror actualAPIerror/offline/draft/receipt/avatarIdผ่าน ล้างflowfixture1ห้อง/5usersแล้ว ไม่มีFirebaseจริงwrites/Rules/Productiondeployment รอบนี้แก้harnesslocatorsและรอphaseให้ถูก ไม่แก้engineเพื่อผ่าน

ตัวอย่างในเครื่อง http://localhost:4100 หลักฐาน [verification/home-fidelity/report.md](verification/home-fidelity/report.md) ยังไม่commit/push/deploy ขั้นนี้หน้าแรกเสร็จตามต้นฉบับ หยุดตามงานทีละขั้น หน้าเกม/ล็อบบี้/ผล/คะแนนเป็นงานdesignถัดไปเมื่อผู้ใช้สั่ง Productionปัจจุบันยังเป็นreleaseเดิมที่ตรวจแล้ว ระบบล้างห้องอัตโนมัติยังปิด

## ประวัติ — Production พร้อมเล่นผ่าน URL หลัก

ผู้ใช้อนุมัติให้ URLหลักเข้าได้โดยไม่ต้องล็อกอินVercel เปิด [merchant-s-bluff.vercel.app](https://merchant-s-bluff.vercel.app) แล้ว Preview/URLของแต่ละdeploymentยังป้องกันตามเดิม ไม่เปลี่ยนprotectionทั้งproject ลิงก์เพื่อนเดิมยังอยู่ ใช้Firebase `merchant-s-bluff` ร่วมตามอนุมัติและคงแผนฟรี

Release source `b4b68d2` สร้างstaged Production `dpl_G322moM1bDSobZFR2kTVcdxccTe3` และทดสอบbrowser→API→Firebaseจริง4/5/6คนจบ8/10/12รอบก่อนpromote: conservation311จุด/360ใบไม่ซ้ำหายรายชนิดและIDเดิมครบ/privacy54assertions/retryหลังcommit/offline/reload/controltakeover/rematchผ่าน นายด่านคนละ2ครั้ง เกม4คนผสมINSPECT/PASS ส่วน5/6แลก3ขน5PASSตลอด Bundle9deployedJSไม่มีkey/email/Cron secret/bypass token ไม่มีEmulator requests/pageerrors ไม่อ้างว่ารันmatrixไม่แลก/แลก3ทั้ง6กรณีบนProductionซ้ำ

หลังpromoteส่งcommitเดียวกันไปGitHub main Git integrationสร้าง `dpl_79birapraqG3C2ks5BKYMS4HYE54` READY / Production / Node24.x / sin1 ตรวจURLหลักด้วยfreshChromium4contexts360/390/430/1280px ไม่มีVercelcookies/sharetoken/customauthheaders สร้าง/เข้าห้องเล่นครบหนึ่งรอบแลก3ขน5PASS แล้วmanualadvanceไปรอบ2และreloadที่นั่งเดิมผ่าน ไม่มีoverflow/pageerror APIไม่มีFirebaseidentityได้401 Previewได้302 ผลเกมเต็มเป็นstagedartifactและpublicsmokeเป็นGitartifactcommitเดียวกัน

Health200/diagnostics404/maintenanceไม่มีsecret401/มีsecret200dry-runจริงผ่าน LOBBYdeadline24h/PLAYINGไม่มีdeadline/resumeต่ออายุmetadataโดยgameไม่เปลี่ยนผ่าน `RETENTION_APPLY_ENABLED=false` คงปิดการล้างอัตโนมัติ Cronที่เผยแพร่ยังdry-run Errorlogqueryหลังpublicsmokeย้อนหลัง30นาที/limit20ไม่พบรายการ ล้างเฉพาะข้อมูลทดสอบ4ห้อง/20Anonymoususersครบ และถอนautomationbypassที่งานนี้สร้าง1รายการแล้ว MainURLยัง200/PreviewและstagedURLยัง302

เอกสารและหลักฐาน [verification/production-release/report.md](verification/production-release/report.md) ไม่เปลี่ยนengine/backend/data access/UI/rulesVersion/ราคา/สำรับหรือFirebaseRules M0–M5ขอบเขตเดิมคงผลตรวจที่ผ่านมา M4ภาพสุดท้ายยังพัก ผู้ใช้แจ้งhumanmultiplayerก่อนหน้านี้ผ่าน ผลProductionรอบนี้เป็นbrowserautomationไม่ใช่โทรศัพท์จริง ขั้นdeployเสร็จแล้ว หยุดรอคำสั่งตามงานทีละขั้น ขั้นถัดไปคือเปิดและตรวจretentionapplyตามนโยบาย24ชั่วโมง

## ประวัติ — เตรียม Production environment โดยใช้ Firebase ร่วมตามอนุมัติ

ผู้ใช้ระบุ `merchant-s-bluff` และยืนยันให้ใช้ Firebase ร่วมกันสำหรับเว็บเล่นกับเพื่อน จึงบันทึกข้อยกเว้นจากแผนแยก project เดิม: Preview/Production ใช้ Auth/RTDB ชุดเดียวกัน แต่ตัวแปร Vercel แยก scope คงแผนฟรี ไม่คำนวณค่าใช้จ่าย ไม่สร้าง project หรือเปลี่ยน Rules ในขั้นนี้

เตรียม `.env.production.local` แบบ ignored โดยคง Emulator/Preview files เดิม เพิ่ม Production-only variables 14 ชื่อบน Vercel ตรวจ Config readback 12 ค่าตรง; `FIREBASE_PRIVATE_KEY`/`CRON_SECRET` เป็น Secret และ Preview variables/protection เดิม Node 24.x / sin1; `RETENTION_APPLY_ENABLED=false` ยืนยันจาก Config readback

ตัวตรวจ 10/10 และ deployment checker 7 กรณีผ่าน OAuth/Rules/Auth read-only ผ่าน (Rules hash ตรง source/root deny/Anonymous enabled), local production build+TypeScript ผ่าน HTTP health200/dev404/unauth-create401/maintenance-no-Bearer401/valid-Bearer200 dry-run ผ่าน Bundle14ไฟล์ไม่มีprivate key/email/Cron secret/server module ไม่มีdemo ไม่สร้างห้องหรือบัญชี ไม่ล้างห้อง และหยุดserverตรวจแล้ว

ยังไม่ deploy เว็บไซต์ Production และผล HTTP เป็น local production build ที่จำลอง `VERCEL_ENV=production` ไม่ใช่ผลจาก URL Production สาขาProductionยังmainซึ่งเป็นโค้ดรุ่นเริ่มต้น โค้ดล่าสุดอยู่preview ต้องใช้รุ่นล่าสุดในการเผยแพร่ขั้นถัดไป คู่มือ `docs/production-setup.md` หลักฐาน `verification/firebase-production/report.md` ขั้นนี้เสร็จแล้ว หยุดรอคำสั่งสำหรับ deploy และตรวจ URL Production จริง

## ประวัติ — คงแผนฟรีและข้ามการคำนวณค่าใช้จ่ายตามผู้ใช้

ผู้ใช้เลือกข้ามการคำนวณค่าใช้จ่าย เพราะเว็บใช้เล่นกับเพื่อนและใช้ free plan จึงยุติงานคำนวณต้นทุนและเปรียบเทียบแพ็กเกจ บันทึกใน `docs/free-plan-decision.md` ตรวจ Vercel team ที่ผูกกับโปรเจกต์แล้วเป็น Hobby/active ส่วน Firebase free plan เป็นข้อมูลที่ผู้ใช้ยืนยัน ไม่อ้างว่าตรวจ billing/usage ได้หรือรับประกันยอดศูนย์

Vercel usage CLI ไม่มี cost data ของช่วงนี้ และ metrics ต้องใช้ Observability Plus; service account อ่าน Firebase billing/monitoring ไม่ได้ ไม่อัปเกรดหรือเปลี่ยนสิทธิ์เพื่ออ่าน ไม่มีการแก้ engine/backend/UI/Rules/env หรือเปิด Production/Cron ขั้นนี้เป็นการบันทึกการตัดสินใจ จึงตรวจเฉพาะเอกสารและ Git diff ขั้นถัดไปเตรียม environment ใช้งานแยกจาก Preview ตามแผน โดยคงแผนฟรี

## ประวัติ — Retention 24 ชั่วโมงผ่านการตรวจบน Preview

ผู้ใช้แจ้งว่าเล่นหลายคนกับเพื่อนผ่านแล้วและให้เริ่มงานretention พร้อมเลือกเก็บ1วันทั้งหมด จึงเพิ่มmetadataนอกgame snapshotสำหรับLOBBY/FINISHED/ABORTED เมื่อไม่มีAPIที่ถูกต้องมาใช้24ชั่วโมงและไม่มีคนออนไลน์ ส่วนPLAYINGไม่ล้างและlegacyไม่มีmetadataถูกข้าม เกม0.1/0.2/rulesVersion/ราคา/สำรับไม่เปลี่ยน M4ภาพสุดท้ายยังพัก

Default CLIเป็นdry-run มีmanifestprivateอายุ1ชั่วโมง project/URL/version checks และRules preflight เพิ่มpresence fenceระหว่างcleanup, revalidate lifecycle/revision/activityในtransactions, expired markerกันrecreate, คืนcodeเฉพาะห้องเดิม, กู้worker crash/rematch/resume/create-retry racesได้ ไม่ลบบัญชีAuthหรือrate limitsของผู้เล่น

ตรวจtypecheck/lint/buildผ่าน Unit89, integration28, E2E17ผ่าน รวมmatrix4/5/6คนขน5/PASSตลอดไม่แลก/แลก3 (conservation360), recovery/accessibility/restart จากนั้นทวนintegrationหลังเพิ่มcreate-retryและfenceไม่หมดอายุในRulesผ่านอีกครั้ง เผยแพร่เฉพาะpresence predicateที่เข้มขึ้นไปFirebasePreviewและreadbackตรงsource ทดสอบlivefixture8ชุดผ่าน ล้างfixtureออกครบ ไม่มีห้องผู้เล่นถูกแก้ CLIจริงdry-run/applycandidate0 ข้ามlegacy2

เตรียมVercel maintenance endpointพร้อมBearer secret/explicitProduction opt-inและdailyCron03:00ไทย Runnerมีbatch/cursor/lease ยังไม่มีProduction configหรือเปิดautomatic deletion Previewendpointไม่เปิดapply คู่มือ `docs/retention.md` หลักฐาน `work/verification/retention/` ขั้นถัดไปตรวจusage/ข้อจำกัดก่อนเตรียมFirebaseProductionและdeploymentจริง

Git integration deploy commit `034a2c7` ผ่าน READY บน Preview `dpl_6Kprgk2BRkBkTCAarCQYaCarYJxz` (Node 24.x / sin1) ตรวจ browser→Vercel API→Firebase จริง 4 คน แลก3/ขน5/ให้ผ่านครบหนึ่งรอบและ reload ผ่าน conservation360, LOBBY deadline24h / PLAYINGไม่มีdeadline / resumeต่ออายุโดยgameไม่เปลี่ยน / publicไม่มีmetadata ผ่าน ล้างห้องและAuth4บัญชีที่สร้างเพื่อทดสอบครบ Bundleจริง9ไฟล์ไม่มีserver credential ไม่มีtemporary bypassใหม่ ลิงก์เพื่อนเดิมยังอยู่และชี้deploymentก่อนretention ดู `verification/retention/preview-smoke.json` และ `deployment.json`

## ประวัติ — ลิงก์ทดลองกับกลุ่มเพื่อนพร้อม

ผู้ใช้เลือกเตรียมลิงก์ทดสอบเฉพาะกลุ่ม สร้างdeployment shareable linkสำหรับ `dpl_HgG5ifxnEs71eB7Xg5tZRw6aAnh2` ที่ตรวจเกมครบแล้ว อายุ7วัน หมดอายุ19ตุลาคม2026 14:37ไทย ใครมีลิงก์เข้าได้ ลิงก์/tokenอยู่ในแชทและignoredruntimeเท่านั้น ไม่ได้ส่งให้เพื่อนแทนผู้ใช้

Fresh Chromium contexts4ชุด 360/390/430/1280px ไม่มีVercel login/cookies/customauthheaders เปิดsharedentryแล้วสร้าง/เข้าห้องผ่านFirebaseจริงครบ4คน เล่นหนึ่งรอบโดยแลก3ขน5PASS3คน แล้วกดmanualadvanceไปรอบ2และreloadกลับUID/ที่นั่งเดิมได้ ไพ่total/unique360/IDเดิมครบ ไม่มีoverflow/pageerror BareURLก่อนshare302, createที่ไม่มีFirebasetoken401แม้ผ่านshareแล้ว, deploymentอื่น302 ล้างเฉพาะห้องทดสอบ1ห้อง/4usersครบ

เตรียม `docs/friend-playtest.md` พร้อมวิธีชวนกลุ่ม/ทุกขั้นตอน/feedback templateและวิธีrevoke ลิงก์เต็มอยู่ `work/runtime/firebase-preview/friend-invite.md` ไม่เข้าGit เก็บผลและmetadataที่ไม่ติดtokenใน `work/verification/friend-playtest/` ไม่เปลี่ยนsource/UI/game/Rules/ราคา ไม่claimว่าbrowsermobileเป็นโทรศัพท์จริงหรือhuman balance playtest

ขั้นนี้เสร็จแล้ว รอผู้ใช้ลองกับเพื่อนและส่งfeedback หรือสั่งขั้นถัดไป M4ภาพสุดท้ายยังพัก Productionยังเป็นขั้นแยก

## ประวัติ — GitHub และ Vercel Preview ผ่าน

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
