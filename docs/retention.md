# การเก็บและล้างข้อมูลห้อง — นโยบาย 24 ชั่วโมง

ผู้ใช้เลือกเก็บ **1 วันสำหรับทุกประเภทห้องที่เข้าเงื่อนไข** ห้องLOBBY/FINISHED/ABORTEDเข้าเกณฑ์เมื่อไม่มีAPIที่ถูกต้องมาใช้งาน24ชั่วโมงและไม่มีผู้เล่นออนไลน์ ส่วนPLAYINGไม่ถูกล้างไม่ว่าจะออฟไลน์นานเท่าไร ไม่มีauto-pass/auto-abort/countdown ไม่เปลี่ยนกติกา ราคา หรือสำรับ

Metadataฝั่งserverอยู่ที่ `rooms/{id}/retention` แยกจากgame snapshotและpublic/private views ใช้version1, lifecycle/revision, lastActivityAt, activity counter และdueAt สมาชิกอ่านหรือแก้metadataเองไม่ได้ การcreate/join/command/resumeที่ถูกต้องต่ออายุและยกเลิกcleanupที่กำลังรอได้ คำสั่งผิดสิทธิ์/ข้อมูลขัดแย้งไม่ต่ออายุ

ห้องเก่าที่ไม่มีmetadataหรือข้อมูลไม่สมบูรณ์ถูกข้าม ไม่อนุมานเวลาจบจากเวลาสร้าง/เวลาjoin เมื่อสมาชิกใช้APIของversionใหม่อย่างถูกต้องจะเริ่มmetadataใหม่และนับ24ชั่วโมงจากเวลานั้น เกม0.1/0.2เดิมคงrules snapshotเดิม ไม่มีการเติมไพ่

## ป้องกันการลบระหว่างใช้งาน

1. Dry-runอ่านรายชื่อผ่านshallow REST แล้วอ่านmetadata ไม่อ่านไพ่ทั้งฐานข้อมูล มีขอบเขต100ห้องและ100รหัสต่อbatch/ขนาดresponse2MiB
2. ตอนapplyตรวจmanifestตรงproject/database, versionและเวลา อายุmanifest1ชั่วโมง ตรวจRulesจริงว่ามีpresence fenceและrootยังปิด
3. Transactionห้องตรวจlifecycle/revision/activity/dueAtซ้ำ แล้วตั้งcleanup leaseชั่วคราว Rulesปฏิเสธpresenceใหม่ระหว่างตรวจ แต่ให้disconnectลบpresenceได้
4. อ่านpresenceสดจากserverหลังตั้งfence ถ้ามีคนออนไลน์หรืออ่านไม่ได้จะไม่ล้าง ถ้าresume/rematch/commandเข้ามา metadataเปลี่ยนและworkerเก่าล้างไม่ได้
5. Transactionสุดท้ายตรวจlease/ข้อมูลซ้ำก่อนล้าง คืนได้เฉพาะmarkerเล็ก `{version, kind, retiredAt, code}` ไม่มีไพ่ ชื่อ UID หรือคำสั่งเกม เพื่อกันcreate requestเก่าสร้างห้องคืน
6. ล้างpresenceและคืนcodeด้วยtransactionที่ตรวจroomId ไม่ลบcodeที่ถูกจัดให้ห้องใหม่แล้ว งานหยุดหลังล้างห้องแต่ก่อนล้างcodeกู้ต่อจากmarkerได้ ไม่ลบบัญชีAuth/rate-limitของUIDซึ่งอาจใช้ในห้องอื่น

Leaseมีอายุ120วินาทีสำหรับworker Workerที่หมดเวลาล้างไม่ได้ แต่fenceในRulesไม่ปล่อยpresenceเองตามนาฬิกาเพื่อปิดช่องrace: สมาชิกreload/resumeด้วยAPIversionใหม่ หรือcleanupรอบถัดไปจะกู้ต่อและปล่อยfence ถ้าjobอ่าน/เขียนต่อไม่สำเร็จให้ตรวจnetworkก่อน ห้ามล้างทั้งrooms/rootเพื่อแก้

## รันด้วยCLI

```powershell
# Default: read-only มีsummaryไม่มีUID/ไพ่/token และmanifestส่วนตัวในwork/runtime/retention
npm.cmd run retention -- --env-file .env.preview.local

# เปิดmanifestตรวจรายห้องก่อนใช้apply; ระบุprojectตรงกับไฟล์และenvironment
npm.cmd run retention -- --env-file .env.preview.local --apply --confirm-project merchant-s-bluff

# ถ้ามีหน้าถัดไป ให้ใช้cursorจากmanifestเพื่อสำรวจbatchถัดไป
npm.cmd run retention -- --env-file .env.preview.local --room-cursor <last-room-id> --code-cursor <last-code>
```

Manifestเก็บใน `work/runtime/retention/plan.json` เท่านั้นและถูกignoreจากGit ใช้ `--plan work/runtime/retention/<name>.json` เพื่อแยกรอบได้ เปลี่ยนenvironment/project/แก้schema/ใช้manifestหมดอายุถูกปฏิเสธ การapplyอาจข้ามห้องที่มีการใช้งานหลังdry-run จึงดูsummaryหลังงานด้วย ไม่พิมพ์snapshotsหรือcredentialsเพื่อdebug

## Vercel Cron สำหรับขั้นProduction

สถานะล่าสุด 12 ตุลาคม 2026: เตรียม Production environment โดยใช้ Firebase ร่วมกับ Preview ตามคำอนุมัติผู้ใช้แล้ว มี `CRON_SECRET` เป็น Secret, `RETENTION_FIREBASE_PROJECT_ID=merchant-s-bluff` และ `RETENTION_APPLY_ENABLED=false` ตรวจ readback/local HTTP dry-run ผ่าน ยังไม่ deploy เว็บไซต์ Production หรือเปิดการล้างอัตโนมัติ ดู [Production setup](production-setup.md)

เตรียม `GET /api/maintenance/retention` และdaily cronในvercel.json เวลา20:00UTC (03:00ไทย) ต้องมี `CRON_SECRET` ความยาวอย่างน้อย32ตัวและBearerตรงกัน มิฉะนั้น404/401ก่อนเปิดdatabase

การล้างอัตโนมัติต้องตั้งครบทั้ง `RETENTION_APPLY_ENABLED=true`, `VERCEL_ENV=production` และ `RETENTION_FIREBASE_PROJECT_ID` ตรง `FIREBASE_PROJECT_ID` ที่ตรวจไว้ ตั้งSecretอย่างเดียวไม่เปิดการล้าง Previewไม่สามารถเปิดapplyผ่านHTTPได้ ตั้งenvเมื่อProduction project/configพร้อมและตรวจRulesแล้ว ไม่ใช้secretในNEXT_PUBLIC_หรือส่งในแชท

Runnerจำกัด5batches/เวลาทำงาน มีjob leaseและcursorใน `_maintenance/retention` ที่clientอ่านเขียนไม่ได้ ห้องถูกตรวจซ้ำทุกครั้งก่อนล้าง Cronอาจล่าช้าและbatchอาจมีbacklog:24ชั่วโมงเป็นอายุขั้นต่ำก่อนเข้าเกณฑ์ ไม่รับประกันล้างทันทีครบ24ชั่วโมง VercelCronทำงานเฉพาะProduction ไม่ทำงานบนPreview และHobbyรองรับdaily schedule ดู [quickstart](https://vercel.com/docs/cron-jobs/quickstart), [ข้อจำกัดเวลา](https://vercel.com/docs/cron-jobs/usage-and-pricing) และ [การใช้CRON_SECRET](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

## ผลตรวจขั้นนี้

- Unit89 / integration28ผ่าน มีraceกับresume/create retry/rematch, worker timeout,หลายSDKinstances,คืนcode,orphanreservationและRulesprivacy
- E2E17ผ่าน รวม4/5/6คนPASSขน5ตลอดทั้งไม่แลกและแลก3, เกมเต็ม, offline/retry/control takeover, accessibilityและprocess restart
- FirebasePreviewจริง:เผยแพร่presence fenceและอ่านกลับตรงsource ทดสอบfixture8ชุด ล้างexpired3ห้อง+orphan1 รายการและข้ามPLAYING/online/recent/legacyครบ ล้างfixtureทั้ง8ออกแล้ว ไม่แก้ห้องของผู้เล่น
- CLIกับข้อมูลจริงได้candidate0และข้ามlegacy2 ไม่มีการลบห้องผู้เล่น
- ยังไม่เปิดProduction/automatic deletion ตั้งCronactivationเมื่อถึงขั้นProductionต่อไป งานภาพสุดท้ายM4ยังพัก

ดูหลักฐาน `work/verification/retention/` และสถานะล่าสุดใน `work/progress.md`
