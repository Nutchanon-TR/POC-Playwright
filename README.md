# Corporate Report Playwright

โปรเจกต์นี้ใช้ Playwright สำหรับทดสอบ End-to-End ของเมนู `Corporate Report` โดยแยก flow หลักออกเป็น 2 spec:

- `tests/corporate-profile.spec.ts`
- `tests/incoming-profile.spec.ts`

ชุดทดสอบครอบคลุมทั้ง `security check`, `negative validation`, `create`, `duplicate pending request`, `approval workflow`, `update`, `delete` และ `post-condition verification` ตามลำดับการใช้งานของ Maker และ Approver

## Test Suites

| Suite | File | Coverage |
| --- | --- | --- |
| `Corporate Profile` | `tests/corporate-profile.spec.ts` | Security rules, SFTP/Email form guards, create approve/reject pairs, duplicate blocking (create/edit/delete), update, delete |
| `Incoming Profile` | `tests/incoming-profile.spec.ts` | Empty state, create guards, account format validation, duplicate blocking (create/edit/delete), update, delete |

## File Structure

```text
tests/
├── corporate-profile.spec.ts       ← orchestrator
├── incoming-profile.spec.ts        ← orchestrator
├── flow/
│   ├── corporate-profile/
│   │   ├── create-flow.ts
│   │   ├── edit-flow.ts
│   │   └── delete-flow.ts
│   └── incoming-profile/
│       ├── create-flow.ts
│       ├── edit-flow.ts
│       └── delete-flow.ts
└── support/
    ├── constant/
    └── helper/
        ├── common/
        │   ├── core/               ← auth, data, http-retry
        │   └── ui/                 ← dialog, form, navigation, table
        ├── corporate-report/       ← corporate-profile, incoming-profile, pending-request, data.factory
        └── index.ts
```

## Test Coverage

### Corporate Profile > Create

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
7. ตรวจ duplicate blocking (create) ของ `SFTP` และ `Email`
8. Approver approve/reject ครบ 4 requests

### Corporate Profile > Edit

1. Maker ทดสอบ negative edit และ submit valid update
2. Maker ตรวจ duplicate blocking (edit)
3. Approver approve update request

### Corporate Profile > Delete

1. Maker ตรวจผล update และ submit delete request
2. Maker ตรวจ duplicate blocking (delete)
3. Approver approve delete request
4. Maker ยืนยันว่ารายการถูกลบแล้ว

### Incoming Profile > Create

1. ตรวจ `No Data` จากการค้นหาที่ไม่มีผลลัพธ์
2. ตรวจ create-form guards:
   - ข้อมูลไม่ครบ
   - `Account No` มีตัวอักษร (`ABC1234567`)
   - `Account No` ไม่ครบ 10 หลัก
3. สร้าง incoming profile สำหรับ approve
4. ตรวจ duplicate blocking (create)
5. สร้าง incoming profile สำหรับ reject
6. Approver approve/reject create requests

### Incoming Profile > Edit

1. Maker ทดสอบ negative edit และ submit valid update
2. Maker ตรวจ duplicate blocking (edit)
3. Approver approve update request

### Incoming Profile > Delete

1. Maker ตรวจผล update และ submit delete request
2. Maker ตรวจ duplicate blocking (delete)
3. Approver approve delete request
4. Maker ยืนยันว่ารายการถูกลบแล้ว

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

รันเฉพาะ group:

```powershell
npx playwright test --grep "Corporate Profile"
npx playwright test --grep "Create"
npx playwright test --grep "Edit"
npx playwright test --grep "Delete"
```

เปิด report หลังรัน:

```powershell
npm run report
```

``` codegen
npx playwright codegen https://corpadmin-dev.se.scb.co.th
```

## Notes

- test suite ยิงกับ environment จริงของระบบ
- credentials ถูกอ่านจาก environment variables ก่อน แล้วค่อย fallback ไปค่าที่กำหนดไว้ใน constants
- flow แบบ step-by-step ดูได้ที่ `SCRIPT.md`
- รายละเอียด helper และตัวอย่างการใช้งานดูได้ที่ `SPEC.md`
