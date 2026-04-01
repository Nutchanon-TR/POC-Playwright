# Corporate Report Playwright

โปรเจกต์นี้ใช้ Playwright สำหรับทดสอบ End-to-End ของเมนู `Corporate Report` บนระบบจริง โดยแยกสเปก `Corporate Profile` และ `Incoming Profile` ออกจากกันเพื่อให้ดูแลง่ายและรันแบบขนานได้

## ภาพรวมการทดสอบ

ชุดเทสปัจจุบันครอบคลุมทั้ง `happy path`, `negative validation`, `duplicate request`, `approval workflow`, `update`, `delete` และ `post-condition verification` ให้ตรงกับ flow ที่ใช้งานจริงของ Maker และ Approver

## สถาปัตยกรรมการทดสอบ

### โครงสร้างแบบ Modular

| โมดูล | ไฟล์ | ความรับผิดชอบ |
|-------|------|----------------|
| `Corporate Profile` | `tests/corporate-profile.spec.ts` | ครอบคลุม UI/Security checks, create/update/delete flow, duplicate SFTP/Email และ approve/reject ครบทั้ง 4 request |
| `Incoming Profile` | `tests/incoming-profile.spec.ts` | ครอบคลุม empty state, create/update/delete flow, duplicate incoming request และ approve/reject |

### Helper Functions

```
tests/support/helper/
├── common/
│   ├── core/
│   │   ├── auth.helper.ts
│   │   └── data.helper.ts
│   └── ui/
│       ├── dialog.helper.ts
│       ├── form.helper.ts
│       ├── navigation.helper.ts
│       └── table.helper.ts
├── corporate-report/
│   ├── corporate-profile.helper.ts
│   ├── incoming-profile.helper.ts
│   ├── pending-request.helper.ts
│   └── data.factory.ts
└── index.ts
```

## Test Cases

### Common UI & Security Flow

coverage ถูกกระจายอยู่ใน 2 สเปกหลัก:

1. Maker login แล้วเข้า `Pending Requests` ต้อง **ไม่เห็น** action `Approve/Reject`
2. ตรวจสอบ `Empty State / No Data` จากการค้นหาข้อมูลที่ไม่มีในระบบ

### Corporate Profile Flow

`tests/corporate-profile.spec.ts` ครอบคลุม:

1. Negative create แบบกรอกข้อมูลไม่ครบสำหรับ `SFTP`
2. Negative create แบบกรอกข้อมูลผิด format สำหรับ `SFTP` แล้วแก้ให้ถูกต้องก่อน submit
3. สร้าง `SFTP` 2 รายการแยกสำหรับ approve และ reject
4. Negative create ของ `Email` โดยเว้น `Tax ID` และ `Email` ทีละกรณีแล้วตรวจว่า `Submit` ถูก disabled
5. Negative create ของ `Email` ด้วย `Tax ID` ผิด format
6. เพิ่มอีเมล 3 ค่าแล้วลบออก 1 ค่า ก่อน submit สำเร็จ
7. สร้าง `Email` 2 รายการแยกสำหรับ approve และ reject
8. ทดสอบสร้าง `SFTP` และ `Email` ซ้ำ แล้วตรวจข้อความ `There is a pending request for this profile.`
9. Approver ทำ `Approve/Reject` ครบทั้ง `EMAIL approve`, `EMAIL reject`, `SFTP approve`, `SFTP reject`
10. Maker แก้ไขรายการที่ approve แล้ว โดยตรวจทั้งกรณีข้อมูลไม่ครบ, ข้อมูลผิด format และ submit update ที่ถูกต้อง
11. Approver approve update request
12. Maker ตรวจสอบผล update แล้วส่ง delete request
13. Approver approve delete request
14. Maker ตรวจสอบปลายทางว่ารายการถูกลบออกแล้ว

### Incoming Profile Flow

`tests/incoming-profile.spec.ts` ครอบคลุม:

1. ตรวจสอบ `No Data` จากการค้นหา account ที่ไม่มีในระบบ
2. Negative create แบบกรอกข้อมูลไม่ครบ
3. Negative create แบบ `Account No` ผิด format
4. สร้างรายการสำหรับ approve
5. ทดสอบสร้างรายการซ้ำขณะยังมี pending request
6. สร้างรายการสำหรับ reject
7. Approver ทำ `Approve` และ `Reject`
8. Maker แก้ไขรายการที่ approve แล้วตรวจทั้งกรณีข้อมูลไม่ครบ, ข้อมูลผิด format, และสลับสถานะ `Active/Inactive`
9. Approver approve update request
10. Maker ตรวจผล update แล้วส่ง delete request
11. Approver approve delete request
12. Maker ตรวจว่ารายการถูกลบออกจากระบบแล้ว

## ไฟล์สำคัญ

### Test Specification Files

- `tests/corporate-profile.spec.ts`
- `tests/incoming-profile.spec.ts`

### Configuration & Documentation

- `playwright.config.ts`
- `README.md`
- `SCRIPT.md`
- `SPEC.md`

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

รันทุกเทส

```powershell
npm run test
```

รันเฉพาะ Corporate Profile

```powershell
npm run test:corporate-profile
```

รันเฉพาะ Incoming Profile

```powershell
npm run test:incoming-profile
```

เปิดรายงานหลังรัน

```powershell
npm run report
```

## หมายเหตุ

- เทสยิงไปยัง environment จริงของระบบ
- config ปัจจุบันเปิด `video: 'on'` และ `screenshot: 'on'`
- username และ password อยู่ในไฟล์ constants/test
- ลำดับ flow แบบ step-by-step ดูต่อได้ที่ `SCRIPT.md`
