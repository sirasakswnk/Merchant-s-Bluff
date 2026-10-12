# แผนพัฒนาเกม “พ่อค้าหน้าประตู” สำหรับ Codex

สถานะ: กติกาฉบับทดลอง 0.2 ที่ผู้ใช้ยอมรับ — เพิ่มจำนวนสำรับเป็น360ใบสำหรับเกมใหม่
วันที่อัปเดต: 12 ตุลาคม 2026
สถาปัตยกรรม revision 0.2: Vercel + Firebase Realtime Database ตามข้อกำหนดผู้ใช้; rulesVersion0.2เปลี่ยนเฉพาะจำนวนสำรับ ไม่เปลี่ยนราคา/ค่าปรับ/ชดเชยหรือกติกาอื่น
ภาษา UI: ไทย | แพลตฟอร์ม: เว็บบนมือถือและเดสก์ท็อป | ผู้เล่น: 4–6 คน

## 0. คำสั่งสำหรับ Codex ที่รับช่วงพัฒนา

ให้ลงมือสร้างเกม multiplayer ที่เล่นได้จริงตามแผนนี้ ไม่หยุดที่ mockup หรือข้อเสนอ ใช้เอกสารนี้เป็นข้อกำหนดหลักของโปรเจกต์ใหม่ ไม่ใช่การแก้เกม “ใจตรงกันแค่ไหน” เดิม

- อ่าน AGENTS.md, README, package manifest และโครงสร้าง repository ก่อนแก้ไฟล์ หากมีโค้ดเดิมให้รักษางานของผู้ใช้และใช้ระบบเดิมที่เหมาะสม
- ถ้าเป็นโฟลเดอร์ว่าง ให้สร้างโปรเจกต์ใหม่ตามแนวทางเทคนิคด้านล่าง หากต้องทำใน repository ของเกมอื่นให้แยกขอบเขตชัดเจน ห้ามทับเกมเดิม
- ทำทีละ milestone ให้เล่นได้จริงตั้งแต่ engine ไปจนถึง UI และ multiplayer
- บันทึกความคืบหน้าใน checklist นี้ พร้อมผลตรวจจริง ห้ามทำเครื่องหมายเสร็จเพียงเพราะสร้างไฟล์แล้ว
- ตัดสินใจรายละเอียด implementation ที่ย้อนกลับได้เอง บันทึกสมมติฐานใน README แต่ห้ามเปลี่ยนกติกาหลัก ตัวเลข หรือเพิ่มฟีเจอร์ใหญ่เอง
- หาก API/dependency ไม่แน่ใจ ให้ตรวจเอกสารทางการ ณ เวลาลงมือ ใช้เวอร์ชันที่รองรับร่วมกันและ lockfile ไม่เดา API
- เมื่อเสร็จสรุปสิ่งที่ทำ ไฟล์สำคัญ วิธีรัน ผลทดสอบ และข้อจำกัดตามจริง
- แผนนี้อนุญาตให้พัฒนาและทดสอบในเครื่อง การเผยแพร่สู่สาธารณะเป็นงานแยก ไม่จำเป็นต่อการส่งมอบ MVP

### ข้อกำหนดการลงมือทำจากผู้ใช้ — 11 ตุลาคม 2026

- เริ่มจาก M0 และตรวจทีละ milestone ด้วยการรันจริง
- งานที่ผู้ใช้กำหนดให้ทำครั้งละหนึ่งขั้นตอน ต้องทดสอบและสรุปแล้วหยุดรอ เว้นแต่ผู้ใช้อนุญาตให้ทำต่อในคำสั่งนั้น
- คำสั่งใหม่สำหรับ360ใบ: แก้สำรับ/config/fixtures/tests/docs/rulesVersion ตรวจเกณฑ์milestoneปัจจุบันและพัฒนาต่อได้ภายในขอบเขตlocalที่อนุญาต เกมที่เริ่มแล้วคงsnapshotเดิม ไม่เพิ่มไพ่กลางเกม งานภาพที่ยังไม่ได้เลือกยังพักและdeploymentสาธารณะยังเป็นงานแยก
- merchant-gate.html ยังไม่อนุมัติ ห้ามยึดเป็นดีไซน์สุดท้าย ใช้ UI ชั่วคราวเรียบง่าย อ่านง่าย และรองรับมือถือก่อน
- ผู้ใช้ส่ง home.html เป็นดีไซน์หน้าแรกแล้ว ใช้เป็น reference ของหน้าแรกตาม docs/home-design.md; หน้าอื่นยังใช้ placeholder และงานภาพที่ไม่ได้เลือกยังพักไว้
- แยก game engine, backend, data access และ UI เพื่อเปลี่ยนหน้าตาโดยไม่เปลี่ยนกติกา
- M4 ทำ responsive/accessibility/safe area/reduced-motion ก่อน พักการตกแต่งและภาพขั้นสุดท้ายจนผู้ใช้เลือกดีไซน์ ไม่รอภาพเพื่อทำ gameplay
- ไม่เปลี่ยนกติกาหรือราคาสินค้าเอง

## 1. เป้าหมายและขอบเขต MVP

เกมแข่งขันบลัฟและเจรจา ผู้เล่นเป็นพ่อค้าขนสินค้าเข้าเมือง ผลัดกันเป็นนายด่าน ทุกคนใช้มือถือของตัวเองและพูดคุยผ่านแอปภายนอกหรือพูดต่อหน้ากัน

MVP ต้องมี:

- สร้างห้อง เข้าด้วยรหัส/ลิงก์ ชื่อและอวาตาร์ สถานะพร้อม และเริ่มเกม 4–6 คน
- ระบบแจกไพ่ เปลี่ยนไพ่ จัดกระเป๋า แจ้งสินค้า ข้อเสนอเงิน ตรวจ/ให้ผ่าน และสรุปผล
- นายด่านเลือกจัดการพ่อค้าคนใดก่อนก็ได้ ไม่มีตัวนับเวลา
- authoritative server, state sync, reconnect, persistence และการป้องกันข้อมูลลับรั่ว
- เงิน หนี้ สินค้าสะสม โบนัส และการจัดอันดับเมื่อจบเกม
- กระเป๋าเรืองแสงแดงเมื่อของต้องห้ามลักลอบผ่าน พร้อม reduced-motion
- กติกาย่อในเกมและเอกสารวิธีรัน

นอกขอบเขต MVP: บัญชีสมาชิกถาวร, matchmaking สาธารณะ, spectator, voice/chat ภายใน, bot เล่นจริง, พลังตัวละคร, battle pass, เงินเงินจริง, ระบบจ่ายเงิน และการปรับกติกาเองใน lobby

ชื่อเกมเป็นชื่อชั่วคราว เปลี่ยนผ่าน config ได้ ภาพเป็นพ่อค้ายุคกลางแฟนตาซีขี้เล่น สร้างงานภาพของโปรเจกต์เอง ไม่คัดลอกภาพ โลโก้ หรือข้อความจากเกมอ้างอิง

## 2. กติกาที่ต้องรักษา

### 2.1 รอบและบทบาท

- ผู้เล่น 4–6 คน เริ่มเงิน 50 เหรียญ ไพ่คนละ 6 ใบ
- สุ่มนายด่านคนแรก จากนั้นหมุนตามลำดับที่นั่ง ทุกคนเป็นคนละ 2 ครั้ง
- หนึ่งรอบ = นายด่านหนึ่งคนจัดการพ่อค้าที่เหลือทั้งหมด
- 4/5/6 คน เล่น 8/10/12 รอบ แต่ละคนได้ขนสินค้า 6/8/10 ครั้งตามลำดับ
- นายด่านไม่จั่ว เปลี่ยนไพ่ หรือขนสินค้าในรอบของตน เก็บมือเดิมไว้
- ไม่มีการตกรอบ ไม่มี deadline อัตโนมัติ ไม่มี auto-pass เมื่อหมดเวลา
- ไม่มี late join หรือเปลี่ยนจำนวนผู้เล่นหลังเริ่มเกม

### 2.2 ข้อมูลสินค้า (ตัวเลขห้ามเปลี่ยนโดยพลการ)

| ID | ชื่อ UI | ประเภท | มูลค่าตอนจบ | ค่าชดเชย | ค่าปรับ | จำนวน |
|---|---|---|---:|---:|---:|---:|
| apple | แอปเปิล | legal | 2 | 2 | 0 | 84 |
| bread | ขนมปัง | legal | 3 | 2 | 0 | 72 |
| cheese | ชีส | legal | 4 | 3 | 0 | 60 |
| cloth | ผ้า | legal | 5 | 3 | 0 | 54 |
| moonshine | เหล้าเถื่อน | contraband | 8 | 0 | 4 | 36 |
| crossbow | หน้าไม้ | contraband | 10 | 0 | 5 | 30 |
| cannabis_leaf | ใบกัญชา | contraband | 12 | 0 | 6 | 24 |

รวม360ใบ แต่ละใบมีinstance IDไม่ซ้ำ แยกจากproduct ID ของต้องห้ามหมายถึงกฎของเมืองสมมติในเกม

> ผู้ใช้อนุมัติล่าสุด360ใบตามตารางนี้ (11ตุลาคม2026) rulesVersion0.2ใช้กับเกมใหม่เท่านั้น เกม0.1ที่เริ่มแล้วคง120ใบและsnapshotเดิม ราคา ค่าปรับ ค่าชดเชยและกติกาอื่นทั้งหมดคงเดิม ไม่เติมไพ่เข้าเกมที่เริ่มแล้ว

- เงินกับมูลค่าสินค้าเป็นคนละระบบ สินค้าผ่านเมืองไม่เปลี่ยนเป็นเงินทันที
- ชื่อเดิม “เครื่องเทศต้องห้าม”, “ผ้าไหมหนีภาษี”, “อัญมณีลักลอบ” ไม่ใช้ใน UI/ข้อมูลชุดปัจจุบัน
- เก็บค่าทั้งหมดเป็น data/config แยกจาก UI และ engine เพื่อปรับสมดุลภายหลังได้ โดยทุกเกมบันทึก rulesVersion/config snapshot

### 2.3 เตรียมสินค้า

1. Server เติมมือพ่อค้าให้ครบ 6 ใบ เมื่อเริ่มเฟส
2. พ่อค้าเลือกทิ้ง 0–3 ใบแบบลับ แล้วจั่วทดแทน เปลี่ยนได้หนึ่งครั้งต่อรอบ
3. กด “พร้อมจัดกระเป๋า” ทุกคนทำพร้อมกัน รอครบจึงไปเฟสถัดไป
4. มือเริ่มต้น 6 ใบไม่ต้องเติมซ้ำในรอบแรก
5. กองจั่วหมดจึงนำกองทิ้งสับใหม่ ห้ามนำคลังสินค้า/มือ/กระเป๋ากลับมาสับ
6. ใช้ RNG ฝั่ง server เท่านั้น มี seeded RNG เฉพาะการทดสอบ และไม่เผย seed ของเกมจริง

Implementation default: การเลือกไพ่เปลี่ยนและกดพร้อมเป็น command เดียว จึงไม่เกิดการสุ่มซ้ำจากการย้อนหน้า ไพ่ที่ทิ้งจะเข้ากองทิ้งหลังจั่วทดแทนของ command นั้นเสร็จ เพื่อไม่ให้ได้ใบเดิมคืนทันที หากไม่มีไพ่พอให้ตรวจ invariant และรายงาน error โดยไม่ทำ state ค้างครึ่งทาง

### 2.4 จัดกระเป๋าและแจ้งสินค้า

- ใส่ได้ 1–5 ใบ สินค้าใดก็ได้ รวมของต้องห้ามทั้งหมดก็ได้
- เลือก “แจ้งสินค้า” ถูกกฎหมายเพียงชนิดเดียว: แอปเปิล/ขนมปัง/ชีส/ผ้า
- จำนวนที่แสดงมาจากของจริงในกระเป๋า Server คำนวณ ห้ามให้ client กรอกหรือโกหกจำนวน
- ไม่จำเป็นต้องมีสินค้าที่แจ้งอยู่จริง เช่น ใส่ชีสกับหน้าไม้แต่แจ้งแอปเปิลได้
- กด “ปิดกระเป๋าและยืนยัน” แล้วแก้สินค้า/คำแจ้งไม่ได้ ย้ายไพ่จากมือเข้ากระเป๋าแบบ atomic
- ใช้คำว่า “แจ้งสินค้า” ทุกจุดของ UI ไม่ใช้ “สำแดงสินค้า”
- ก่อนครบทุกคน ผู้เล่นอื่นเห็นเพียงพร้อม/ยังไม่พร้อม เมื่อครบจึงเผยคำแจ้งและจำนวนพร้อมกัน
- ตัวอย่างข้อความ: “แอปเปิล 4 ใบ” โดยของจริงยังเป็นความลับ

### 2.5 เจรจาและข้อเสนอ

- ไม่มีตัวนับเวลา ทุกคนคุยผ่านแอปภายนอก ไม่มีระบบฟังหรือบันทึกเสียง
- พ่อค้าทุกคนที่ยังไม่ถูกตัดสินเสนอ/แก้ยอดได้ ไม่ต้องรอถูกเลือก
- มีปุ่ม “เสนอเงิน” และ “ไม่เสนอเงิน” ยอด 0 หมายถึงไม่เสนอ
- แยก not_submitted ออกจาก submitted(amount=0) นายด่านตัดสินได้หลังพ่อค้ากดเลือกอย่างใดอย่างหนึ่งแล้ว
- ทุกคนเห็นยอดล่าสุด แสดงคนที่นายด่านกำลังเลือกอยู่
- จำนวนเป็นจำนวนเต็ม ไม่ติดลบ ไม่เกินเงินใช้ได้จริง ห้ามกู้เพื่อเสนอเงิน
- นายด่านเลือกพ่อค้าคนใดก่อนก็ได้ เปลี่ยนเป้าก่อนตัดสินได้
- ไม่มีการรับเงินแยกต่างหาก รับเงินเกิดพร้อมการ “ให้ผ่าน” เท่านั้น
- คำพูดอื่นไม่มีผลผูกมัดในระบบ ข้อตกลงระบบมีเพียง “เงินเพื่อผ่านโดยไม่ตรวจ”
- ข้อเสนอล็อกทันทีที่การตัดสินสำเร็จ ไม่มีแก้ย้อนหลัง

### 2.6 ผลการตัดสิน (กติกาเฉพาะของเกมนี้)

| การกระทำ | สินค้า | เงิน |
|---|---|---|
| ให้ผ่าน | ทุกใบเข้าคลังส่วนตัว | พ่อค้าจ่ายข้อเสนอล่าสุดให้นายด่าน |
| ตรวจและทุกใบถูกกฎหมาย | ทุกใบผ่าน แม้ต่างชนิดหรือไม่ตรงคำแจ้ง | นายด่านจ่ายค่าชดเชยรวมของทุกใบ |
| ตรวจและพบของต้องห้ามอย่างน้อย 1 ใบ | ของถูกกฎหมายผ่านทั้งหมด ของต้องห้ามถูกยึดทิ้ง | พ่อค้าจ่ายค่าปรับรวมของต้องห้าม ไม่มีค่าชดเชยใด ๆ |

- กดตรวจแล้วไม่โอนข้อเสนอทุกกรณี
- ห้ามใช้กติกาต้นฉบับที่ยึดสินค้าถูกกฎหมายเพราะไม่ตรงคำแจ้ง
- ตรวจได้ไม่จำกัดจำนวนกระเป๋า แต่กระเป๋าหนึ่งตัดสินได้ครั้งเดียว
- หลังผลเกิดจริง นายด่านกด “เลือกพ่อค้าคนต่อไป” กลับไปเลือกคนที่ยังไม่ถูกตัดสิน
- ครบทุกคนแล้วปุ่มเป็น “จบรอบ / ส่งต่อตำแหน่งนายด่าน” นายด่านกดเอง ไม่ให้ animation/timer เดินรอบแทน

ตัวอย่างบังคับทดสอบ:

- แอปเปิล 2 + ชีส 3 ถูกตรวจ: ผ่าน 5 ใบ นายด่านชดเชย 13 ไม่สนคำแจ้ง
- แอปเปิล 2 + ใบกัญชา 2 ถูกตรวจ: ผ่านแอปเปิล 2 ยึดใบกัญชา 2 ปรับ 12 ไม่ชดเชย
- หน้าไม้ 5 ถูกตรวจ: ผ่าน 0 ใบ ปรับ 25
- ของถูกกฎหมายล้วนแต่แจ้งชื่อที่ไม่มีอยู่: ยังผ่านและชดเชยตามของจริง

### 2.7 กระเป๋าเรืองแสงและความลับ

- ให้ผ่านโดยไม่ตรวจและมี contraband: กระเป๋าทั้งใบเรืองแสงแดงสั้น ๆ หนึ่งครั้งขณะเคลื่อนเข้าคลัง ทุกคนเห็น
- ไม่มี contraband: กระเป๋าเคลื่อนปกติ ไม่มีแสงแดง
- ไม่ใช้ไพ่ 5 ใบทำแอนิเมชันแล้ว ใช้ “กระเป๋า” เดียวทุกขนาด
- ระยะเวลา สี เสียง จำนวนประกาย และเส้นทางแอนิเมชันต้องไม่แปรตามจำนวน/ชนิด/มูลค่าของต้องห้าม
- ไม่เปิดไพ่และไม่โชว์คะแนนที่เพิ่มจากการให้ผ่าน ข้อความใช้ “มีของต้องห้ามผ่านด่าน!” ไม่บอกจำนวน
- ถ้าเปิดตรวจพบของต้องห้าม ไม่แสดงลักลอบสำเร็จ ให้แสดงยึดของแทน
- reduced-motion ใช้ glow/badge สั้น ๆ โดยไม่เคลื่อนกระเป๋า
- Server ตัดสินเสร็จก่อน animation ทุก client ใช้ resultId เดียวกันกันการเล่นซ้ำจาก event ซ้ำ
- คน reconnect เห็นผลล่าสุดได้ แต่ไม่ต้องเล่น animation เก่าซ้ำทั้งหมด

### 2.8 เงิน หนี้ และคะแนน

- เงินเริ่ม 50 เงินคงเหลือไม่ติดลบ ค่าปรับ/ชดเชยที่จ่ายไม่ครบสร้างหนี้ระหว่างคู่กรณี
- จ่ายเงินสดที่มีให้ก่อน ส่วนขาดเป็น Debt(debtor, creditor, outstanding, createdOrder)
- เงินรับเข้าต้องชำระหนี้เก่าตามลำดับก่อน เหลือจึงเป็นเงินใช้ได้
- ใกล้เคียงกันหลายรายการให้ server กำหนดลำดับชัดเจน ไม่พึ่งเวลาจาก client
- หนี้ไม่สร้างเงินใหม่ เงินสดรวมทุกคนคงที่ ยอดหนี้รับ/จ่ายรวมต้องหักล้างกัน
- การชำระหนี้อาจทำให้เจ้าหนี้ต้องจ่ายหนี้ของตนต่อ ใช้ queue/ledger transaction ที่ยุติได้ ไม่ recursion ไม่จำกัด และทดสอบหนี้วงกลม
- ไม่หักกลบหนี้เองหรือเปลี่ยน FIFO โดยไม่มีเหตุผลที่บันทึกไว้ การจ่ายแต่ละครั้งลด outstanding ก่อนส่งเงินต่อ
- หากเงินผู้เล่นเปลี่ยนจนข้อเสนอเกินยอดใช้ได้ ให้ invalidate ข้อเสนอ แจ้งทุกคนและให้พ่อค้ายืนยันใหม่ ห้ามให้ผ่านด้วยยอดที่จ่ายไม่ได้

จบหลังรอบที่ N×2 และนายด่านกดยืนยันจบรอบสุดท้าย:

คะแนน = เงินสด + มูลค่าสินค้าในคลัง + โบนัสการค้า + ลูกหนี้คงค้างที่มีสิทธิ์รับ − หนี้คงค้างที่ต้องจ่าย

- มือที่เหลือไม่มีคะแนน ของที่ถูกยึด/ทิ้งไม่มีคะแนน
- แต่ละชนิด legal ให้โบนัสผู้มีจำนวนมากที่สุด 8 คะแนน ถ้าเสมอ k คนได้คนละ floor(8/k) เศษไม่แจก
- ถ้าไม่มีใครมีสินค้าชนิดนั้น ไม่แจกโบนัส
- คะแนนเท่ากัน คนที่ขน legal รวมมากกว่าชนะ ถ้ายังเท่ากันชนะร่วม
- เปิดสินค้าและ breakdown คะแนนทุกคนเมื่อจบเกมเท่านั้น

## 3. แนวทางเทคนิค: Vercel + Firebase Realtime Database

นี่คือ stack ที่ผู้ใช้กำหนด ไม่ใช่ตัวเลือก: deploy เว็บ/API บน Vercel และใช้ Firebase Realtime Database (RTDB ไม่ใช่ Firestore) เป็น persistent state และ realtime transport

- โปรเจกต์ใหม่แนะนำ Next.js App Router + TypeScript เพื่อวาง UI และ HTTP Route Handlers ไว้ในแอปเดียว ถ้า repo เป็น React/Vite อยู่แล้วใช้ต่อและเพิ่ม Vercel Functions ได้ ไม่ย้าย framework โดยไม่จำเป็น
- Vercel Functions แบบ Node.js runtime ประมวลผล game commands ผ่าน HTTPS เป็น request สั้น ไม่เปิด process ค้างเพื่อรอรอบจบ
- Firebase Web SDK subscribe เฉพาะ public view ของห้องและ private view ของ UID ตัวเอง ไม่มี Socket.IO server เพิ่ม
- Firebase Anonymous Authentication ให้ UID โดยผู้เล่นไม่ต้องสมัครสมาชิก แยก UID ออกจากชื่อและรหัสห้อง
- Firebase Admin SDK ใช้เฉพาะ Functions เพื่อตรวจ ID token และเขียน authoritative state
- Pure TypeScript engine แยกจาก UI, Firebase, HTTP; ใช้ schema validation เช่น Zod
- RTDB transaction เป็นตัวรับประกัน concurrency ระหว่างหลาย Function instances ห้ามใช้ in-memory lock, singleton game state, local file หรือ SQLite เป็น source of truth
- Vitest, Playwright, Firebase Auth/Database Emulators และ Security Rules tests
- ไม่ต้องใช้ Firebase Cloud Functions สำหรับ MVP นี้ เพราะ command backend อยู่บน Vercel แล้ว

เส้นทางข้อมูล:

1. Browser signInAnonymously และใช้ auth persistence ของ SDK
2. ส่ง command + commandId + entity version ผ่าน HTTPS พร้อม Firebase ID token
3. Vercel verifyIdToken ตรวจสิทธิ์/phase/กติกา และ commit RTDB transaction
4. Client รับ public/private views จาก RTDB listeners แล้วแสดงผล ไม่คำนวณผลเกมแทน server

โครงสร้างแนะนำสำหรับ Next.js:

```text
src/app/                       pages และ components
src/app/api/rooms/              create/join/command Route Handlers
src/lib/game/                  pure engine, config, validation, scoring
src/lib/server/                Admin SDK, auth, transactions, projections
src/lib/client/                Web SDK, anonymous auth, subscriptions
firebase/database.rules.json   rules ที่ commit ใน repo
firebase.json                  emulator/deployment configuration
 tests/                        unit, integration, rules, E2E
```

### RTDB data layout และ atomic projection

```text
roomCodes/{code}                         server-only code → roomId index
rooms/{roomId}/members/{uid}             server-managed membership
rooms/{roomId}/authoritative             server-only deck, hands, bags, ledger, dedup, session leases
rooms/{roomId}/views/public              สมาชิกอ่านได้
rooms/{roomId}/views/private/{uid}       เฉพาะเจ้าของอ่านได้
presence/{roomId}/{uid}/{connectionId}   สถานะเชื่อมต่อของเจ้าของ connection
```

- ทำ transaction ที่ rooms/{roomId} ครอบ authoritative state, membership, command dedup, public view และ private views พร้อมกัน ไม่ commit engine ก่อนแล้วค่อยเขียน views ภายหลัง
- transaction callback อาจถูกรันซ้ำ ต้องเป็น pure transformation ไม่มี network call, log side effect, การสุ่มใหม่ หรือส่ง response ข้างใน
- สร้าง entropy/token/เวลาที่จำเป็นก่อน transaction ใช้ให้คงที่ตลอด retry หรือใช้ server-only RNG state ที่เดินอย่าง deterministic จาก committed state ห้ามเผย seed
- ทุก view มี revision เดียวกับ state; client รอ public/private revision ตรงกันก่อนแสดง action-sensitive state เพราะ callbacks สอง path อาจมาถึงไม่พร้อมกัน
- ห้าม listener ที่ rooms/{roomId} หรือ root เนื่องจากมีข้อมูลลับ ปิดการอ่าน ancestor เหล่านี้
- แยก presence ออกจาก transaction subtree เพื่อลด transaction retry จากการเปลี่ยนสถานะ connection
- รหัสห้องจองแบบ transaction ไม่ซ้ำ; code index ไม่ให้ client อ่าน/เขียนโดยตรง Join ผ่าน API ที่ตรวจ lifecycle/capacity
- การจอง code กับสร้าง room ต้อง idempotent มี reservation สถานะ pending/ready และ repair/retry หาก Function หยุดกลางทาง ไม่คืนห้องที่สร้างไม่ครบ
- จำกัดขนาด current game/history/dedup เก็บ command results จนพ้นช่วง replay ของ game นั้น ล้างเมื่อเลิกเกมอย่างปลอดภัย ไม่ทำ transaction ครอบประวัติทุกเกมตลอดอายุห้อง

### Firebase Security Rules

- Default deny; authoritative และ roomCodes ห้าม client read/write แม้ authenticated
- public view อ่านได้เฉพาะสมาชิกห้อง private view อ่านได้เฉพาะ auth.uid เจ้าของและเป็นสมาชิกห้อง
- game state, membership, views และยอดเงินทั้งหมด client write ไม่ได้
- อนุญาต direct write เฉพาะ presence ของ UID ตัวเอง พร้อม validation ของ field/type/connection path
- ห้ามตั้ง .read=true ที่ rooms หรือ roomId แล้วหวังปิด child ทีหลัง; permission ของ ancestor จะเปิดข้อมูลลูก
- Admin SDK มีสิทธิ์ข้าม Rules ดังนั้น API ต้องตรวจ membership/role/phase เองทุก command
- ใช้ emulator rules tests พิสูจน์ทั้ง allow และ deny ไม่ปล่อย database เป็น test mode ตอน deploy

## 4. State machine และสัญญาข้อมูล

Phase หลัก:

```text
LOBBY → PREPARE → PACK_AND_DECLARE → NEGOTIATE
NEGOTIATE → RESOLUTION → NEGOTIATE (ยังมีพ่อค้าเหลือ)
RESOLUTION → ROUND_SUMMARY (ครบทุกคน)
ROUND_SUMMARY → PREPARE (นายด่านกดจบรอบ)
ROUND_SUMMARY → GAME_OVER (รอบสุดท้าย)
```

RESOLUTION เป็นผลที่ commit แล้ว ไม่ใช่ transaction ที่รอ animation สำเร็จ ใช้ปุ่มนายด่านเพื่อไปขั้นถัดไป ROUND_SUMMARY ไม่มี countdown

ข้อมูลหลัก:

- Room: id/code, lifecycle, hostId, members, seatOrder, gameId
- Player: id, displayName, avatarId, connected, ready; ไม่ใช้ชื่อเป็น identity
- Game: rulesVersion, roundIndex, sheriffStartSeat, sheriffId, phase, revision, deck, discard, RNG state ฝั่ง server
- PlayerGameState: hand, bag, stash, cash, ready flags, declaration, offer, resolution status
- Offer: amount, submitted, version
- Decision: id, merchantId, sheriffId, action, acceptedOfferVersion, result, processedCommandId
- Debt/Ledger: คู่กรณี ยอด ลำดับ และรายการที่ใช้ตรวจสอบ accounting
- Persisted events/snapshots: ใช้ recovery ได้ แต่ข้อมูลลับเข้าถึงผ่าน server เท่านั้น

Commands อย่างน้อย:

createRoom, joinRoom, setReady, startGame, prepareGoods, lockBag,
setOffer, selectMerchant, resolveMerchant, acknowledgeResolution,
endRound, reconnect, requestRematch

ทุก gameplay command ต้องตรวจ session, membership, gameId, phase, role, target และเวอร์ชันที่เกี่ยวข้อง ไม่รับ playerId ที่ client ส่งมาเป็นหลักฐานตัวตน

### Atomicity และ concurrency

- ใช้ RTDB transaction ต่อห้องครอบ state/ledger/result/deduplication/projections เพื่อ serialize ผลระหว่างหลาย Functions; ห้ามพึ่ง process-local mutex
- commandId ใช้ idempotency ส่งซ้ำต้องคืนผลเดิม ไม่ตัดเงิน/แจกไพ่ซ้ำ
- decision ส่ง expectedOfferVersion หากยอดเปลี่ยนให้ reject stale command พร้อม state ล่าสุด ห้าม accept ยอดใหม่เงียบ ๆ
- การแก้ข้อเสนอและการตัดสินต้องเรียงลำดับบน server หากตัดสินก่อน การแก้ต้องถูกปฏิเสธ
- ใช้ entity version เมื่อเหมาะสม ไม่ทำให้ข้อเสนอของคนอื่น invalidate คำสั่งที่ไม่เกี่ยวข้องทั้งหมด
- result event และ views commit พร้อม state; HTTP ตอบสำเร็จหลัง transaction commit เท่านั้น หาก response หายใช้ commandId เดิม retry และ RTDB snapshot reconcile ไม่ย้อนการเงิน
- Persist phase, pending manual advance, selected merchant, result และ command dedup เพื่อ recovery หลัง process restart

## 5. ความเป็นส่วนตัวและ session

เขียน projectPublicState / projectPlayerState แยกชัด ห้ามส่ง GameState เต็มแล้วซ่อนด้วย CSS

| ข้อมูล | Visibility |
|---|---|
| เงินสด, ที่นั่ง, นายด่าน, phase, พร้อม/ไม่พร้อม | ทุกคน |
| คำแจ้ง + จำนวนจริง | ทุกคนเมื่อเข้า NEGOTIATE |
| ข้อเสนอล่าสุด, พ่อค้าที่ถูกเลือก | ทุกคน |
| มือ/กระเป๋า/คลังรายละเอียด | เจ้าของเท่านั้น |
| ของที่ถูกเปิดตรวจ + ค่าปรับ/ชดเชย | ทุกคน |
| give-pass result | จำนวนรวมที่ทราบอยู่แล้ว + boolean มีลักลอบ + เงินข้อเสนอ ไม่ส่งชนิด/จำนวนลับ |
| คะแนนรวมและมูลค่าคลังระหว่างเกม | เจ้าของเท่านั้น |
| สินค้า/คะแนนเมื่อ GAME_OVER | ทุกคน |

- ห้ามเปิดจำนวน legal ในคลังคู่แข่งแยกชนิด เพราะลบจากจำนวนขนแล้วอนุมานจำนวน contraband ได้
- ของที่เคยถูกตรวจเป็นความรู้สาธารณะแล้ว แสดงประวัติได้ แต่ห้ามเติมของลับจากรอบไม่ตรวจลงไป
- ไม่มี live preview กระเป๋า/การเลือกไพ่ของคนอื่น ไม่มี card instance ID ลับใน public payload
- ห้องรหัสสั้นเป็นทางเข้าห้อง ไม่ใช่ credential สำหรับ impersonation
- ใช้ Firebase Anonymous Auth UID และ ID token; API verify token ด้วย Admin SDK ทุกครั้ง ไม่ใช้ UID ที่ client อ้างลอย ๆ เป็นหลักฐาน อย่าเก็บ ID token ใน log หรือ URL
- refresh/reconnect กลับที่นั่งเดิม ห้ามเปิดมือโดยอ้างเพียงชื่อหรือรหัสห้อง
- หลายแท็บ: ใช้ per-seat control lease/session generation ที่ server จัดการผ่าน transaction และตรวจทุก command แท็บใหม่ต้อง claim control ชัดเจน แท็บเก่าอ่านได้แต่ command ถูกปฏิเสธ; presence ไม่ใช่สิทธิ์ควบคุม
- ตรวจ origin, input length และ rate limit คำสั่งเพื่อป้องกัน flood โดยไม่เพิ่ม time limit ในเกม
- Production log ไม่เก็บไพ่ลับ token หรือ full game snapshots โดยไม่จำเป็น

### Disconnect และข้อจำกัด MVP

- การหลุดไม่เปลี่ยนผลที่ตัดสินแล้ว ไม่ auto-pass ไม่เปลี่ยนเป็น bot
- เฟสที่ต้องรอผู้เล่นค้างจน reconnect แสดงว่าใครหลุด; ผู้เล่นอื่นยังดูหน้าตนได้
- Host เป็นผู้จัดห้อง ไม่ใช่นายด่านเสมอ การเป็น host ไม่ให้สิทธิ์เปิดข้อมูลลับ
- หาก host หลุด โอนอำนาจ lobby ให้สมาชิกที่เชื่อมต่อถัดไปตามที่นั่งได้ โดยไม่เปลี่ยนนายด่านหรือที่นั่งในเกม
- เกมที่ผู้เล่นกลับมาไม่ได้อาจจบไม่ครบ เป็นข้อจำกัด MVP ให้ host ยุติเกมด้วย confirmation ได้โดยไม่บันทึกผู้ชนะปลอม
- Rematch สร้าง gameId ใหม่ในห้องเดิม ล้างเงิน/ไพ่/หนี้/offer/result และรอทุกคนพร้อมใหม่

## 6. หน้าจอและ UX

### Lobby

- สร้าง/เข้าห้อง ชื่อ อวาตาร์ รายชื่อ 4–6 คน รหัสห้อง คัดลอกลิงก์ ปุ่มพร้อม
- อธิบายสั้นว่า “คุยกับเพื่อนผ่านแอปที่คุณใช้ แล้วเล่นบนหน้านี้”
- Host เริ่มได้เมื่อครบ 4–6 คนและทุกคนพร้อม

### โต๊ะเกมส่วนกลาง

- แสดงรอบปัจจุบัน/รอบทั้งหมด นายด่าน เงินของผู้เล่น สถานะการเชื่อมต่อ
- การ์ดผู้เล่นแสดงคำแจ้ง ข้อเสนอ และสถานะ ยังไม่ตัดสิน/กำลังคุย/ตรวจแล้ว/ผ่านแล้ว
- ใช้สีร่วมกับข้อความและไอคอน ไม่ใช้สีอย่างเดียว

### ฝั่งพ่อค้า

- มือ 6 ใบอ่านชื่อ มูลค่า และค่าปรับ/ชดเชยได้ ไม่ต้อง hover
- เลือกเปลี่ยนไพ่พร้อมตัวนับ 0/3 และจัดกระเป๋า 0/5 ในเฟสที่ถูกต้อง
- ปุ่มล็อกกระเป๋า disabled เมื่อว่างหรือยังไม่เลือกชื่อสินค้า
- หน้ายืนยันแสดงของจริงให้เจ้าของตรวจทาน จำนวนจริง และคำแจ้ง ก่อนล็อก
- หน้าเจรจามีคำแจ้ง ข้อเสนอปัจจุบัน เงินใช้ได้ ปุ่มเสนอ/ไม่เสนอ แสดงสถานะว่านายด่านกำลังคุยกับใคร
- เจ้าของดูคลังตัวเองได้โดยไม่ส่งข้อมูลนั้นให้ผู้อื่น

### ฝั่งนายด่าน

- เลือกพ่อค้าจากทุกคนที่ยังไม่ถูกตัดสินได้โดยตรง ไม่บังคับตามที่นั่ง
- ยอดข้อเสนอและคำแจ้งเด่น ปุ่ม “ตรวจกระเป๋า” / “ให้ผ่าน · รับ X เหรียญ”
- หากยังไม่มีข้อเสนอหรือยังไม่ได้กดไม่เสนอ ให้แสดงรอคำตอบ ไม่ตัดสินแทน
- confirmation ระบุชื่อพ่อค้า การกระทำ และยอด เวอร์ชัน stale ต้องตรวจทานใหม่
- หลัง resolve ล็อกสองปุ่ม แสดงผลพร้อมปุ่มเลือกคนต่อไป/จบรอบ

### ผลและจบเกม

- ตรวจ: เปิดของจริง แสดงของผ่าน/ยึด ค่าปรับ/ชดเชย เงินสดและหนี้ที่เกิด
- ไม่ตรวจ: แสดงกระเป๋าและผลที่เปิดเผยได้ ไม่มี secret tooltip หรือคะแนนเพิ่ม
- จบเกม: standings พร้อม cash/goods/bonus/receivable/debt/legal count ชนะร่วมได้

### Responsive/accessibility

- ทดสอบความกว้าง 360, 390, 430 CSS px และ desktop รวมจอสั้น/แนวนอน
- ไม่มี horizontal overflow ฟอนต์ไทยอ่านได้ พื้นที่แตะหลักอย่างน้อย 44×44 px
- safe-area-inset-bottom, dynamic viewport, sticky footer ต้องไม่บังไพ่หรือปุ่ม
- semantic buttons, visible focus, keyboard selection, aria-live สำหรับสถานะที่จำเป็น
- animation สั้นไม่บล็อกกติกา เคารพ prefers-reduced-motion
- loading กัน double submit; error รักษา draft ที่ยังไม่ล็อก; reconnect แสดงกำลังเชื่อมต่อโดยไม่แกล้งทำเหมือนส่งสำเร็จ

## 7. Milestone การลงมือทำ

### M0 — สำรวจและตั้งโครง

- [x] ตรวจ repo/instructions/stack และบันทึกการตัดสินใจ
- [x] สร้างโครง frontend/server/shared engine และ scripts dev/build/typecheck/lint/test
- [x] config สินค้า360ใบ/rulesVersion0.2, types และ seeded fixtures; รักษาsnapshot0.1ของเกมเดิม
- [x] README เริ่มรันได้ด้วยขั้นตอนสั้น ๆ และ .env.example ไม่มี secret จริง

เกณฑ์ผ่าน: เปิด frontend และเรียก health API และเชื่อม Firebase Emulators ได้จริง build ผ่าน

ประวัติผล M0 สำหรับ 0.1 หลังยืนยัน 120 ใบ: unit 49 ผ่าน, typecheck/lint/build ผ่าน, integration 5 ผ่านบน Auth/RTDB Emulators และ E2E 2 ผ่านบน Chromium ผ่าน script test:m0 จริง หลักฐาน work/verification/m0-120/ ผลปัจจุบันสำหรับ 0.2 อยู่ work/verification/rules-0.2/report.md

### M1 — Pure game engine

ประวัติผลM1สำหรับ0.1: unit73ผ่าน รวมsimulation4/5/6คนจนGAME_OVER, sheriffคนละ2ครั้ง, inspect/pass, FIFO/cycles และconservation120ใบ/เงินสด หลักฐานwork/verification/m1/ ผลทวน0.2/360ใบให้ดูสถานะล่าสุดในwork/progress.mdและwork/verification/rules-0.2/

- [x] แจก/สับ/เปลี่ยน/จัดไพ่และ validation
- [x] phase machine, round/sheriff rotation, ready barriers
- [x] offer/inspect/pass/scoring/bonus และ invariant จำนวนไพ่
- [x] cash/debt ledger, FIFO settlement และวงจรหนี้
- [x] unit tests ของกติกาที่มีความเสี่ยง

เกณฑ์ผ่าน: จำลองเกม 4/5/6 คนจน GAME_OVER โดยไม่ต้องมี UI ผลถูกต้องและ deterministic ใน test

ข้อจำกัดนี้เป็นประวัติ0.1/เกมที่เริ่มแล้ว: 4คน/PASS5ตลอดจะเติมมือหลังรอบ7ไม่พอ คงINSUFFICIENT_CARDSและstateเดิม ไม่มีการรีไซเคิลคลังหรือเติมไพ่ เกมใหม่0.2ใช้360ใบตามอนุมัติและต้องผ่านmatrix4/5/6คน/PASS5ทุกเทิร์น ทั้งไม่แลกและแลก3ทุกครั้ง

### M2 — ห้องและ multiplayer ที่ปลอดภัย

M2 ผ่านเกณฑ์ local API: integration 15 ผ่านบน Auth/RTDB Emulators, E2E 5 ผ่านรวม clients API 4 คนเล่นครบหนึ่งรอบพร้อม realtime/reconnect, stale offer, duplicate decisions และ unauthorized actions; unit 73, typecheck/lint/build ผ่าน หลักฐาน work/verification/m2/ การ restart process จริงและ full browser game อยู่ M3/M5

- [x] create/join/ready/start, session identity, room capacity
- [x] command validation, room serialization, atomic persistence, idempotency
- [x] public/private projection, RTDB subscriptions, Rules tests ของทุก path
- [x] reconnect/persisted recovery และ active-session policy (อ่านผ่าน service/SDK instances ใหม่; process restart จริงตรวจใน M5)
- [x] integration tests ของ unauthorized actions, stale offers และ privacy

เกณฑ์ผ่าน: 4 clients เล่นผ่าน command API ได้ รับข้อมูลตามสิทธิ์และ reconnect แล้วสถานะตรง

### M3 — Vertical slice เล่นได้ครบหนึ่งเกม

- [x] Lobby → เตรียม → จัดกระเป๋า → แจ้ง → เจรจา → ผล → รอบใหม่ → จบเกม
- [x] ปุ่มเลือกพ่อค้า ตรวจ ให้ผ่าน และกดเดินรอบเองครบ
- [x] เงิน/หนี้/ข้อเสนอ sync ทุกหน้าจอ
- [x] ใช้ภาพ placeholder ของตนเองได้ก่อน แต่ gameplay ต้องจริง ไม่ hardcode ผล

เกณฑ์ผ่าน: เปิด 4 browser contexts เล่นจบ 8 รอบ พร้อม inspect/pass ทั้งสองแบบ

ผ่านด้วย Chromium contexts แยก UID 4 คน เล่นครบ 8 รอบผ่าน UI/API/Auth/RTDB จริงบน Emulators มี legal mixed inspection, ยึด contraband, bribe/no-offer PASS, red glow, เลือกคนท้ายก่อน, reload ขณะจัดถุง และตรวจ DOM/RTDB received frames ผลเงิน/หนี้เพิ่มเติมใช้ emulator financial fixture แล้วกดตรวจ/ผ่านจริง ไม่ใช่ผล hardcode ในแอป หลักฐาน work/verification/m3/ และ m5/acceptance.log

### M4 — งานภาพและมือถือ

- [ ] **พักจนผู้ใช้เลือกดีไซน์:** สไตล์เมืองการค้าแฟนตาซี กระเป๋า ลังไม้ เหรียญ และไพ่สินค้า 7 ชนิดที่แยกกันชัด
- [x] หน้า sheriff/merchant/result/score อ่านง่ายบนมือถือ
- [x] กระเป๋า glow ตาม boolean เท่านั้น ไม่มีจำนวนรั่ว
- [x] accessibility, safe area, reduced-motion, error/loading/empty states

เกณฑ์ผ่าน: ตรวจ browser จริงตามขนาดที่กำหนด ไม่มีข้อความ/ไพ่/ปุ่มถูกบัง

ผ่านขอบเขต responsive/accessibility ที่ผู้ใช้อนุญาต ตรวจ 360/390/430, 740×360 และ 1280×900 สำหรับ home/lobby/pack/sheriff/inspect/glow/score และกติกา Axe WCAG-tag checks ไม่พบ violations ใน 40 snapshots พร้อม keyboard, focus/skip link, touch targets, 200% text reflow และ reduced motion Safe-area ใช้ viewport-fit/env ครบด้าน ยังไม่ใช่ผลตรวจ screen reader/โทรศัพท์จริง งานภาพขั้นสุดท้ายบรรทัดที่พักยังไม่ถือว่าเสร็จ ภาพและรายงาน work/verification/m4/

### M5 — ตรวจครบและส่งมอบ

- [x] E2E 4 คนครบเกม และ 5/6 คนครบเกมด้วย automation
- [x] race/double submit/reconnect/server restart/privacy ผ่าน
- [x] lint/typecheck/unit/integration/build/E2E ตาม scripts จริง
- [x] กติกาในแอปตรงเอกสาร ตรวจชื่อสินค้าและตัวเลขทุกชนิด
- [x] README/docs/rules.md/docs/architecture.md และผลตรวจพร้อมข้อจำกัด

เกณฑ์ผ่าน: ผู้ใช้รันและชวนเพื่อนเข้า LAN ได้ตาม README โดยไม่ต้องแก้ source สำหรับแต่ละเครื่อง

ผลทวน local สำหรับ rulesVersion 0.2/360 ใบ: unit 80 และ integration 16 ผ่าน; lint/typecheck/build ผ่าน E2E ผ่านครบ 17 กรณีจาก full run ผ่าน 15 และ targeted rerun ผ่านอีก 2 หลังแก้การรอใน test harness ไม่ใช่ full run ที่ผ่าน 17 ครั้งเดียว ตรวจ browser → API → Auth/RTDB Emulators → realtime UI จริง เกมขน 5 ใบ/PASS ทุกครั้งครบ 4/5/6 คน ทั้งไม่แลกและแลก 3 ใบทุกเทิร์น รวม 6 เกมถึง GAME_OVER 8/10/12 รอบ ไพ่รวมและ instance ไม่ซ้ำครบ 360 ทุก checkpoint นายด่านคนละ 2 ครั้ง Unit เพิ่ม 18 simulations/4,644 transitions และ integration ยืนยันเกมเก่า 0.1 ยัง 120 ใบผ่าน resume/command ก่อน rematch เริ่มเกมใหม่เป็น 0.2

เกณฑ์ M5 เดิมยังผ่าน: privacy, race/dedup, unknown result หลัง commit/retry ID เดิม, offline draft, control takeover, stale confirmation, rematch และ restart Next API process คนละ PID ระหว่าง RESOLUTION ได้เงิน/result เดิม พร้อม manual advance ต่อ Accessibility ทวน 40 axe snapshots ไม่พบ violations รายงาน work/verification/rules-0.2/report.md และ work/progress.md หลังจากนั้น12ตุลาคมเผยแพร่Rulesตามอนุมัติและทดสอบlocalproductionbrowser/APIกับFirebasePreviewจริง4/5/6คนครบ8/10/12รอบ พร้อมprivacy51กรณีผ่าน ดูwork/verification/firebase-preview/report.md ยังไม่มีVercel deploymentหรือผลตรวจโทรศัพท์จริง/Production Firebaseที่แยกจากPreview

## 8. Test matrix ที่ต้องมี

### Engine และ conservation

- ใส่ 0/6 ใบถูกปฏิเสธ 1/5 ใบสำเร็จ ใช้ไพ่คนอื่น/instance ซ้ำไม่ได้
- จำนวนคำแจ้ง derive จาก bag; แจ้ง contraband เป็นชนิดสินค้าไม่ได้
- ทุกผลตรวจตามตัวอย่างข้อ 2.6 และคำแจ้งไม่ตรงของ legal ยังชดเชย
- PASS โอนข้อเสนอและย้ายของครั้งเดียว INSPECT ไม่โอนข้อเสนอ
- จำนวนไพ่ในdeck+discard+ทุกhand+ทุกbag+ทุกstash =360สำหรับเกมใหม่0.2ตลอดเกม ไม่มีซ้ำ/หาย เกมเดิมใช้totalCardsตามsnapshotเดิม
- ขน5ใบ/PASSทุกรอบครบ4/5/6คน รวมทั้งไม่แลกและแลก3ทุกเทิร์น ต้องถึงGAME_OVER8/10/12รอบได้ และsheriffทุกคน2ครั้ง
- deck refill, discard 0/3, attempt exchange ซ้ำ, sheriff แลกไพ่ไม่ได้
- หนี้บางส่วน/หลายเจ้าหนี้/หนี้วงกลม/เงินรับชำระหนี้ต่อ ไม่เกิด infinite loop และเงินสดรวมเท่าเดิม
- bonus ไม่มีผู้ถือ/เสมอ 2/3/6 คน เศษไม่แจก และ tie-break ชนะร่วม
- 4/5/6 คนเป็น sheriff คนละ 2 ครั้ง จำนวน merchant turns ถูกต้อง

### Multiplayer และ privacy

- ผู้เล่นทั่วไปกด inspect/advance ไม่ได้ host ไม่สามารถทำแทนนายด่าน
- client ปลอมยอดเงิน ไพ่ round/phase หรือ playerId ไม่ได้
- duplicate commandId และสอง decision พร้อมกันไม่ทำผลซ้ำ
- offer เปลี่ยนหลังเปิด confirmation ต้อง reject stale decision
- หลุดก่อน/หลัง commit ส่งซ้ำแล้วผลเหมือนเดิม refresh แต่ละเฟสกลับมาได้
- restart ระหว่าง RESOLUTION รักษาผลเงินและรอ manual advance ต่อ
- เปรียบเทียบ public projection ของกระเป๋าที่มีจำนวนรวมเท่ากันแต่มีของต้องห้าม 1 กับ 4 ใบ: หลัง PASS ต้องไม่มีความต่างจากชนิด/จำนวน/มูลค่าลับ ยกเว้นข้อมูลสาธารณะที่ตั้งใจเผย
- ตรวจ RTDB listener payload, snapshots, API response, public history และ DOM ไม่ใช่ตรวจแค่ภาพ
- resolved-by-pass events ไม่มี secret IDs / stash breakdown / score delta
- ผล INSPECT และ GAME_OVER เปิดข้อมูลที่อนุญาตได้ครบ

### Browser acceptance

- อย่างน้อยหนึ่งเกมมี legal mixed inspection, contraband confiscation, bribe pass, no-offer pass และ red glow
- นายด่านเลือกคนท้ายก่อน แล้วคนอื่นได้จริง
- รอเจรจานานแล้วเฟสไม่เปลี่ยนเอง ไม่มี countdown
- ทุกหน้าทำงานบน 360/390/430 และ desktop ไม่มี overflow ปุ่ม tap/keyboard ใช้ได้
- ทดสอบจบเกม 6 คนครบ 12 รอบ และ reconnect ขณะถูกเลือก
- ภาพตรวจงานอย่างน้อย lobby, pack, sheriff negotiation, inspected result, red glow, final score ใช้เป็นหลักฐานตรวจงาน ไม่อ้างผลตรวจที่ไม่ได้รัน

## 9. การรันและส่งมอบ

README ต้องระบุ prerequisites, install, dev, emulator startup, test, build, start, Firebase Rules deployment และ environment variables ที่ต้องใช้

- การเข้า LAN ใช้ host 0.0.0.0 ตามความเหมาะสม ระบุว่าโทรศัพท์ต้องอยู่เครือข่ายเดียวกัน
- API ใช้ same-origin HTTPS บน Vercel; Firebase config แยก environment ไม่ hardcode emulator/localhost ใน production bundle
- production target คือ Vercel UI + Node.js Functions และ Firebase RTDB/Auth; ไม่ต้องมี WebSocket server ของตัวเองและไม่ต้องมี persistent disk บน Vercel
- หากยังไม่ได้ deploy ให้รายงานว่า local-ready และให้ขั้นตอน ไม่อ้างว่ามี public URL
- Demo/seed room ใช้เฉพาะ development/test ปิด production ไม่เปิด endpoint อ่านไพ่ทั้งหมด
- ไม่เพิ่มระบบ auto-resolve เพื่อแก้ปัญหาคนหลุด เพราะขัดกับไม่มีเวลาและนายด่านควบคุมเทิร์น

## 10. Definition of Done

- [x] เล่นจริง 4–6 คนตามกติกาโดยไม่มีคนตกรอบ
- [x] เปลี่ยนไพ่/กระเป๋า/แจ้งสินค้า/ข้อเสนอ/ตรวจ/ผ่าน/หนี้/คะแนนครบ
- [x] ของถูกกฎหมายผสมผ่านและชดเชยถูกต้อง ไม่เผลอใช้กติกาเกมอ้างอิง
- [x] จำนวนจริงเติมอัตโนมัติและใช้คำว่า “แจ้งสินค้า” ตลอด UI
- [x] เลือกพ่อค้าได้อิสระ ไม่มีนับเวลา ทุกการเดินรอบเป็น manual ตามที่ระบุ
- [x] เงินข้อเสนอจ่ายเฉพาะ PASS และแสดงทุกคน ไม่มี stale-offer race
- [x] กระเป๋าแดงเฉพาะลักลอบผ่าน ไม่เผยจำนวนของต้องห้าม
- [x] ข้อมูลลับถูกป้องกันที่ server ไม่ใช่แค่ซ่อนหน้าจอ
- [x] refresh/reconnect/retry/restart ไม่ทำไพ่หรือเงินซ้ำ/หาย
- [x] ทุกคนเป็นนายด่านคนละ 2 ครั้งและจบคะแนนถูกต้อง
- [x] รันตรวจที่กำหนดและบันทึกผลจริง สิ่งที่ไม่ได้ตรวจระบุชัด
- [x] มีวิธีรันและข้อจำกัดให้ผู้ใช้รับงานต่อได้

Definition of Done นี้ผ่านการทวนใน local/Emulators และ browser automation สำหรับ 0.2/360 ใบ รวม matrix PASS5 ทั้ง 6 กรณีตามที่ผู้ใช้อนุมัติ ดู work/verification/rules-0.2/report.md ยังไม่ใช่ production deployment หรือ human balance playtest เกม 0.1 เดิมยังมีข้อจำกัดสำรับตาม snapshot ดู docs/rules.md งานภาพสุดท้ายของ M4 ยังพักตามคำสั่งผู้ใช้

หมายเหตุ: ตัวเลขทั้งหมดเป็นค่าตั้งต้นที่ผู้ใช้อนุมัติสำหรับ prototype ยังไม่มีผล playtest ยืนยันสมดุล ห้ามปรับราคาเงียบ ๆ หากพบว่าคนไม่ลักลอบ/นายด่านไม่ตรวจ ให้รายงานพร้อมข้อมูลจาก playtest และเสนอการปรับแยกจาก implementation นี้


## 11. Vercel / Firebase deployment checklist (revision 0.2)

- [x] Firebase Preview project `merchant-s-bluff` มี Realtime Databaseที่SingaporeและAnonymous Auth พร้อมทดสอบจริงแล้ว Production projectยังต้องแยกในขั้นถัดไป
- [ ] แยก development/preview ออกจาก production Firebase project/database ไม่ใช้ preview เขียนเกมจริง
- [ ] Public Firebase web config เช่น API key/projectId/databaseURL ใช้ client env ได้ แต่ไม่ใช่สิทธิ์เข้าถึงข้อมูล; การคุ้มครองอยู่ที่ Auth/Rules/API
- [ ] Admin credentials เก็บ Vercel server-only environment variables ห้าม prefix NEXT_PUBLIC_/VITE_ ห้าม commit service-account JSON หรือใส่ใน HTML
- [x] Document env เช่น NEXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, DATABASE_URL, PROJECT_ID, APP_ID (ทุก client key ใช้ prefix ตาม framework) และ server FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DATABASE_URL — docs/deployment-env.md และ .env.production.example; ตรวจ script 7 tests/lint/typecheck ผ่าน ขั้นนี้ยังไม่ตั้งค่าบริการจริง
- [x] แยก Admin SDK module ด้วย server-only import และตรวจ client bundle14filesไม่มีprivate key/email/Admin markers พร้อมpublicconfigจริง
- [x] Deploy database.rules.json ไปยังFirebasePreviewตามอนุมัติและอ่านกลับตรงsource พร้อมliveprivacy51assertionsผ่าน แยกจากdeployVercel Production Rulesของprojectแยกยังต้องตรวจภายหลัง
- [ ] เพิ่ม domains ที่ใช้ตาม Firebase Auth settings ที่เกี่ยวข้อง; ไม่อนุญาต origins แบบกว้างโดยไม่จำเป็น
- [ ] Emulator tests ใช้ dummy project/credentials โดยตั้ง emulator flags เฉพาะ local/test ห้ามเปิดใน production
- [ ] Presence ใช้ .info/connected และ onDisconnect โดยลงทะเบียน disconnect operation ก่อน set online; reconnect ต้องลงทะเบียนใหม่ ใช้ per-connection ID ไม่ทับทุกแท็บด้วย boolean เดียว
- [ ] Presence ใช้แสดงสถานะเท่านั้น ไม่เปิดไพ่ ไม่ตัดสินผล/auto-pass และไม่ใช้เป็น authentication
- [ ] ออฟไลน์ปิดปุ่มส่ง gameplay command เก็บ draft ได้แต่ไม่ queue คำสั่งตรวจ/ให้ผ่านให้ทำงานเงียบ ๆ ตอนออนไลน์; unknown result retry commandId เดิมก่อนส่งใหม่
- [ ] Anonymous Auth persistence รองรับ reload ใน browser เดิม การล้าง storage/เปลี่ยนอุปกรณ์ไม่รับประกันคืน UID เดิม แจ้งข้อจำกัด ไม่ให้ยึดที่นั่งเดิมด้วยชื่อเหมือนกัน
- [ ] Presence ไม่ขับ phase; การ claim lobby host เมื่อ host หลุดต้องผ่าน server-verified policy/transaction และไม่เปลี่ยนนายด่าน
- [ ] ทดสอบหลาย API instances เขียนห้องเดียวกัน, callback retry, request timeout หลัง commit, listener reconnect และ cold start
- [ ] ทดสอบสมาชิกอ่าน private ของเพื่อน/authoritative/root ไม่ได้; non-member อ่าน public ไม่ได้; client แก้เงิน/ไพ่/roles ไม่ได้
- [ ] จำกัด subscriptions ที่จำเป็น ถอด listener เมื่อออกห้อง ตั้งขอบเขต history/retention และตรวจ usage จริงก่อนเลือก plan ไม่รับประกันค่าใช้จ่ายเป็นศูนย์
- [x] ทดสอบlocalproductionbrowser/API→FirebasePreviewจริงด้วยcredentials/Rulesที่ได้รับอนุมัติ4/5/6คนจนจบเกมแล้ว ทดสอบVercelPreviewURLหลังdeploymentยังเป็นขั้นถัดไป ไม่มีpublicURL

M0 เพิ่มการตั้ง Firebase SDK/Admin SDK + emulators; M2 เพิ่ม Rules และ transactions; M5 เพิ่ม deployment checklist นี้ กติกาและตัวเลขสินค้าทุกส่วนคงเดิม

ขั้นตอนหลัง M5 ที่ทำแล้ว: environmentแยกจากdemo/credentialsครบ10/10 และ12ตุลาคมผู้ใช้อนุมัติdeployRulesพร้อมทดสอบFirebaseจริง เผยแพร่Rulesไปยัง`merchant-s-bluff`/Singapore อ่านกลับhashตรงsource Rootread/write=false ทดสอบlocalproductionUI/APIกับAuth/RTDBจริง4/5/6คนครบ8/10/12รอบ ไพ่360ไม่ซ้ำหาย 311 checkpoints, privacy51assertionsผ่าน และretry/offline/reload/controltakeover/rematchผ่านในเกม4คน ล้างห้องและผู้ใช้ทดสอบเฉพาะที่สร้างและหยุดserverแล้ว ไม่เปลี่ยนบัญชี/IAMและยังไม่มีVercel deployment ขั้นที่อนุมัตินี้เสร็จแล้ว ขั้นต่อไปVercelPreviewenv/deploy/URLverification ดูwork/verification/firebase-preview/report.md และwork/progress.md

เอกสารทางการสำหรับ Codex ตรวจ API ณ วันพัฒนา:

- https://firebase.google.com/docs/database/admin/save-data
- https://firebase.google.com/docs/database/security
- https://firebase.google.com/docs/database/web/read-and-write
- https://firebase.google.com/docs/database/web/offline-capabilities
- https://firebase.google.com/docs/auth/web/anonymous-auth
- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://vercel.com/docs/functions
