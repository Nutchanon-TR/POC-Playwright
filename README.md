# Corporate Report Playwright

โปรเจกต์นี้ใช้ Playwright สำหรับทดสอบ End-to-End ของเมนู `Corporate Report` โดยแยก flow หลักออกเป็น 2 spec:

- `tests/corporate-profile.spec.ts`
- `tests/incoming-profile.spec.ts`

ชุดทดสอบครอบคลุมทั้ง `security check`, `negative validation`, `create`, `duplicate pending request`, `approval workflow`, `update`, `delete` และ `post-condition verification` ตามลำดับการใช้งานของ Maker และ Approver

## Test Suites

| Suite | File | Coverage |
| --- | --- | --- |
| `Corporate Profile` | `tests/corporate-profile.spec.ts` | Security rules, SFTP/Email form guards, create approve/reject pairs, duplicate blocking, update, delete |
| `Incoming Profile` | `tests/incoming-profile.spec.ts` | Empty state, create guards, account format validation, duplicate blocking, update, delete |

## Helper Structure

```text
tests/support/helper/
|-- common/
|   |-- core/
|   |   |-- auth.helper.ts
|   |   |-- data.helper.ts
|   |   `-- http-retry.helper.ts
|   `-- ui/
|       |-- dialog.helper.ts
|       |-- form.helper.ts
|       |-- navigation.helper.ts
|       `-- table.helper.ts
|-- corporate-report/
|   |-- corporate-profile.helper.ts
|   |-- data.factory.ts
|   |-- incoming-profile.helper.ts
|   `-- pending-request.helper.ts
`-- index.ts
```

## Test Coverage

### Corporate Profile

1. Maker ตรวจ security rules ใน `Pending Requests`
2. ตรวจ SFTP create-form guards:
   - ข้อมูลไม่ครบ
   - `Corporate ID` ผิด format
   - `Corporate Name (Thai)` ผิด format
   - `Corporate Name (English)` ผิด format
3. สร้าง `SFTP` สำหรับ approve และ reject
4. ตรวจ Email create-form guards:
   - ขาด `Tax ID`
   - ขาด `Email`
   - `Tax ID` มีตัวอักษร
   - `Tax ID` สั้นกว่า 13 หลัก
5. ทดสอบ add/remove email tag ก่อนสร้าง Email profile
6. สร้าง `Email` สำหรับ approve และ reject
7. ตรวจ duplicate blocking ของ `SFTP` และ `Email`
8. Approver approve/reject ครบ 4 requests
9. Maker ทดสอบ negative edit และ submit valid update
10. Approver approve update request
11. Maker ตรวจผล update และ submit delete request
12. Approver approve delete request
13. Maker ยืนยันว่ารายการถูกลบแล้ว

### Incoming Profile

1. ตรวจ `No Data` จากการค้นหาที่ไม่มีผลลัพธ์
2. ตรวจ create-form guards:
   - ข้อมูลไม่ครบ
   - `Account No` มีตัวอักษร (`ABC1234567`)
   - `Account No` ไม่ครบ 10 หลัก
3. สร้าง incoming profile สำหรับ approve
4. ตรวจ duplicate pending request
5. สร้าง incoming profile สำหรับ reject
6. Approver approve/reject create requests
7. Maker ทดสอบ negative edit และ submit valid update
8. Approver approve update request
9. Maker ตรวจผล update และ submit delete request
10. Approver approve delete request
11. Maker ยืนยันว่ารายการถูกลบแล้ว

## Shared Utilities

- `submitWithRetryOn429(page, submitAction, options?)`
  ใช้ retry เมื่อ backend ตอบ `429 Too Many Requests` เพื่อลดโค้ดซ้ำใน helper และ spec
- `todayAsDdMmYyyy()`
  คืนค่าวันปัจจุบันในรูปแบบ `dd/mm/yyyy` สำหรับ Incoming Profile flow

## Run Commands

เข้าโฟลเดอร์โปรเจกต์:

```powershell
cd cap-corporate-report-frontend-poc-playwright
```

ติดตั้ง dependencies:

```powershell
npm install
```

ติดตั้ง Playwright browsers:

```powershell
npx playwright install
```

รันทุก test:

```powershell
npm run test
```

รันเฉพาะ Corporate Profile:

```powershell
npm run test:corporate-profile
```

รันเฉพาะ Incoming Profile:

```powershell
npm run test:incoming-profile
```

เปิด report หลังรัน:

```powershell
npm run report
```

## Notes

- test suite ยิงกับ environment จริงของระบบ
- credentials ถูกอ่านจาก environment variables ก่อน แล้วค่อย fallback ไปค่าที่กำหนดไว้ใน constants
- flow แบบ step-by-step ดูได้ที่ `SCRIPT.md`
- รายละเอียด helper และตัวอย่างการใช้งานดูได้ที่ `SPEC.md`
