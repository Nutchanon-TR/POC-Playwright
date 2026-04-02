# Automated Test Script

เอกสารนี้สรุปลำดับการทำงานของ automation ตามโค้ดปัจจุบันในแต่ละ spec file

## `tests/corporate-profile.spec.ts`

### Part 1: Maker validates security rules

1. Maker login
2. เปิด `Pending Requests`
3. ตรวจว่า Maker ไม่เห็น action `Approve` และ `Reject`

### Part 2: Maker validates SFTP create-form guards

1. เปิดฟอร์ม `Add New Corporate Profile`
2. กรอกข้อมูลไม่ครบสำหรับ SFTP
3. ตรวจว่า `Submit` ยัง disabled
4. เปิดฟอร์มใหม่และกรอกข้อมูลผิด format:
   - `Corporate ID = SFTP@...`
   - `Corporate Name (Thai) = Invalid Thai Name`
   - `Corporate Name (English) = ชื่อภาษาไทย`
5. Trigger validation แล้วตรวจ error messages ของ:
   - `corporateIdFormat`
   - `corporateThaiNameFormat`
   - `corporateEnglishNameFormat`

### Part 3: Maker creates SFTP profiles

1. สร้าง SFTP profile สำหรับ approve
2. สร้าง SFTP profile สำหรับ reject
3. ทั้งสองรายการใช้ helper create flow ที่มี retry เมื่อเจอ `429`

### Part 4: Maker validates Email create-form guards

1. ทดสอบกรณีไม่มี `Tax ID`
   - กรอก base fields
   - เลือก `Send Type = Email`
   - กรอก email และเลือก round
   - ตรวจว่า `Submit` disabled
2. ทดสอบกรณีไม่มี `Email`
   - กรอก base fields
   - เลือก `Send Type = Email`
   - กรอก `Tax ID` และเลือก round
   - ตรวจว่า `Submit` disabled
3. ทดสอบ `Tax ID` ผิด format
   - กรอก `Tax ID = ABC123`
   - ตรวจ error `Please enter only numeric digits`
4. ทดสอบ `Tax ID` สั้นเกินไป
   - กรอก `Tax ID = 123456`
   - ตรวจ error `Please enter at least 13 numeric digits`

### Part 5: Maker creates Email profiles

1. เปิดฟอร์ม Email สำหรับ approve
2. เพิ่ม email tag 3 ค่า
3. ลบ email tag ออก 1 ค่า
4. submit และตรวจ success dialog
5. สร้าง Email profile สำหรับ reject

### Part 6: Maker verifies duplicate blocking

1. พยายามสร้าง SFTP profile ซ้ำด้วยข้อมูลเดียวกับรายการ pending
2. ถ้าเจอ `429` ให้ reopen form แล้ว retry
3. ตรวจ notification `There is a pending request for this profile.`
4. พยายามสร้าง Email profile ซ้ำด้วยข้อมูลเดียวกับรายการ pending
5. ถ้าเจอ `429` ให้ reopen form แล้ว retry
6. ตรวจ notification เดิมอีกครั้ง
7. Maker sign out และ clear cookies ก่อนสลับไป approver

### Part 7: Approver approves and rejects 4 requests

1. Approver login
2. Approve `EMAIL approve`
3. Reject `EMAIL reject`
4. Approve `SFTP approve`
5. Reject `SFTP reject`
6. Approver sign out

### Part 8: Maker negative edit and valid update

1. Maker login
2. ค้นหา Email profile ที่ถูก approve
3. เปิด edit form
4. ลบ `Corporate Name (English)` แล้วตรวจว่า `Save` disabled
5. กรอก `Corporate Name (English)` เป็นภาษาไทยและ `Remark` แบบมี leading space
6. ตรวจ error ของ:
   - `corporateEnglishNameFormat`
   - `remarkFormat`
7. กรอก `updatedEnglishName` และ `updatedRemark`
8. submit update และตรวจ success dialog

### Part 9: Approver approves update

1. Approver login
2. เปิด `Pending Requests > Corporate`
3. approve update request ของ Email profile
4. Approver sign out

### Part 10: Maker verifies update and submits delete

1. Maker login
2. ค้นหา Email profile ที่ update แล้ว
3. ตรวจว่า `English Name` และ `Remark` ถูก update
4. submit delete request
5. Maker sign out

### Part 11: Approver approves delete

1. Approver login
2. เปิด `Pending Requests > Corporate`
3. approve delete request
4. Approver sign out

### Part 12: Maker confirms deleted

1. Maker login
2. เปิดหน้า Corporate Profiles พร้อม query search ของรายการเดิม
3. ตรวจ `No Data`

## `tests/incoming-profile.spec.ts`

### Part 1: Maker verifies empty state and negative create cases

1. Maker login
2. ค้นหา account ที่ไม่มีอยู่จริงแล้วตรวจ `No Data`
3. ทดสอบ create แบบข้อมูลไม่ครบ
   - เลือก Corporate ID
   - กรอกวันที่และ remark
   - ไม่กรอก `Account No`
   - ตรวจว่า `Submit` disabled
4. ทดสอบ `Account No` มีตัวอักษร
   - กรอก `ABC1234567`
   - trigger validation
   - ตรวจ error `Please enter only numbers and must be 10 digits.`
5. ทดสอบ `Account No` ไม่ครบ 10 หลัก
   - กรอก `12345`
   - trigger validation
   - ตรวจ error เดิม
6. สร้าง incoming profile สำหรับ approve
7. พยายามสร้างรายการซ้ำขณะยังมี pending request
8. ตรวจ duplicate notification
9. สร้าง incoming profile สำหรับ reject

### Part 2: Approver approves and rejects incoming create requests

1. Approver login
2. approve รายการ create สำหรับ approve case
3. reject รายการ create สำหรับ reject case
4. Approver sign out

### Part 3: Maker performs negative edit checks and submits a valid update

1. Maker login
2. ค้นหารายการที่ถูก approve แล้วเปิด edit
3. ลบ `Account No` แล้วตรวจว่า `Submit` disabled
4. กรอก `Account No = 1234` และ `Remark` แบบมี leading space
5. ตรวจ error ของ:
   - `incomingAccountNo`
   - `remarkFormat`
6. กรอก `updatedAccountNo`
7. เปลี่ยน status เป็น `Inactive`
8. กรอก `updatedRemark`
9. submit update และตรวจ success dialog

### Part 4: Approver approves the incoming update request

1. Approver login
2. เปิด `Pending Requests > Incoming`
3. approve update request
4. Approver sign out

### Part 5: Maker verifies update and submits incoming delete request

1. Maker login
2. ค้นหารายการที่ update แล้ว
3. ตรวจว่า `Account No`, `Status`, และ `Remark` ถูก update
4. submit delete request
5. Maker sign out

### Part 6: Approver approves incoming delete request

1. Approver login
2. เปิด `Pending Requests > Incoming`
3. approve delete request
4. Approver sign out

### Part 7: Maker verifies the incoming profile has been removed

1. Maker login
2. ค้นหารายการเดิมด้วย account ล่าสุด
3. ตรวจ `No Data`
