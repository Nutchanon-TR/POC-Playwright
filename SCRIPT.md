# Automated Test Script

เอกสารนี้สรุปลำดับการทำงานของ automation ให้ตรงกับสเปกปัจจุบัน โดยแยกตามไฟล์ test

## `tests/corporate-profile.spec.ts`

### Part 1: Maker validates security rules and create-form guards

1. Maker login
2. เปิด `Pending Requests` แล้วตรวจว่าไม่มี action `Approve/Reject`
   - วัตถุประสงค์: ตรวจสอบว่า Maker ไม่มีสิทธิ์ approve/reject รายการ
   - วิธีตรวจสอบ: เปิดหน้า Pending Requests แล้วตรวจว่าไม่มีปุ่ม `Approve` หรือ `Reject` บนแต่ละแถวของตาราง

3. เปิด form `Corporate Profile` แล้วทดสอบ `SFTP` แบบข้อมูลไม่ครบ
   - วัตถุประสงค์: ตรวจสอบว่าปุ่ม Submit ถูก disabled เมื่อข้อมูลไม่ครบ
   - ข้อมูลที่ทดสอบ:
     - กรอกเฉพาะ Corporate ID, Thai Name, English Name (ไม่เลือก Send Type)
   - วิธีตรวจสอบ: ตรวจว่าปุ่ม Submit ยังคง disabled อยู่
   - ขั้นตอน:
     1. เปิด form Add New Corporate Profile
     2. กรอกข้อมูล Corporate ID, Thai Name, English Name
     3. ตรวจสอบว่าปุ่ม Submit disabled
     4. คลิกปุ่ม Clear เพื่อเคลียร์ฟอร์ม

4. ทดสอบ `SFTP` แบบข้อมูลผิด format แล้วแก้ให้ถูกต้องก่อน submit สำเร็จ
   - วัตถุประสงค์: ตรวจสอบการแสดง validation error messages และการแก้ไข
   - ข้อมูลผิด format ที่ทดสอบ:
     - **Corporate ID**: `SFTP@{timestamp}` (มีตัวอักษรพิเศษ `@` ที่ไม่อนุญาต)
     - **Thai Name**: `Invalid Thai Name` (เป็นภาษาอังกฤษ ไม่ใช่ภาษาไทย)
     - **English Name**: `ชื่อภาษาไทย` (เป็นภาษาไทย ไม่ใช่ภาษาอังกฤษ)
   - Validation messages ที่ต้องแสดง:
     - Corporate ID: "Please enter only letters, numbers, spaces and the symbols - are allowed. No leading or trailing spaces."
     - Thai Name: "Please enter only Thai letters, numbers, spaces, and the symbols . , & - ' ( ) ? + / are allowed. No leading or trailing spaces."
     - English Name: "Please enter only English letters, numbers, spaces, and the symbols . , & - ' ( ) ? + / are allowed. No leading or trailing spaces."
   - วิธีตรวจสอบ:
     1. กรอกข้อมูลผิด format
     2. คลิกที่ field อื่น (เช่น Remark) เพื่อ trigger validation
     3. ตรวจว่า validation messages แสดงถูกต้อง
     4. คลิกปุ่ม Clear
   - ขั้นตอนการแก้ไขและ submit:
     1. เปิด form ใหม่
     2. กรอกข้อมูลที่ถูกต้อง (Corporate ID, Thai Name, English Name)
     3. เลือก Send Type = SFTP
     4. รอให้ปุ่ม Submit เป็น enabled
     5. คลิก Submit
     6. ตรวจสอบว่า redirect ไปหน้า list และแสดง success dialog
5. สร้าง `SFTP` อีก 1 รายการสำหรับเคส reject
   - เรียกใช้ helper: `createSftpCorporateProfile(page, sftpRejected)`

### Part 2: Maker validates Email-type form guards

6. ทดสอบ `Email` แบบไม่มี `Tax ID` แล้วตรวจว่า `Submit` disabled
   - วัตถุประสงค์: ตรวจสอบว่า Tax ID เป็น required field สำหรับ Email type
   - ขั้นตอน:
     1. เปิด form Add New Corporate Profile
     2. กรอก base fields (Corporate ID, Thai Name, English Name, Remark)
     3. เลือก Send Type = Email
     4. กรอก Email และเลือก Send Email Round (แต่ไม่กรอก Tax ID)
     5. ตรวจว่าปุ่ม Submit ยังคง disabled

7. ทดสอบ `Email` แบบไม่มี `Email` แล้วตรวจว่า `Submit` disabled
   - วัตถุประสงค์: ตรวจสอบว่า Email เป็น required field สำหรับ Email type
   - ขั้นตอน:
     1. คลิกปุ่ม Clear
     2. เปิด form ใหม่
     3. กรอก base fields
     4. เลือก Send Type = Email
     5. กรอก Tax ID และเลือก Send Email Round (แต่ไม่กรอก Email)
     6. ตรวจว่าปุ่ม Submit ยังคง disabled

8. ทดสอบ `Email` แบบ `Tax ID` ผิด format
   - วัตถุประสงค์: ตรวจสอบ validation rules ของ Tax ID
   - ข้อมูลผิด format ที่ทดสอบ:
     - **Tax ID ที่มีตัวอักษร**: `12345ABC67890` (ต้องเป็นตัวเลขเท่านั้น)
   - Validation messages ที่ต้องแสดง:
     - "Please enter only numeric digits"
   - ข้อมูลผิด format ที่ 2:
     - **Tax ID สั้นเกินไป**: `123456` (น้อยกว่า 13 หลัก)
   - Validation messages ที่ต้องแสดง:
     - "Please enter at least 13 numeric digits"
   - วิธีตรวจสอบ:
     1. คลิกปุ่ม Clear
     2. เปิด form ใหม่
     3. กรอก base fields
     4. เลือก Send Type = Email
     5. กรอก Tax ID = `12345ABC67890`
     6. คลิกที่ field อื่นเพื่อ trigger validation
     7. ตรวจว่าแสดง error message: "Please enter only numeric digits"
     8. กรอก Tax ID ใหม่ = `123456`
     9. ตรวจว่าแสดง error message: "Please enter at least 13 numeric digits"
     10. คลิกปุ่ม Clear

9. เพิ่มอีเมล 3 ค่าแล้วลบออก 1 ค่า จากนั้น submit `Email` สำหรับเคส approve
   - วัตถุประสงค์: ทดสอบการจัดการ email list (add/remove)
   - ขั้นตอน:
     1. เปิด form ใหม่
     2. กรอก base fields
     3. เลือก Send Type = Email
     4. กรอก Tax ID ที่ถูกต้อง
     5. เพิ่ม email 3 รายการ
     6. ลบ email 1 รายการออก (เหลือ 2 รายการ)
     7. เลือก Send Email Round (Round 1)
     8. Submit
     9. ตรวจว่า success dialog แสดง

10. สร้าง `Email` อีก 1 รายการสำหรับเคส reject
    - เรียกใช้ helper: `createEmailCorporateProfile(page, emailRejected)`

### Part 3: Maker validates duplicate prevention

11. ลองสร้าง `SFTP` ซ้ำและ `Email` ซ้ำ แล้วตรวจข้อความ `There is a pending request for this profile.`
    - วัตถุประสงค์: ตรวจสอบว่าระบบป้องกันการสร้างรายการซ้ำขณะที่มี pending request
    - ขั้นตอนทดสอบ SFTP ซ้ำ:
      1. เปิด form ใหม่
      2. พยายามสร้าง SFTP profile ด้วย Corporate ID เดียวกับที่สร้างไว้ใน step 4
      3. กรอกข้อมูลครบและ submit
      4. ตรวจว่าแสดง notification: "There is a pending request for this profile."
    - ขั้นตอนทดสอบ Email ซ้ำ:
      1. เปิด form ใหม่
      2. พยายามสร้าง Email profile ด้วย Corporate ID เดียวกับที่สร้างไว้ใน step 9
      3. กรอกข้อมูลครบและ submit
      4. ตรวจว่าแสดง notification: "There is a pending request for this profile."

12. Maker sign out

### Part 4: Approver processes pending requests
13. Approver login
14. Approve `EMAIL approve`
    - เปิด Pending Requests tab Corporate
    - ค้นหารายการ EMAIL approve
    - คลิก Approve
    - ใส่ remark ในกล่อง dialog
    - ยืนยัน

15. Reject `EMAIL reject`
    - ค้นหารายการ EMAIL reject
    - คลิก Reject
    - ใส่ remark ในกล่อง dialog
    - ยืนยัน

16. Approve `SFTP approve`
17. Reject `SFTP reject`
18. Approver sign out

### Part 5: Maker edits approved profile with validation

19. Maker login

20. แก้ไขรายการ `EMAIL approve` โดยทดสอบข้อมูลไม่ครบและข้อมูลผิด format ก่อน submit update ที่ถูกต้อง
    - วัตถุประสงค์: ตรวจสอบ validation ในโหมด edit
    - ขั้นตอนค้นหาและเปิด edit form:
      1. เปิดหน้า Corporate Profiles
      2. ค้นหา Corporate ID ที่ถูก approve แล้ว
      3. คลิกไอคอน Edit บนแถวนั้น
    - ทดสอบข้อมูลไม่ครบ:
      1. ลบ English Name ออก (ทำให้ฟิลด์ว่าง)
      2. ตรวจว่าปุ่ม Submit disabled
      3. กรอก English Name กลับคืน
    - ทดสอบข้อมูลผิด format:
      - **English Name ผิด format**: กรอกภาษาไทยแทนภาษาอังกฤษ
      - Validation message: "Please enter only English letters, numbers, spaces, and the symbols . , & - ' ( ) ? + / are allowed. No leading or trailing spaces."
      - **Remark ผิด format**: กรอก leading/trailing spaces
      - Validation message: "Please enter only Thai/English letters, numbers, spaces, new line and the symbols . , ! ? ( ) [ ] + - _ = / # @ : are allowed. No leading or trailing spaces."
    - วิธีตรวจสอบ:
      1. กรอกข้อมูลผิด format
      2. คลิกที่ field อื่นเพื่อ trigger validation
      3. ตรวจว่า validation messages แสดงถูกต้อง
    - Submit update ที่ถูกต้อง:
      1. แก้ไข English Name และ Remark ให้ถูกต้อง
      2. Submit
      3. ตรวจว่า redirect กลับหน้า list และแสดง success message

21. Maker sign out

### Part 6: Approver approves update and Maker verifies

22. Approver login แล้ว approve update request
23. Approver sign out

24. Maker login แล้วตรวจผล update บนหน้า list
    - ค้นหา Corporate ID
    - ตรวจสอบว่า English Name และ Remark ถูก update ตามที่แก้ไข

### Part 7: Delete flow

25. Maker ส่ง delete request
    - คลิกไอคอน Delete บนแถวของ EMAIL approve
    - ยืนยัน delete ในกล่อง dialog

26. Maker sign out
27. Approver login แล้ว approve delete request
28. Approver sign out

29. Maker login แล้วตรวจ `No Data` หลังรายการถูกลบ
    - ค้นหา Corporate ID ที่ถูกลบแล้ว
    - ตรวจว่าแสดง "No Data" ในตาราง

## `tests/incoming-profile.spec.ts`

### Part 1: Maker validates search and form guards

1. Maker login

2. ค้นหา account ที่ไม่มีในระบบแล้วตรวจ `No Data`
   - วัตถุประสงค์: ตรวจสอบการทำงานของ search function
   - ขั้นตอน:
     1. เปิดหน้า Incoming Profiles
     2. กรอก Corporate ID ที่ไม่มีในระบบในช่องค้นหา
     3. คลิกปุ่ม Search
     4. ตรวจว่าตารางแสดง "No Data"

3. เปิด form `Incoming Profile` แล้วทดสอบกรอกข้อมูลไม่ครบ
   - วัตถุประสงค์: ตรวจสอบว่า required fields ทำงานถูกต้อง
   - ขั้นตอน:
     1. คลิกปุ่ม Add New
     2. ค้นหาและเลือก Corporate ID จาก autocomplete dropdown
     3. กรอก Account No (แต่ไม่เลือก Status)
     4. ตรวจว่าปุ่ม Submit disabled
     5. คลิกปุ่ม Cancel

4. ทดสอบ `Account No` ผิด format
   - วัตถุประสงค์: ตรวจสอบ validation ของ Account No
   - ข้อมูลผิด format ที่ทดสอบ:
     - **Account No มีตัวอักษร**: `ABC1234567` (ต้องเป็นตัวเลขเท่านั้น)
     - **Account No ไม่ครบ 10 หลัก**: `12345` (ต้องเป็น 10 หลักพอดี)
   - Validation message ที่ต้องแสดง:
     - "Please enter only numbers and must be 10 digits."
   - ขั้นตอน:
     1. เปิด form Add New
     2. ค้นหาและเลือก Corporate ID
     3. กรอก Account No = `ABC1234567`
     4. เลือก Status = Active
     5. คลิกที่ field อื่นเพื่อ trigger validation
     6. ตรวจว่าแสดง error message
     7. แก้ Account No = `12345`
     8. ตรวจว่าแสดง error message เดิม (ไม่ครบ 10 หลัก)
     9. คลิกปุ่ม Clear

5. สร้าง incoming profile สำหรับเคส approve
   - ขั้นตอน:
     1. เปิด form ใหม่
     2. ค้นหาและเลือก Corporate ID
     3. กรอก Account No ที่ถูกต้อง (10 หลัก)
     4. เลือก Status = Active
     5. กรอก Remark
     6. Submit
     7. ตรวจว่า success dialog แสดง

6. ลองสร้าง incoming profile ซ้ำระหว่างที่ยังมี pending request
   - วัตถุประสงค์: ตรวจสอบว่าระบบป้องกันการสร้างรายการซ้ำ
   - ขั้นตอน:
     1. เปิด form ใหม่
     2. พยายามสร้าง profile ด้วย Corporate ID + Account No เดียวกับที่สร้างใน step 5
     3. Submit
     4. ตรวจว่าแสดง notification: "There is a pending request for this profile."

7. สร้าง incoming profile สำหรับเคส reject
8. Maker sign out

### Part 2: Approver processes pending requests

9. Approver login
10. Approve เคส approve
    - เปิด Pending Requests tab Incoming
    - ค้นหารายการ
    - คลิก Approve พร้อมใส่ remark

11. Reject เคส reject
    - คลิก Reject พร้อมใส่ remark

12. Approver sign out

### Part 3: Maker edits approved profile with validation

13. Maker login

14. แก้ไขรายการที่ approve แล้วทดสอบข้อมูลไม่ครบและข้อมูลผิด format
    - วัตถุประสงค์: ตรวจสอบ validation ในโหมด edit
    - ขั้นตอนค้นหาและเปิด edit form:
      1. เปิดหน้า Incoming Profiles
      2. ค้นหา Corporate ID หรือ Account No
      3. คลิกไอคอน Edit บนแถวนั้น
    - ทดสอบข้อมูลไม่ครบ:
      1. เลือก Status = (ไม่เลือกอะไร/ล้างค่า)
      2. ตรวจว่าปุ่ม Submit disabled
      3. เลือก Status กลับคืน
    - ทดสอบข้อมูลผิด format:
      - **Account No ผิด format**: แก้เป็น `12345` (ไม่ครบ 10 หลัก)
      - Validation message: "Please enter only numbers and must be 10 digits."
      - **Remark ผิด format**: กรอก leading/trailing spaces
      - Validation message: "Please enter only Thai/English letters, numbers, spaces, new line and the symbols . , ! ? ( ) [ ] + - _ = / # @ : are allowed. No leading or trailing spaces."
    - วิธีตรวจสอบ:
      1. กรอกข้อมูลผิด format
      2. คลิกที่ field อื่นเพื่อ trigger validation
      3. ตรวจว่า validation messages แสดงถูกต้อง

15. ส่ง update request ที่ถูกต้อง พร้อมสลับสถานะเป็น `Inactive`
    - ขั้นตอน:
      1. แก้ไข Account No, Remark ให้ถูกต้อง
      2. เปลี่ยน Status จาก Active เป็น Inactive
      3. Submit
      4. ตรวจว่า redirect กลับหน้า list และแสดง success message

16. Maker sign out

### Part 4: Approver approves update and Maker verifies

17. Approver login แล้ว approve update request
18. Approver sign out

19. Maker login แล้วตรวจผล update บนหน้า list
    - ค้นหา Corporate ID หรือ Account No
    - ตรวจสอบว่า Account No, Status, และ Remark ถูก update ตามที่แก้ไข
    - ตรวจสอบว่า Status เป็น Inactive

### Part 5: Delete flow

20. Maker ส่ง delete request
    - คลิกไอคอน Delete บนแถวของรายการที่ update แล้ว
    - ยืนยัน delete ในกล่อง dialog

21. Maker sign out
22. Approver login แล้ว approve delete request
23. Approver sign out

24. Maker login แล้วตรวจ `No Data` หลังรายการถูกลบ
    - ค้นหา Corporate ID หรือ Account No ที่ถูกลบแล้ว
    - ตรวจว่าแสดง "No Data" ในตาราง
