# ไพ่พัดโค้งตื้น — 13 ตุลาคม 2026

ผู้ใช้อนุมัติพัดไพ่โค้งตื้นและแตะแล้วยกขึ้น ใช้ทั้งช่วงแลกไพ่และจัดกระเป๋า แยก presentation ใน `src/components/cards/merchant-hand.tsx`/CSS Modules ส่วน draft และคำสั่งยังอยู่ใน MerchantControls ไม่แก้ game engine/backend/data access/Rules/config/ราคา/ค่าปรับ/ชดเชย/360ใบ/rulesVersion0.2

ภาพสินค้าเดิมและ texture กระดาษของหน้าแรกใช้ร่วมกัน ไพ่มีมุมสินค้า/มูลค่าที่เห็นเมื่อซ้อน เลือกแล้วยก32pxพร้อมเครื่องหมาย✓ คงลำดับDOMและinstanceId มีรายละเอียดของใบที่กำลังดูโดยไม่เลือกเพิ่ม เพดานครบแล้วยังอ่านรายละเอียดได้แต่เปลี่ยนselectionไม่ได้ จอแคบมากกาง2คอลัมน์ พื้นที่แตะ44px ไม่เพิ่มการลากไพ่หรือข้อมูลของผู้อื่น

## ผลตรวจ

- TypeScript, lint และ production build ผ่าน ใช้outputแยกจากdev server
- E2Eสุดท้าย **5/5ผ่านในชุดเดียว**: ชุดไพ่3กรณี + Previewเดิม2กรณี
- Touch24มุม: prepare/pack × 4/5/6คน × 360/390/430/1280px เลือกสินค้าเดียวกันคนละinstance, เพดาน3/5, deselect/reselect, ไพ่ยกและcounterผ่าน ไม่มีล้นแนวนอน ไม่มีpageerrorหรือAPI/Firebaserequestsจากพรีวิว
- Axeเฉพาะชุดไพ่ prepare/pack ที่390px/6คน ไม่พบviolations คีย์บอร์ดSpace/Enter/Tab, reduced motion, 320pxและขยายข้อความ200%ผ่าน ตรวจตัวเลขมูลค่าสองหลักไม่ตัดบรรทัด
- readonly/busy/pendingไม่เปลี่ยนselection Offlineยังเลือกร่างได้และส่งคำสั่งไม่ได้ พรีวิวไม่เขียนstorageของเกมจริง
- ห้องจริง **4 browser contexts** บนAuth/RTDB Emulators: พ่อค้า3คนแลก3ใบ ขน5ใบ แจ้งbread PASSทุกราย ครบหนึ่งรอบและเริ่มรอบ2 ร่างไพ่/คำแจ้งคงอยู่หลังreloadทั้งสองเฟส cardIdsที่APIรับตรงกับที่เลือก บัตรที่แลกถูกแทนที่จริงและbagตรง5ใบ
- Inventory10จุด: total360/unique360/รายชนิดและinstanceIdครบ seatOrderคงเดิม ล้างเฉพาะfixtureที่สร้าง1ห้องและ4anonymous usersหลังทดสอบ

ข้อมูลสรุป: [touch.json](touch.json), [live-4-player.json](live-4-player.json) ภาพ selected-390/1280 และ text-200 อยู่ในโฟลเดอร์นี้และถูกignore Raw Playwright reportอยู่ `work/runtime/merchant-hand/e2e.json`

ตรวจด้วยChromiumและขนาดหน้าจอจำลอง ยังไม่ทดสอบโทรศัพท์จริง/SafariหรือFirebaseจริงในขั้นนี้ ไม่มีcommit/push/deploy
