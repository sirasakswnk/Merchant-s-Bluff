# ภาพหน้าการ์ดจาก card.zip — 13 ตุลาคม 2026

นำภาพผู้ใช้ครบ7ชนิดมาใช้กับMerchantHandและภาพย่อรายละเอียด ภาพมีชื่อ/มูลค่า/ชดเชยหรือค่าปรับตรงrulesVersion0.2ทั้งหมด ใช้ภาพเต็มใบแทนส่วนประกอบหน้าไพ่เดิม โดยคงsemantic button/aria-label/pressed/disabledและข้อมูลจากrules snapshot ป้ายเลือกแล้วอยู่ใต้กรอบภาพ การหมุนครึ่งวงกลมและขนาดไพ่เดิมคงไว้

ไฟล์public/art/cards/*.webpมีขนาด1024×1536pxและเป็นlossless ตรวจdecoded RGB pixelsตรงPNGต้นทางทั้ง7ภาพ ผล [assets.json](assets.json) ใช้Next/Imageและsizesเป็นremเพื่อให้เลือกresolutionตามจอ/ข้อความ200% ภาพใช้object-fit:containและdraggablefalse ไม่มีการcropรายละเอียดหรือแก้ตัวอักษรในต้นทาง

## ผลตรวจ

- TypeScript, lint และproduction buildผ่าน ใช้build outputแยกจากdev server
- E2E **10/10ผ่านชุดเดียว**: merchant-hand UI2 + mobile-hand6 + Previewเดิม2 ไม่มีกรณีเกม4คนในชุดนี้
- Gestureprepare/pack×320/390/430pxยังเคลื่อนตามวงกลม/snap เลือกแล้วปัดไม่เปลี่ยนselection แตะไพ่โผล่ริมจอเลือกถูกใบ keyboardอ่านครบทุกใบ ไม่มีpage overflow/axe violations
- Touch24มุม prepare/pack×4/5/6คน×360/390/430/1280px เพดาน3/5 สินค้าเดียวกันต่างinstanceId/เอาออกเลือกใหม่ผ่าน Keyboard/ข้อความ200%/reduced motion/readonly/busy/pending/offlineผ่าน
- Previewทุกscene/role/count/state/iframeเดิมผ่าน ไม่มีpageerror/API/Firebase requestsหรือplayer-storage writes
- ตรวจภาพจริงที่390และ1280px/DPR2 ภาพในมือและรายละเอียดโหลดสำเร็จ ใช้contain ไม่มีการลากภาพและไม่มีpage overflow [images.json](images.json)
- Optimizer384pxของสินค้าทั้ง7ตอบ200 ขนาดที่ส่ง22–29KBต่อภาพในคำขอตรวจ ส่วนไฟล์ต้นทางlosslessคงไว้ ภาพcaptureอยู่work/runtime/card-art
- ตรวจselected badgeบนdesktopหลังปรับตำแหน่ง มีเครื่องหมาย✓และไม่ทับตัวเลขในภาพ

ผลUIอยู่touch.jsonและgestures-{prepare,pack}-{320,390,430}.json Raw Playwright reportอยู่work/runtime/card-art/e2e.json ไม่มีการแก้useArcHand/engine/backend/data access/Firebase Rules/config/ราคา/360ใบ/rulesVersion0.2

ตรวจด้วยChromiumจำลองขนาด/touch ยังไม่ทดสอบโทรศัพท์จริง/SafariหรือเกมFirebase/Emulatorsซ้ำในขั้นassetsนี้ งานยังอยู่ในเครื่อง ไม่มีcommit/push/deploy
