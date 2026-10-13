# หน้าเล่นเกมโต๊ะกลม — 13 ตุลาคม 2026

ตามผู้ใช้อนุมัติ [แบบและขอบเขต](../../../docs/game-table-design.md) หน้าเกมทุกเฟสใช้โต๊ะกลม ตัวละคร/ชื่อ/เงิน/คำแจ้ง/สถานะ นายด่านคนอื่นอยู่บนและเราอยู่ล่างเสมอ ไพ่และคำสั่งใต้โต๊ะ ผลpublicกลางโต๊ะ/รายละเอียดด้านล่าง พร้อมscore/abort/rematch

## สิ่งที่เปลี่ยนและขอบเขต

RoomViewเป็นdispatcherของLobbyView/GameTableView แยกภาพโต๊ะ/ฟอนต์มาใช้ร่วม game-seats.tsเก็บdisplay slotsและสลับไม่เกิน2คนโดยไม่เปลี่ยนpublic playersหรือseatOrderจริง DOMของผู้เล่นยังเรียงตามลำดับserverเพื่ออ่านและตรวจเงินร่วมกัน CSS Modulesเฉพาะgame; MerchantControls/SheriffControls, RoomClient, engine/backend/data/Rules/config/ราคา/360/rulesVersionเดิมทั้งหมด

layoutจำไว้ในmemoryของหน้าปัจจุบัน เมื่อreloadจัดภาพใหม่โดยตรึงself/sheriffตามเงื่อนไข ไม่อ้างว่าตำแหน่งภาพผู้เล่นคนอื่นเหมือนก่อนreloadทุกคน Private hand/bagใช้เฉพาะข้อมูลownของผู้เล่น ส่วนกลางโต๊ะ/ผลอ่านPublicRoomView PASSไม่มีsecret product types; INSPECTใช้revealedที่serverอนุญาต ทั้งrealและpreviewใช้rendererเดียวกัน พรีวิวเพิ่มการเปลี่ยนนายด่าน/roundตัวอย่างและคงviewerเดิม ไม่มีrequestsAPI/Firebaseหรือการเขียนplayer storage

## ผลตรวจ

- TypeScript, ESLint และproduction buildผ่านด้วยsourceรอบสุดท้าย มี `/preview` และ `/room/[roomId]`
- E2E9กรณีสุดท้ายผ่าน: เกมโต๊ะ2, lobby2, M4home/lobby1, M5เกม5/6คน2, preview2 ผล [validation.json](validation.json)
- Layout30กรณี: count4/5/6 × 2roles × width360/390/430/740/1280 รวมlandscapeสั้น โต๊ะวงกลม โปรไฟล์ไม่ซ้อน/selfล่าง/sheriffอื่นบน/ไม่มีoverflow/พื้นที่คำสั่งอยู่ใต้โปรไฟล์
- เปลี่ยนนายด่านในพรีวิว60ครั้ง รวมเราเป็น/ส่งต่อตำแหน่ง สลับภาพไม่เกิน2คน DOMplayerorderคงเดิมทั้งหมด
- ฉาก10แบบ×2roles×2widths=40 ตรวจaxeWCAG2/2.1/2.2A/AAที่360pxรวม20ฉากไม่พบviolations Keyboardเลือกไพ่/ปุ่มข้ามไปพื้นที่ตัวเอง/targets44px/200%text/320px/reduced motionผ่าน ไม่มีpageerror
- PASSทั้งlegal/contrabandไม่เผยชื่อเหล้าเถื่อน/หน้าไม้/ใบกัญชาในtable centerและresult; glowเฉพาะbooleanที่อนุญาต INSPECTแสดงrevealedจริงในpublicresult
- ห้องจริง4คนบนNext/Auth/RTDBEmulators แลก3ขน5ครบหนึ่งรอบ PASS1/INSPECT2 ส่งต่อรอบ2และreloadตำแหน่งหลักถูกต้อง ตรวจconservation7checkpoints: total360/unique360/IDเดิมและจำนวนรายชนิดครบ seatOrderเดิม จากนั้นเล่นรอบ2ถึงRESOLUTIONแล้วabort ตรวจไม่มีกระเป๋าผลเก่า/linkที่ไม่มีปลายทาง และrematchกลับlobbyผ่าน [live-4-player.json](live-4-player.json)
- M5เกม5คนจบ10รอบและ6คนจบ12รอบ นายด่านคนละ2ครั้ง เงิน/คะแนนตรงทุกbrowser Lostresponse retrycommandIdเดิม, offline draft+reload, controltakeover, staleoffer confirmation และrematchผ่าน [game5](m5-regression/game-5.json), [game6](m5-regression/game-6.json)
- M4หน้าแรก/ล็อบบี้/กติกาและlobbyทั้ง24มุมผ่านหลังแชร์art/fonts หน้าล็อบบี้สีปกติผ่านaxe4ขนาด ส่วนหน้าแรกhighcontrastคงตามข้อจำกัดhome.htmlเดิม
- ล้างเฉพาะfixtureที่สร้าง: ห้อง4/5/6คนและanonymousidentitiesตรงplayerIdsของcontexts เปรียบเทียบsnapshotmembersก่อนลบ SDKบังคับloopback/demo ถ้าoriginไม่ใช่localhostจะไม่ลบ [cleanup5](m5-regression/cleanup-5.json), [cleanup6](m5-regression/cleanup-6.json)

ชุดรวมเริ่มต้นผ่าน8/9; harness4คนกดพร้อมต่อเนื่องโดยไม่รอack ทำให้ตอนrevisionกำลังsyncมีเพียง3setReadyrequests ทั้ง3ได้200และstartยังdisabledถูกต้อง ทวนharnessให้รอยกเลิกพร้อมenabledหลังackและแก้การอ่านbagCountในDecisionRecord.result แล้วผ่าน จากนั้นเพิ่มabortduringresolution guardและทวน4คน+preview2ด้วยsourceสุดท้ายผ่าน3กรณี ไม่อ้างว่า9กรณีผ่านในexecutionเดียว

React review: display historyเป็นlocalstateไม่ใช่gamestate ไม่เก็บSDK/cacheบนserver ไม่มีderived-state effectsสำหรับชื่อ/เงิน/สถานะ คำนวณจากprops ใช้conditionalstate updateเฉพาะactor/game/viewerเปลี่ยน playerkeysคงที่ CSStransition380msและหยุดเมื่อreducedmotionผลglowยัง700msแบบเดิม Private draft/command callbacksเดิมไม่เปลี่ยน

เป็นChromiumจำลองขนาดและEmulators ไม่มีFirebaseจริงwritesหรือphysicalphone/Safari proof ไม่ทวนmatrixทุกเกมแลก0/3ขน5จนจบทั้ง6เงื่อนไขซ้ำในงานUIนี้ หลักฐานM5รอบนี้pack1/exchange0ตามcaseเดิม และ4คนpack5/exchange3ตามcaseใหม่

ภาพ pack-merchant-360.png, negotiate-sheriff-390.png, pass-contraband-merchant-430.png, inspect-contraband-sheriff-1280.png และtext-200.pngถูกignored Geometry/axe [visual-check.json](visual-check.json), [accessibility.json](accessibility.json) ไม่มีtokens/credentialsในรายงาน

## สถานะ

พร้อมในเครื่อง **http://localhost:4100/preview?scene=pack&role=merchant&players=6&width=390** งานก่อนหน้าส่งbranchpreviewcommit760426eแล้ว งานหน้าเกมรอบนี้ไม่มีcommit/push/deploy หยุดเมื่อส่งมอบขั้นนี้
