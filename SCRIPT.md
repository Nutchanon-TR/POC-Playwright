# Automated Test Script

เอกสารนี้สรุปลำดับการทำงานของ automation ให้ตรงกับสเปกปัจจุบัน โดยแยกตามไฟล์ test

## `tests/corporate-profile.spec.ts`

1. Maker login
2. เปิด `Pending Requests` แล้วตรวจว่าไม่มี action `Approve/Reject`
3. เปิด form `Corporate Profile` แล้วทดสอบ `SFTP` แบบข้อมูลไม่ครบ
4. ทดสอบ `SFTP` แบบข้อมูลผิด format แล้วแก้ให้ถูกต้องก่อน submit สำเร็จ
5. สร้าง `SFTP` อีก 1 รายการสำหรับเคส reject
6. ทดสอบ `Email` แบบไม่มี `Tax ID` แล้วตรวจว่า `Submit` disabled
7. ทดสอบ `Email` แบบไม่มี `Email` แล้วตรวจว่า `Submit` disabled
8. ทดสอบ `Email` แบบ `Tax ID` ผิด format
9. เพิ่มอีเมล 3 ค่าแล้วลบออก 1 ค่า จากนั้น submit `Email` สำหรับเคส approve
10. สร้าง `Email` อีก 1 รายการสำหรับเคส reject
11. ลองสร้าง `SFTP` ซ้ำและ `Email` ซ้ำ แล้วตรวจข้อความ `There is a pending request for this profile.`
12. Maker sign out
13. Approver login
14. Approve `EMAIL approve`
15. Reject `EMAIL reject`
16. Approve `SFTP approve`
17. Reject `SFTP reject`
18. Approver sign out
19. Maker login
20. แก้ไขรายการ `EMAIL approve` โดยทดสอบข้อมูลไม่ครบและข้อมูลผิด format ก่อน submit update ที่ถูกต้อง
21. Maker sign out
22. Approver login แล้ว approve update request
23. Approver sign out
24. Maker login แล้วตรวจผล update บนหน้า list
25. Maker ส่ง delete request
26. Maker sign out
27. Approver login แล้ว approve delete request
28. Approver sign out
29. Maker login แล้วตรวจ `No Data` หลังรายการถูกลบ

## `tests/incoming-profile.spec.ts`

1. Maker login
2. ค้นหา account ที่ไม่มีในระบบแล้วตรวจ `No Data`
3. เปิด form `Incoming Profile` แล้วทดสอบกรอกข้อมูลไม่ครบ
4. ทดสอบ `Account No` ผิด format
5. สร้าง incoming profile สำหรับเคส approve
6. ลองสร้าง incoming profile ซ้ำระหว่างที่ยังมี pending request
7. สร้าง incoming profile สำหรับเคส reject
8. Maker sign out
9. Approver login
10. Approve เคส approve
11. Reject เคส reject
12. Approver sign out
13. Maker login
14. แก้ไขรายการที่ approve แล้วทดสอบข้อมูลไม่ครบและข้อมูลผิด format
15. ส่ง update request ที่ถูกต้อง พร้อมสลับสถานะเป็น `Inactive`
16. Maker sign out
17. Approver login แล้ว approve update request
18. Approver sign out
19. Maker login แล้วตรวจผล update บนหน้า list
20. Maker ส่ง delete request
21. Maker sign out
22. Approver login แล้ว approve delete request
23. Approver sign out
24. Maker login แล้วตรวจ `No Data` หลังรายการถูกลบ
