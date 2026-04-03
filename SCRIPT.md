# Automated Test Script

เอกสารนี้สรุปลำดับการทำงานของ automation ตามโค้ดปัจจุบันในแต่ละ spec file

---

## Corporate Profile

### Create

#### Step 1: Maker validates security & form guards

1. Maker login
2. เปิด `Pending Requests` → ตรวจว่า Maker ไม่เห็น action `Approve` และ `Reject`
3. ตรวจ SFTP create-form guards:
   - กรอกข้อมูลไม่ครบ → ตรวจว่า `Submit` disabled
   - กรอก `Corporate ID = SFTP@...`, `Corporate Name (Thai) = Invalid Thai Name`, `Corporate Name (English) = ชื่อภาษาไทย` → ตรวจ error message ของ `corporateIdFormat`, `corporateThaiNameFormat`, `corporateEnglishNameFormat`
4. ตรวจ Email create-form guards:
   - ไม่กรอก `Tax ID` → ตรวจว่า `Submit` disabled
   - ไม่กรอก `Email` → ตรวจว่า `Submit` disabled
   - กรอก `Tax ID = ABC123` → ตรวจ error `Please enter only numeric digits`
   - กรอก `Tax ID = 123456` → ตรวจ error `Please enter at least 13 numeric digits`
5. Maker sign out

#### Step 2: Maker creates SFTP & Email profiles

1. Maker login
2. สร้าง SFTP profile สำหรับ approve
3. สร้าง SFTP profile สำหรับ reject
4. เปิด Email form → เพิ่ม email tag 3 ค่า → ลบ 1 ค่า → submit → ตรวจ success dialog
5. สร้าง Email profile สำหรับ reject
6. Maker sign out

#### Step 3: Maker verifies duplicate blocking

1. Maker login
2. พยายามสร้าง SFTP ซ้ำ → ตรวจ notification `There is a pending request for this profile.`
3. พยายามสร้าง Email ซ้ำ → ตรวจ notification เดิม
4. Maker sign out และ clear cookies

#### Step 4: Approver approves and rejects create requests

1. Approver login
2. Approve `EMAIL approve`
3. Reject `EMAIL reject`
4. Approve `SFTP approve`
5. Reject `SFTP reject`
6. Approver sign out

---

### Edit

#### Step 1: Maker validates edit guards and submits update

1. Maker login
2. ค้นหา Email profile ที่ถูก approve → เปิด edit form
3. ลบ `Corporate Name (English)` → ตรวจว่า `Save` disabled
4. กรอก English name เป็นภาษาไทย และ Remark แบบมี leading space → ตรวจ error `corporateEnglishNameFormat` และ `remarkFormat`
5. กรอก `updatedEnglishName` และ `updatedRemark` → submit → ตรวจ success dialog
6. Maker sign out

#### Step 2: Maker verifies duplicate edit is blocked

1. Maker login
2. เปิด edit form ของ profile เดิม → แก้ไข remark → submit
3. ตรวจ notification `There is a pending request for this profile.`
4. Maker sign out

#### Step 3: Approver approves update

1. Approver login
2. เปิด `Pending Requests > Corporate` → approve update request
3. Approver sign out

---

### Delete

#### Step 1: Maker verifies update and submits delete

1. Maker login
2. ค้นหา Email profile → ตรวจว่า `English Name` และ `Remark` ถูก update แล้ว
3. submit delete request
4. Maker sign out

#### Step 2: Maker verifies duplicate delete is blocked

1. Maker login
2. เปิด delete ของ profile เดิม → ยืนยัน dialog
3. ตรวจ notification `There is a pending request for this profile.`
4. Maker sign out

#### Step 3: Approver approves delete

1. Approver login
2. เปิด `Pending Requests > Corporate` → approve delete request
3. Approver sign out

#### Step 4: Maker confirms deleted

1. Maker login
2. เปิดหน้า Corporate Profiles พร้อม query search ของรายการเดิม
3. ตรวจ `No Data`

---

## Incoming Profile

### Create

#### Step 1: Maker validates form guards, creates profiles, verifies duplicate

1. Maker login
2. ค้นหา account ที่ไม่มีอยู่จริง → ตรวจ `No Data`
3. ตรวจ create-form guards:
   - ไม่กรอก `Account No` → ตรวจว่า `Submit` disabled
   - กรอก `Account No = ABC1234567` → trigger validation → ตรวจ error `Please enter only numbers and must be 10 digits.`
   - กรอก `Account No = 12345` → ตรวจ error เดิม
4. สร้าง incoming profile สำหรับ approve
5. พยายามสร้างรายการซ้ำ → ตรวจ notification `There is a pending request for this profile.`
6. สร้าง incoming profile สำหรับ reject
7. Maker sign out

#### Step 2: Approver approves and rejects create requests

1. Approver login
2. approve รายการ create สำหรับ approve case
3. reject รายการ create สำหรับ reject case
4. Approver sign out

---

### Edit

#### Step 1: Maker validates edit guards and submits update

1. Maker login
2. ค้นหารายการที่ถูก approve → เปิด edit form
3. ลบ `Account No` → ตรวจว่า `Submit` disabled
4. กรอก `Account No = 1234` และ `Remark` แบบมี leading space → ตรวจ error `incomingAccountNo` และ `remarkFormat`
5. กรอก `updatedAccountNo` → เปลี่ยน status เป็น `Inactive` → กรอก `updatedRemark` → submit → ตรวจ success dialog
6. Maker sign out

#### Step 2: Maker verifies duplicate edit is blocked

1. Maker login
2. เปิด edit form ของรายการเดิม → แก้ไข remark → submit
3. ตรวจ notification `There is a pending request for this profile.`
4. Maker sign out

#### Step 3: Approver approves update

1. Approver login
2. เปิด `Pending Requests > Incoming` → approve update request
3. Approver sign out

---

### Delete

#### Step 1: Maker verifies update and submits delete

1. Maker login
2. ค้นหารายการที่ update แล้ว → ตรวจว่า `Account No`, `Status`, และ `Remark` ถูก update
3. submit delete request
4. Maker sign out

#### Step 2: Maker verifies duplicate delete is blocked

1. Maker login
2. เปิด delete ของรายการเดิม → ยืนยัน dialog
3. ตรวจ notification `There is a pending request for this profile.`
4. Maker sign out

#### Step 3: Approver approves delete

1. Approver login
2. เปิด `Pending Requests > Incoming` → approve delete request
3. Approver sign out

#### Step 4: Maker confirms deleted

1. Maker login
2. ค้นหารายการเดิมด้วย account ล่าสุด
3. ตรวจ `No Data`
