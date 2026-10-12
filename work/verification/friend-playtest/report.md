# ลิงก์ทดลองเฉพาะกลุ่ม — 12 ตุลาคม 2026

ผู้ใช้เลือกเตรียมลิงก์ทดสอบสำหรับกลุ่มเพื่อน สร้างshareable linkเฉพาะdeployment `dpl_HgG5ifxnEs71eB7Xg5tZRw6aAnh2` ที่เล่นครบ4/5/6คนแล้ว อายุ604800วินาที หมดอายุ19ตุลาคม2026 14:37ไทย ไม่เปลี่ยนproject protection, game source, Rules, ราคา หรือกติกา

ลิงก์เต็มอยู่ในแชทและไฟล์ignored `work/runtime/firebase-preview/friend-playtest-share.json` / `friend-invite.md` เท่านั้น รายงานที่เข้าGitไม่มีtoken ไม่มีcookie และไม่มีID token ใครมีลิงก์เข้าได้ ไม่ใช่allowlistของบุคคล

`share-flow-report.json` ยืนยันด้วยfresh Chromium contexts4ชุด (360/390/430/1280px) ไม่มีVercel cookiesหรือcustom auth headersก่อนเริ่ม:

| ตรวจ | ผล |
|---|---|
| ลิงก์ปกติก่อนเปิดshared link | 302ไปVercel login |
| เปิดshared link | เข้าhomeและAnonymous Firebase Authสำเร็จทุกcontext โดยไม่ล็อกอินVercel |
| Share cookie | ตั้งcookieของdeploymentและเข้าroom pathที่ไม่มีquery tokenได้ |
| Game auth | POSTcreateที่ไม่มีFirebasetokenยัง401แม้ผ่านshareแล้ว |
| Deploymentอื่น | ยัง302ไม่ให้เข้า |
| Gameplayจริง | 4คนสร้าง/เข้าห้อง พร้อม เริ่ม เตรียม/แลก3 ขน5 แจ้ง เจรจา PASS3คน สรุปรอบ และกดไปรอบ2ครบ |
| Conservation | ทุกcheckpointtotal/unique360/รายสินค้าและIDชุดเดิมครบ |
| Recovery/mobile | reloadหน้าห้องไม่มีsharequeryกลับที่นั่งเดิมได้ ไม่มีhorizontal overflow/pageerror |
| Cleanup | ลบเฉพาะห้องทดสอบ1ห้อง/anonymous test users4ราย พร้อมpresence/code/rate recordsครบ |

ภาพที่ตรวจอยู่ในworkspaceและignoredจากGit: `home-shared-360.png`, `round-summary-shared-360.png` ทดสอบshared entry/cookie/หนึ่งรอบใหม่ ไม่อ้างว่าเล่นเกมเต็ม3เกมใหม่ ผลเต็มเดิมอยู่ `../vercel-preview/report.md` ไม่ใช่โทรศัพท์จริงหรือhuman balance playtest

เตรียมวิธีเริ่มเล่นและfeedback templateใน `docs/friend-playtest.md` แล้ว ไม่มีการส่งข้อความให้เพื่อนแทนผู้ใช้ หลังขั้นนี้รอผู้ใช้ลองเล่นและส่งfeedback หรือสั่งงานขั้นถัดไป
