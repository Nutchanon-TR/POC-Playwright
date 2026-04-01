# Corporate Report Playwright

โปรเจกต์นี้ใช้ Playwright สำหรับทดสอบ End-to-End ของเมนู `Corporate Report` บนหน้าเว็บจริง โดยใช้สถาปัตยกรรมแบบ **modular** ที่แยกการทดสอบ Corporate Profile และ Incoming Profile เป็นโมดูลอิสระ

## ภาพรวมการทดสอบ

เทสหลักครอบคลุม flow สำคัญของ `Corporate Profile` และ `Incoming Profile` ตั้งแต่สร้างข้อมูล ส่งอนุมัติ อนุมัติ/ปฏิเสธ แก้ไข ตรวจสอบผลลัพธ์ ไปจนถึงลบข้อมูลและอนุมัติคำขอลบ

## สถาปัตยกรรมการทดสอบ

### โครงสร้างแบบ Modular

การทดสอบถูกออกแบบให้แยกเป็น **2 โมดูลอิสระ** เพื่อรองรับการทดสอบแบบขอบขนาน (Parallel Execution):

| โมดูล | ไฟล์ | รายละเอียด |
|-------|------|-----------|
| **Corporate Profile** | `tests/corporate-profile.spec.ts` | ทดสอบการสร้าง, อนุมัติ, แก้ไข และลบ Corporate Profile (SFTP/Email) |
| **Incoming Profile** | `tests/incoming-profile.spec.ts` | ทดสอบการสร้าง, อนุมัติ, แก้ไข และลบ Incoming Profile |

**เหตุผลในการแยก:**
- ทั้ง 2 โมดูลเป็น **Independent Data Entities** ไม่มี dependency ต่อกัน
- ใช้ API endpoints ที่ต่างกัน (`/corporate-profiles` vs `/incoming-profiles`)
- ใช้ Pending Request tabs ที่แยกกัน (Corporate vs Incoming)
- สามารถรันแบบขนาน (parallel) ได้ โดยไม่กระทบกัน ทำให้ลดเวลาการทดสอบ

### Helper Functions (Modular Architecture)

Helper functions ถูกจัดระเบียบตามสถาปัตยกรรม 3 ชั้น:

```
tests/support/helper/
├── common/                          ← Generic/Reusable Layer
│   ├── core/                        ← System-level utilities
│   │   ├── auth.helper.ts              (Login, Sign Out)
│   │   └── data.helper.ts              (ID generation, random data)
│   └── ui/                          ← UI interaction utilities
│       ├── dialog.helper.ts            (Dialog handling)
│       ├── form.helper.ts              (Form interactions)
│       ├── navigation.helper.ts        (Page navigation)
│       └── table.helper.ts             (Table operations)
├── corporate-report/                ← Domain-specific Layer
│   ├── corporate-profile.helper.ts     (Corporate Profile CRUD)
│   ├── incoming-profile.helper.ts      (Incoming Profile CRUD)
│   ├── pending-request.helper.ts       (Approval workflows)
│   └── data.factory.ts                 (Test data generation)
└── index.ts                         ← Barrel exports
```

## Flow ที่ทดสอบ

เสริม Negative Test Cases เพื่อยืนยันระบบ Validate ข้อมูลเต็มรูปแบบ:
1. การกรอกข้อมูลผิด Format
2. การกรอกข้อมูลไม่ครบถ้วน
3. การส่งข้อมูลซ้ำซ้อน
4. การดักจับ Timeout เมื่อหน้าจอโหลดช้า

### Common UI & Security Flow (ทดสอบรวม)
1. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com` (Maker)
2. ตรวจสอบ UI: ในหน้ารายการ Pending ต้อง **ไม่แสดง** ปุ่ม Approve/Reject ให้ Maker เห็น
3. ค้นหาข้อมูลที่ไม่มีในระบบ เพื่อตรวจสอบหน้าจอ **No Data (Empty State)**

### Corporate Profile Flow
1. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com` (Maker)
2. สร้าง `Corporate Profile (SFTP)` โดยกรอกข้อมูลไม่ครบ (Negative)
3. สร้าง `Corporate Profile (SFTP)` โดยกรอกข้อมูลผิด Format (Negative)
4. แก้ไขข้อมูลที่ผิด Format เป็นค่าที่ถูกต้องแล้วบันทึก
5. สร้าง `Corporate Profile (SFTP)` สำหรับใช้ทดสอบการ Reject
6. ทดสอบเว้นว่าง **Tax ID** กับ **Email** ทีละฟิลด์ จะต้องทำให้ปุ่ม Submit ถูก Disabled ไว้ (Negative)
7. สร้าง `Corporate Profile (EMAIL)` โดยกรอกข้อมูลผิด Format (Negative)
8. ทดสอบพิมพ์ 3 อีเมล แล้วลบลบออก 1 อีเมลเพื่อเช็คการทำงานของฟิลด์
9. แก้ไขข้อมูลที่ผิด Format เป็นค่าที่ถูกต้องแล้วบันทึก
10. สร้าง `Corporate Profile (EMAIL)` สำหรับใช้ทดสอบการ Reject
11. สร้างรายการ `SFTP` ซ้ำ จะต้องขึ้นแจ้งเตือน 'There is a pending request for this profile.' (Negative)
12. สร้างรายการ `EMAIL` ซ้ำ จะต้องขึ้นแจ้งเตือน 'There is a pending request for this profile.' (Negative)
13. Sign out
14. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com` (Approver)
15. Approve `Corporate Profile (EMAIL)`
16. Reject `Corporate Profile (EMAIL)` 
17. Approve `Corporate Profile (SFTP)`
18. Reject `Corporate Profile (SFTP)` 
19. Sign out
20. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com` (Maker)
21. นำรายการที่ถูกระบุว่าผ่านอนุมัติ มาแก้ไขแบบกรอกข้อมูลไม่ครบ (Negative)
22. นำรายการที่ถูกระบุว่าผ่านอนุมัติ มาแก้ไขแบบกรอกข้อมูลผิด Format (Negative)
23. แก้ไข `Corporate Profile` ด้วยข้อมูลที่สมบูรณ์
24. Sign out
25. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com` (Approver)
26. Approve คำขอตั้งค่าอัปเดต (Update Request)
27. Sign out
28. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com` (Maker)
29. ตรวจสอบผลลัพธ์ข้อมูลว่าอัปเดตเรียบร้อย
30. สร้างคำขอลบรายการ
31. Sign out
32. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com` (Approver)
33. Approve คำขอลบ
34. Sign out เพื่อสิ้นสุด
35. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com` (Maker)
36. ตรวจสอบว่าระบบนำรายการออกไปแล้วอย่างสมบูรณ์

### Incoming Profile Flow
1. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com` (Maker)
2. สร้าง `Incoming Profile` แบบกรอกข้อมูลไม่ครบถ้วน (Negative)
3. สร้าง `Incoming Profile` แบบกรอกข้อมูลผิด Format (Negative)
4. สร้าง `Incoming Profile` ให้สมบูรณ์แบบเพื่อไปรอ Approve
5. สร้าง `Incoming Profile` ด้วยข้อมูลซ้ำ (Negative)
6. สร้าง `Incoming Profile` ให้สมบูรณ์แบบเพื่อไปรอถูก Reject
7. Sign out
8. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com` (Approver)
9. Approve `Incoming Profile`
10. Reject `Incoming Profile`
11. Sign out
12. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com` (Maker)
13. นำรายการก่อนหน้าที่ผ่านอนุมัติ มาแก้ไขแบบข้อมูลไม่ครบ (Negative)
14. นำรายการก่อนหน้าที่ผ่านอนุมัติ มาแก้ไขแบบข้อมูลผิด Format (Negative)
15. นำรายการมาแก้ไขได้อย่างถูกต้อง พร้อมทั้งทดสอบสลับ Flag Active/Inactive
16. Sign out
17. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com` (Approver)
18. Approve คำขอแก้อัปเดต
19. Sign out
20. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com` (Maker)
21. ตรวจสอบดูผลแก้ไขบนหน้าจอมั่นใจว่าถูกต้อง
22. ส่งคำขอลบรายการ (Delete)
23. Sign out
24. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com` (Approver)
25. Approve การส่งขอลบ
26. Sign out
27. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com` (Maker)
28. เข้าไปตรวจสอบว่ารายการลบออกถูกต้องเรียบร้อย

## ไฟล์สำคัญ

### Test Specification Files
- `tests/corporate-profile.spec.ts` - ทดสอบ Corporate Profile (อิสระ, รันแบบ parallel ได้)
- `tests/incoming-profile.spec.ts` - ทดสอบ Incoming Profile (อิสระ, รันแบบ parallel ได้)

### Configuration & Documentation
- `playwright.config.ts` - Playwright configuration
- `SPEC.md` - รายละเอียด Helper Function Specifications และ Technical Notes

## วิธีรัน Playwright

เข้าโฟลเดอร์โปรเจกต์

```powershell
cd poc-automatetest/cap-corporate-report-frontend-poc-playwright
```

ติดตั้ง dependencies

```powershell
npm install
```

ติดตั้ง browser ของ Playwright

```powershell
npx playwright install
```

รันทุกเทส (ทั้ง Corporate และ Incoming Profiles)

```powershell
npm run test
```

รันเฉพาะโมดูล Corporate Profile

```powershell
npm run test:corporate-profile
```

รันเฉพาะโมดูล Incoming Profile

```powershell
npm run test:incoming-profile
```

รันเฉพาะบน Chromium (Corporate Profile)

```powershell
npm run test:chromium
```

เปิดรายงานหลังรัน

```powershell
npm run report
```

สร้าง test ใหม่ด้วย Codegen

```powershell
npx playwright codegen https://corpadmin-dev.se.scb.co.th/
```

## หมายเหตุ

- `playwright.config.ts` กำหนด `testDir` เป็น `./tests`
- ปัจจุบัน config เปิด `video: 'on'` และ `screenshot: 'on'`
- เทสนี้ยิงไปยัง environment จริงของระบบ
- username และ password ถูกกำหนดอยู่ในไฟล์ test โดยตรง
- ถ้าต้องการดูลำดับขั้นแบบละเอียด ให้ดูที่ `script.txt`
