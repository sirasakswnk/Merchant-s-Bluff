# ภาพหน้าการ์ดจากผู้ใช้

ใช้ภาพทั้ง7ชนิดจาก `card.zip` ที่ผู้ใช้ส่งวันที่13ตุลาคม2026 เป็นหน้าการ์ดเต็มใบในMerchantHand ทั้งprepare/packและภาพย่อของไพ่ที่กำลังดู หน้าแรกยังใช้ชุดภาพเดิมตามhome.html

| สินค้า | productId / ไฟล์ใน public/art/cards | ลำดับภาพในZIP | มูลค่า | ชดเชย / ค่าปรับ |
|---|---|---:|---:|---:|
| แอปเปิล | apple.webp | 6 | 2 | ชดเชย2 |
| ขนมปัง | bread.webp | 1 | 3 | ชดเชย2 |
| ชีส | cheese.webp | 2 | 4 | ชดเชย3 |
| ผ้า | cloth.webp | 3 | 5 | ชดเชย3 |
| เหล้าเถื่อน | moonshine.webp | 5 | 8 | ค่าปรับ4 |
| หน้าไม้ | crossbow.webp | 4 | 10 | ค่าปรับ5 |
| ใบกัญชา | cannabis_leaf.webp | 7 | 12 | ค่าปรับ6 |

ตรวจชื่อและตัวเลขในภาพตรงrulesVersion0.2ทั้งหมด เก็บต้นทาง1024×1536pxเป็นWebP losslessและตรวจdecoded pixelsเท่ากับPNGทุกภาพ ไม่มีการวาดใหม่หรือแก้ตัวหนังสือ Next/Imageส่งขนาดที่เหมาะกับจอผ่านsizesที่ใช้rem รองรับข้อความ200% ภาพใช้object-fit:containแสดงทั้งใบ ไม่มีชื่อ/ตัวเลขเดิมทับภาพ ป้ายเลือกแล้วอยู่ใต้กรอบ ส่วนชื่อ/ราคา/ค่าปรับ/ชดเชยที่อ่านผ่านscreen readerและช่องรายละเอียดมาจากrules snapshotเดิม

คงขนาดและตำแหน่งมือไพ่ การหมุนครึ่งวงกลม/การเลือก/keyboard/disabled/instanceIds การเปลี่ยนนี้อยู่ในpresentationและassets ไม่แก้engine/backend/data/Rules/ราคา/สำรับ360/rulesVersion

ผลตรวจ [รายงาน](../work/verification/card-art/report.md) ต้นทางasset metadata/SHA256อยู่ [assets.json](../work/verification/card-art/assets.json)
