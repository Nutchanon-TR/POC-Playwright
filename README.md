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

เพิ่ม negative test case สำหรับ validate data
-. กรอกข้อมูลผิด format
-. กรอกข้อมูลไม่ครบ
-. กรอกข้อมูลซ้ำ
-. ดัก timeout ให้ครบ กรณีโหลดช้า

### Corporate Profile Flow
1. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com`
- สร้าง negative test case `Corporate Profile` แบบ `SFTP` ที่กรอกข้อมูลไม่ครบ
- สร้าง negative test case `Corporate Profile` แบบ `SFTP` ที่กรอกข้อมูลผิด format
2. เปลี่ยนข้อมูลที่กรอกผิด format เป็นข้อมูลที่ถูกต้อง `Corporate Profile` แบบ `SFTP`
- สร้าง `Corporate Profile` แบบ `SFTP` สำหรับ reject
- สร้าง negative test case `Corporate Profile` แบบ `EMAIL` ที่กรอกข้อมูลไม่ครบ
- สร้าง negative test case `Corporate Profile` แบบ `EMAIL` ที่กรอกข้อมูลผิด format
3. เปลี่ยนข้อมูลที่กรอกผิด format เป็นข้อมูลที่ถูกต้อง `Corporate Profile` แบบ `EMAIL`
- สร้าง `Corporate Profile` แบบ `EMAIL` สำหรับ reject
- สร้าง negative test case `Corporate Profile` แบบ `SFTP` ที่มีอยู่แล้ว แล้ว noti ขึ้นว่า 'There is a pending request for this profile.'
- สร้าง negative test case `Corporate Profile` แบบ `EMAIL`  ที่มีอยู่แล้ว แล้ว noti ขึ้นว่า 'There is a pending request for this profile.'
4. Sign out จากผู้สร้างรายการ
5. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com`
6. Approve รายการ `Corporate Profile` แบบ `EMAIL`
6. Reject รายการ `Corporate Profile` แบบ `EMAIL`
7. Approve รายการ `Corporate Profile` แบบ `SFTP`
7. Reject รายการ `Corporate Profile` แบบ `SFTP`
8. Sign out จาก approver
9. Login กลับด้วย `corporatereport02@scbcorp.onmicrosoft.com`
- แก้ไขให้เป็น negative test case `Corporate Profile` ที่ถูก approve นั้นกรอกข้อมูลไม่ครบ
- แก้ไขให้เป็น negative test case `Corporate Profile` ที่ถูก approve นั้นกรอกข้อมูลผิด format
10. แก้ไข `Corporate Profile` ที่ถูก approve
11. Sign out จากผู้สร้างรายการ
12. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com`
13. Approve คำขอแก้ไข `Corporate Profile`
14. Sign out จาก approver
15. Login กลับด้วย `corporatereport02@scbcorp.onmicrosoft.com`
16. ตรวจสอบว่าข้อมูล `Corporate Profile` ถูกแก้ไขสำเร็จ
17. ลบ `Corporate Profile` ที่แก้ไขแล้ว
18. Sign out จากผู้สร้างรายการ
19. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com`
20. Approve คำขอลบ `Corporate Profile`
21. Sign out เพื่อจบการทดสอบ
- Login กลับด้วย `corporatereport02@scbcorp.onmicrosoft.com`
- ตรวจสอบว่าข้อมูลที่ลบไปหายไปจริงๆ

### Incoming Profile Flow
1. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com`
- สร้าง negative test case `Incoming Profile` ที่กรอกข้อมูลไม่ครบ
- สร้าง negative test case `Incoming Profile` ที่กรอกข้อมูลผิด format
2. สร้าง `Incoming Profile` สำหรับใช้อนุมัติ
- สร้าง negative test case `Incoming Profile` ที่กรอกข้อมูลซ้ำ
3. สร้าง `Incoming Profile` สำหรับใช้ปฏิเสธ
4. Sign out จากผู้สร้างรายการ
5. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com`
6. Approve `Incoming Profile` รายการแรก
7. Reject `Incoming Profile` รายการที่สอง
8. Sign out จาก approver
9. Login กลับด้วย `corporatereport02@scbcorp.onmicrosoft.com`
- แก้ไขให้เป็น negative test case `Incoming Profile` ที่ถูก approve นั้นกรอกข้อมูลไม่ครบ
- แก้ไขให้เป็น negative test case `Incoming Profile` ที่ถูก approve นั้นกรอกข้อมูลผิด format
10. แก้ไข `Incoming Profile` ที่ถูก approve
11. Sign out จากผู้สร้างรายการ
12. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com`
13. Approve คำขอแก้ไข `Incoming Profile`
14. Sign out จาก approver
15. Login กลับด้วย `corporatereport02@scbcorp.onmicrosoft.com`
16. ตรวจสอบว่าข้อมูล `Incoming Profile` ถูกแก้ไขสำเร็จ
17. ลบ `Incoming Profile` ที่แก้ไขแล้ว
18. Sign out จากผู้สร้างรายการ
19. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com`
20. Approve คำขอลบ `Incoming Profile`
21. Sign out เพื่อจบการทดสอบ
- Login กลับด้วย `corporatereport02@scbcorp.onmicrosoft.com`
- ตรวจสอบว่าข้อมูลที่ลบไปหายไปจริงๆ

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
