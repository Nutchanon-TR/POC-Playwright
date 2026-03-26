# Corporate Report Playwright

โปรเจกต์นี้ใช้ Playwright สำหรับทดสอบ End-to-End ของเมนู `Corporate Report` บนหน้าเว็บจริง โดยอ้างอิง flow หลักจากไฟล์ `tests/corporate-report.spec.ts`

## ภาพรวมการทดสอบ

เทสหลักครอบคลุม flow สำคัญของ `Corporate Profile` และ `Incoming Profile` ตั้งแต่สร้างข้อมูล ส่งอนุมัติ อนุมัติ/ปฏิเสธ แก้ไข ตรวจสอบผลลัพธ์ ไปจนถึงลบข้อมูลและอนุมัติคำขอลบ

## Flow ที่ทดสอบ

1. Login ด้วย `corporatereport02@scbcorp.onmicrosoft.com`
2. สร้าง `Corporate Profile` แบบ `SFTP`
3. สร้าง `Corporate Profile` แบบ `EMAIL`
4. สร้าง `Incoming Profile` สำหรับใช้อนุมัติ
5. สร้าง `Incoming Profile` สำหรับใช้ปฏิเสธ
6. Sign out จากผู้สร้างรายการ
7. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com`
8. Approve รายการ `Corporate Profile` แบบ `EMAIL`
9. Reject รายการ `Corporate Profile` แบบ `SFTP`
10. Approve `Incoming Profile` รายการแรก
11. Reject `Incoming Profile` รายการที่สอง
12. Sign out จาก approver
13. Login กลับด้วย `corporatereport02@scbcorp.onmicrosoft.com`
14. แก้ไข `Corporate Profile` ที่ถูก approve
15. แก้ไข `Incoming Profile` ที่ถูก approve
16. Sign out จากผู้สร้างรายการ
17. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com`
18. Approve คำขอแก้ไข `Corporate Profile`
19. Approve คำขอแก้ไข `Incoming Profile`
20. Sign out จาก approver
21. Login กลับด้วย `corporatereport02@scbcorp.onmicrosoft.com`
22. ตรวจสอบว่าข้อมูล `Corporate Profile` ถูกแก้ไขสำเร็จ
23. ตรวจสอบว่าข้อมูล `Incoming Profile` ถูกแก้ไขสำเร็จ
24. ลบ `Corporate Profile` ที่แก้ไขแล้ว
25. ลบ `Incoming Profile` ที่แก้ไขแล้ว
26. Sign out จากผู้สร้างรายการ
27. Login ด้วย `corporatereport04@scbcorp.onmicrosoft.com`
28. Approve คำขอลบ `Corporate Profile`
29. Approve คำขอลบ `Incoming Profile`
30. Sign out เพื่อจบการทดสอบ

## ไฟล์สำคัญ

- `tests/corporate-report.spec.ts` เทสหลักของ Corporate Report
- `tests/example.spec.ts` ตัวอย่าง Playwright test
- `playwright.config.ts` config สำหรับรัน Playwright
- `script.txt` สรุปขั้นตอนการทดสอบแบบ step-by-step

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
npx playwright test
```

รันเฉพาะเทส Corporate Report

```powershell
npx playwright test tests/corporate-report.spec.ts
```

รันเฉพาะบน Chromium

```powershell
npx playwright test tests/corporate-report.spec.ts --project=chromium
```

เปิดรายงานหลังรัน

```powershell
npx playwright show-report
```

npx playwright codegen https://corpadmin-dev.se.scb.co.th/

## หมายเหตุ

- `playwright.config.ts` กำหนด `testDir` เป็น `./tests`
- ปัจจุบัน config เปิด `video: 'on'` และ `screenshot: 'on'`
- เทสนี้ยิงไปยัง environment จริงของระบบ
- username และ password ถูกกำหนดอยู่ในไฟล์ test โดยตรง
- ถ้าต้องการดูลำดับขั้นแบบละเอียด ให้ดูที่ `script.txt`
