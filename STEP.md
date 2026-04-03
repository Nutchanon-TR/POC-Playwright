# เอกสารรายละเอียด Test Flow สำหรับ Incoming Profile (แบบครบถ้วน)

เอกสารนี้ให้รายละเอียดแบบละเอียดมากสำหรับทุก test flow ของ Incoming Profile รวมถึงทุกการกระทำของผู้ใช้, การตรวจสอบ, เงื่อนไขต่างๆ และการเชื่อมต่อ API

## ภาพรวม

ชุดการทดสอบ Incoming Profile ประกอบด้วย 3 flow ที่ทำงานต่อเนื่องกัน เพื่อทดสอบวงจรการจัดการ incoming profile ทั้งหมด:
1. **Create Flow** - ทดสอบการสร้าง profile พร้อม validation guards, การตรวจจับข้อมูลซ้ำ และกระบวนการอนุมัติ/ปฏิเสธ
2. **Edit Flow** - ทดสอบการอัปเดต profile พร้อม validation guards, การป้องกันคำขอซ้ำ และกระบวนการอนุมัติ
3. **Delete Flow** - ทดสอบการลบ profile พร้อมการตรวจสอบ, การป้องกันคำขอซ้ำ และกระบวนการอนุมัติ

flow ทั้งหมดใช้รูปแบบการทำงานแบบ Maker-Approver โดยที่:
- **Maker** (บัญชีผู้สร้าง: `corporatereport02@scbcorp.onmicrosoft.com`) สร้าง/แก้ไข/ลบ profiles
- **Approver** (บัญชีผู้อนุมัติ: `corporatereport04@scbcorp.onmicrosoft.com`) อนุมัติหรือปฏิเสธคำขอ

---

## Create Flow

ไฟล์: `tests/flow/incoming-profile/create-flow.ts`

### การตั้งค่าการทดสอบ
- **Timeout**: 600,000ms (10 นาที)
- **การทำงาน**: ต่อเนื่อง (ทำงานก่อน Edit และ Delete flows)

---

### ขั้นตอนที่ 1: Maker ตรวจสอบ validation guards, สร้าง profiles และตรวจสอบข้อมูลซ้ำ

**วัตถุประสงค์**: ทดสอบกฎการตรวจสอบฟอร์ม, สร้าง profile 2 อัน (1 อันสำหรับอนุมัติ, 1 อันสำหรับปฏิเสธ) และตรวจสอบการตรวจจับข้อมูลซ้ำ

#### 1.1 เข้าสู่ระบบในฐานะ Maker

**การดำเนินการ:**
1. ไปที่ URL สำหรับ login: `https://corpadmin-dev.se.scb.co.th/login`
2. รอให้ปุ่ม "Accept" แสดงขึ้น
3. กดปุ่ม "Accept"
4. รอให้ปุ่ม "windows Sign in with Microsoft" แสดงขึ้น
5. กดปุ่ม "windows Sign in with Microsoft"
6. **การจัดการ Session**: ระบบจะตรวจสอบปุ่ม "Use another account" อัตโนมัติ
   - ถ้ามีปุ่ม "Use another account" ปรากฏ (timeout: 3000ms) ระบบจะกดให้เอง
   - ช่วยป้องกันการรบกวนจาก session ที่เหลืออยู่จากการทดสอบครั้งก่อน
7. รอให้หน้าถึงสถานะ 'networkidle' (timeout: 15000ms)
8. **กรอกชื่อผู้ใช้** (เงื่อนไข):
   - ตรวจสอบว่าช่องกรอกชื่อผู้ใช้ (textbox ชื่อ "Enter your email, phone, or") แสดงหรือไม่ (timeout: 5000ms)
   - ถ้าแสดง:
     - กดที่ช่องกรอกชื่อผู้ใช้
     - กรอก: `corporatereport02@scbcorp.onmicrosoft.com`
     - รอให้ปุ่ม "Next" พร้อมใช้งาน
     - กดปุ่ม "Next"
     - รอให้หน้าถึงสถานะ 'networkidle' (timeout: 15000ms)
   - ถ้าไม่แสดง: ข้าม (บัญชีอาจถูก cache ไว้แล้ว)
9. **กรอกรหัสผ่าน**:
   - ตรวจสอบว่า textbox รหัสผ่าน (ชื่อ "Enter the password for") แสดงหรือไม่ (timeout: 15000ms)
   - ถ้าแสดง: กดที่ช่อง textbox รหัสผ่าน
   - รอให้ช่องกรอกรหัสผ่าน (#i0118) แสดงขึ้น (timeout: 15000ms)
   - กรอกรหัสผ่าน: `CORPREPORT2!scb2026$`
10. **ลงชื่อเข้าใช้**:
    - รอให้ปุ่ม "Sign in" แสดงขึ้น (timeout: 15000ms)
    - รอให้ปุ่ม "Sign in" พร้อมใช้งาน (timeout: 5000ms)
    - กดปุ่ม "Sign in"
11. **Stay Signed In** (เงื่อนไข):
    - เนื่องจากระบบกดปุ่ม "Use another account" แล้ว จึงข้ามการกดปุ่ม "Yes" สำหรับ "Stay signed in?"
    - Session จะเป็นแบบชั่วคราวและจะถูกล้างหลังจาก sign out

**ผลลัพธ์**: เข้าสู่ระบบในฐานะ Maker ด้วย session ที่สะอาด

#### 1.2 ค้นหา profile ที่ไม่มีอยู่ (ตรวจสอบสถานะว่างเปล่า)

**การดำเนินการ:**
1. **ไปที่หน้า Incoming Profiles**:
   - หารายการเมนู "Incoming Profiles" และหา link ภายใน
   - ตรวจสอบว่า link แสดงหรือไม่ (timeout: 1000ms)
   - ถ้าไม่แสดง:
     - หาเมนู "Corporate Report" ใน complementary navigation
     - กด "Corporate Report" เพื่อขยายเมนูย่อย (force click ถ้าจำเป็น)
     - รอให้ link "Incoming Profiles" แสดงขึ้น
   - กด link "Incoming Profiles"
   - รอให้ URL ตรงกับรูปแบบ: `/corporate-report/incoming-profiles` (timeout: 15000ms)
2. **ค้นหา**:
   - กรอกช่องค้นหา (textbox ชื่อ "Search By Allow Account") ด้วย: `0000000000`
   - กดปุ่มที่ตรงกับรูปแบบ `/Search/i`
3. **ตรวจสอบสถานะว่างเปล่า**:
   - คาดหวังว่าจะเห็นข้อความ "No Data" (ใช้ `.nth(1)` เพื่อเอาตัวที่สองที่ปรากฏ)

**ผลลัพธ์**: ตรวจสอบว่าสถานะว่างเปล่าแสดงถูกต้องสำหรับบัญชีที่ไม่มีอยู่

#### 1.3 Validation Guard #1: ไม่กรอกเลขบัญชี

**วัตถุประสงค์**: ตรวจสอบว่าปุ่ม Submit ถูก disable เมื่อไม่กรอกข้อมูลที่จำเป็น

**การดำเนินการ:**
1. **เปิดฟอร์มเพิ่มข้อมูล**:
   - ไปที่หน้า Incoming Profiles
   - กดปุ่มชื่อ "plus Add New"
   - คาดหวังว่าหัวข้อ "Incoming Profile Details" (ตรง `/Incoming Profile Details/i`) จะแสดงขึ้น
2. **เลือก Corporate ID**:
   - กด combobox ชื่อ "* Corporate Id :"
   - รอให้ตัวเลือก dropdown (.ant-select-dropdown:visible .ant-select-item-option) ปรากฏ
   - คาดหวังว่าตัวเลือกแรกจะแสดงขึ้น
   - กดตัวเลือกแรก
3. **กรอกฟอร์มไม่ครบ** (ไม่มี accountNo):
   - กรอกช่อง effective date (placeholder "Select Date") ด้วย: `{todayAsDdMmYyyy()}` (รูปแบบ: DD/MM/YYYY)
   - กด Tab เพื่อยืนยันวันที่
   - กรอกช่อง remark (placeholder "Enter Remark") ด้วย: `"Incoming missing account check"`
4. **ตรวจสอบว่า Submit ถูก Disable**:
   - คาดหวังว่าปุ่มชื่อ "plus Submit" จะถูก disabled
5. **ล้างฟอร์ม**:
   - กดปุ่มที่ตรงกับรูปแบบ `/Clear/i`

**ผลลัพธ์**: ตรวจสอบว่า form validation ป้องกันการ submit โดยไม่มีเลขบัญชี

#### 1.4 Validation Guard #2: เลขบัญชีเป็นตัวอักษร

**วัตถุประสงค์**: ตรวจสอบข้อความ error สำหรับเลขบัญชีที่ไม่ใช่ตัวเลข

**การดำเนินการ:**
1. **เปิดฟอร์มเพิ่มข้อมูล** (เหมือนกับ 1.3.1)
2. **เลือก Corporate ID** (เหมือนกับ 1.3.2)
3. **กรอกฟอร์มด้วยเลขบัญชีที่ไม่ถูกต้อง**:
   - กรอกช่องบัญชี (placeholder "Enter Account No") ด้วย: `"ABC1234567"` (มีตัวอักษร)
   - กรอก effective date ด้วย: `{todayAsDdMmYyyy()}`
   - กด Tab
   - กรอก remark ด้วย: `"Incoming non-numeric account format"`
4. **กระตุ้น Validation**:
   - กดช่อง remark (placeholder "Enter Remark") เพื่อกระตุ้น validation
5. **ตรวจสอบข้อความ Error**:
   - คาดหวังว่าจะเห็นข้อความ "Please enter only numbers and must be 10 digits."
   - คาดหวังว่าปุ่ม Submit จะถูก disabled
6. **ล้างฟอร์ม**:
   - กดปุ่มที่ตรง `/Clear/i`

**ผลลัพธ์**: ตรวจสอบว่าเลขบัญชีที่ไม่ใช่ตัวเลขแสดง error และป้องกันการ submit

#### 1.5 Validation Guard #3: ตรวจสอบความยาวของเลขบัญชี

**วัตถุประสงค์**: ตรวจสอบ validation error สำหรับเลขบัญชีที่ความยาวไม่ถูกต้อง

**การดำเนินการ:**
1. **เปิดฟอร์มเพิ่มข้อมูล** (เหมือนกับ 1.3.1)
2. **เลือก Corporate ID** (เหมือนกับ 1.3.2)
3. **กรอกฟอร์มด้วยเลขบัญชีสั้น**:
   - กรอกช่องบัญชีด้วย: `"12345"` (5 หลักเท่านั้น, ต้องการ 10 หลัก)
   - กรอก effective date ด้วย: `{todayAsDdMmYyyy()}`
   - กด Tab
   - กรอก remark ด้วย: `"Incoming invalid account format"`
4. **กระตุ้น Validation**:
   - กดช่อง remark
5. **ตรวจสอบข้อความ Error**:
   - คาดหวังว่าจะเห็นข้อความ "Please enter only numbers and must be 10 digits."
   - คาดหวังว่าปุ่ม Submit จะถูก disabled
6. **ล้างฟอร์ม**:
   - กดปุ่มที่ตรง `/Clear/i`

**ผลลัพธ์**: ตรวจสอบว่าเลขบัญชีต้องมีความยาว 10 หลักเท่านั้น

#### 1.6 สร้าง Profile (ที่จะอนุมัติ)

**วัตถุประสงค์**: สร้าง profile ที่จะถูกอนุมัติในภายหลัง

**ข้อมูลทดสอบ** (จาก `buildTestRunData()`):
```typescript
{
  accountNo: `{randomAccountNo}`,  // เลข 10 หลักแบบสุ่ม
  remark: 'Created by Playwright Incoming approve flow'
}
```

**การดำเนินการ:**
1. **เปิดฟอร์มเพิ่มข้อมูล**:
   - ไปที่หน้า Incoming Profiles
   - กดปุ่ม "plus Add New"
   - คาดหวังว่าหัวข้อ "Incoming Profile Details" จะแสดงขึ้น
2. **เลือก Corporate ID** (เหมือนกับ 1.3.2)
3. **กรอกฟอร์ม**:
   - กรอกช่องบัญชีด้วย: `{approvedIncoming.accountNo}`
   - กรอก effective date ด้วย: `{todayAsDdMmYyyy()}`
   - กด Tab
   - กรอก remark ด้วย: `{approvedIncoming.remark}`
4. **Submit พร้อม 429 Retry**:
   - กดปุ่มที่ตรงกับ `/Submit/i`
   - รอการแจ้งเตือนการตอบกลับ (timeout: 3000ms):
     - ถ้าข้อความ "Request failed with status code 429" ปรากฏ:
       - รอ 15,000ms (RATE_LIMIT_WAIT_MS)
       - นี่เป็นการจัดการ retry อัตโนมัติ
     - ถ้าไม่มี error 429, ดำเนินการต่อ
5. **ตรวจสอบความสำเร็จ**:
   - รอให้ URL ตรงกับ `/corporate-report/incoming-profiles` (timeout: 15000ms)
   - **ปิด Success Dialog**:
     - พยายามกดปุ่ม "Yes" (timeout: 2000ms, เพิกเฉยถ้าล้มเหลว)
     - รอให้ dialog ที่มีข้อความ "Request Submitted!" แสดงขึ้น (timeout: 10000ms)
     - กดปุ่มที่ตรงกับ `/ok/i` ใน dialog
6. **การตรวจสอบ API โดยปริยาย**:
   - ฟังก์ชัน helper รอ response ที่:
     - URL ประกอบด้วย `/corporate-report/v1/` และ `/incoming-profiles`
     - Request method ไม่ใช่ 'GET'
     - Status code เป็น 200
   - Response บ่งบอกว่า profile ถูกสร้างและส่งไปรออนุมัติ

**ผลลัพธ์**: Profile ถูกสร้างสำเร็จและรออนุมัติ

#### 1.7 ตรวจสอบการตรวจจับข้อมูลซ้ำ

**วัตถุประสงค์**: ตรวจสอบว่าการพยายามสร้าง profile ซ้ำจะแสดง error

**การดำเนินการ:**
1. **เปิดฟอร์มเพิ่มข้อมูล** (เหมือนกับ 1.6.1)
2. **เลือก Corporate ID** (เหมือนกับ 1.3.2)
3. **กรอกฟอร์มด้วยข้อมูลซ้ำ**:
   - กรอกช่องบัญชีด้วย: `{approvedIncoming.accountNo}` (เหมือนกับ profile ก่อนหน้า)
   - กรอก effective date ด้วย: `{todayAsDdMmYyyy()}`
   - กด Tab
   - กรอก remark ด้วย: `"{approvedIncoming.remark} duplicate"` (remark ต่างกัน แต่บัญชีเดียวกัน)
4. **พยายาม Submit**:
   - กดปุ่มชื่อ "plus Submit"
5. **ตรวจสอบ Duplicate Error**:
   - คาดหวังว่าจะเห็นข้อความ "Incoming profile already exists." (timeout: 15000ms)
   - ใช้ `.last()` เพื่อเอาการแจ้งเตือนล่าสุด
6. **ปิดการแจ้งเตือนและล้างฟอร์ม**:
   - **ปิดการแจ้งเตือน** (ถ้ามี):
     - หา label ที่เป็นข้อความ "Close" (ตัวแรก)
     - ตรวจสอบว่าแสดงหรือไม่ (timeout: 1000ms)
     - ถ้าแสดง:
       - กดมัน
       - รอ 500ms สำหรับ animation
   - **ล้างฟอร์ม**:
     - กดปุ่มที่ตรงกับ `/Clear/i`

**ผลลัพธ์**: ตรวจสอบว่าการตรวจจับข้อมูลซ้ำป้องกันการสร้าง profile ที่มีเลขบัญชีเดียวกัน

#### 1.8 สร้าง Profile (ที่จะปฏิเสธ)

**วัตถุประสงค์**: สร้าง profile ที่สองที่จะถูกปฏิเสธในภายหลัง

**ข้อมูลทดสอบ**:
```typescript
{
  accountNo: `{anotherRandomAccountNo}`,  // เลข 10 หลักแบบสุ่มที่ต่างกัน
  remark: 'Created by Playwright Incoming reject flow'
}
```

**การดำเนินการ**: เหมือนกับ 1.6 แต่ใช้ข้อมูล `rejectedIncoming`

**ผลลัพธ์**: Profile ที่สองถูกสร้างสำเร็จและรออนุมัติ

#### 1.9 ออกจากระบบและล้าง Session

**วัตถุประสงค์**: เตรียมพร้อมสำหรับการเข้าสู่ระบบของ Approver โดยล้าง session ของ Maker

**การดำเนินการ:**
1. **ออกจากระบบ**:
   - กดข้อความ "Sign Out" ในเมนู
   - กดปุ่มชื่อ "Sign Out"
   - รอให้ URL ตรงกับรูปแบบ `/login`
   - คาดหวังว่าปุ่ม "windows Sign in with Microsoft" จะแสดงขึ้น
2. **รอการล้าง Session**:
   - รอ 5000ms ให้ session ล้างอย่างสมบูรณ์
3. **ล้าง Browser Cookies**:
   - เรียก `page.context().clearCookies()` เพื่อให้แน่ใจว่าไม่มีข้อมูล session เหลืออยู่
   - ช่วยป้องกัน Microsoft OAuth จากการแสดงตัวเลือกบัญชีที่ cache ไว้

**ผลลัพธ์**: Maker ออกจากระบบอย่างสมบูรณ์, session ถูกล้าง, พร้อมสำหรับ Approver เข้าสู่ระบบ

---

### ขั้นตอนที่ 2: Approver อนุมัติและปฏิเสธคำขอสร้าง

**วัตถุประสงค์**: ทดสอบกระบวนการอนุมัติและปฏิเสธจากมุมมองของ Approver

#### 2.1 เข้าสู่ระบบในฐานะ Approver

**การดำเนินการ** (คล้ายกับ 1.1 แต่ใช้ข้อมูลรับรองที่ต่างกัน):
1. ไปที่ URL สำหรับ login
2. กด "Accept"
3. กด "windows Sign in with Microsoft"
4. **สำคัญ**: ระบบจะกดปุ่ม "Use another account" อัตโนมัติถ้าปรากฏ เพื่อหลีกเลี่ยงการปนเปื้อน session ของ Maker
5. ถ้าปุ่ม "Use another account" แสดง ระบบจะกดให้
6. รอให้ 'networkidle'
7. **กรอกชื่อผู้ใช้** (เงื่อนไข):
   - ถ้าช่องกรอกชื่อผู้ใช้แสดง: กรอกด้วย `corporatereport04@scbcorp.onmicrosoft.com`
   - กด "Next" ถ้ากรอกชื่อผู้ใช้แล้ว
8. **กรอกรหัสผ่าน**:
   - กรอกรหัสผ่านด้วย: `CORPREPORT4!scb2026$`
9. **ลงชื่อเข้าใช้** และจัดการกับคำถาม stay signed in

**ผลลัพธ์**: เข้าสู่ระบบในฐานะ Approver

#### 2.2 อนุมัติคำขอสร้าง

**วัตถุประสงค์**: อนุมัติคำขอสร้าง profile แรก

**อ้างอิงข้อมูลทดสอบ**:
```typescript
{
  tab: 'Incoming',
  texts: [
    formatIncomingAccountPattern(approvedIncoming.accountNo),  // Regex: accountNo พร้อม hyphens ที่เป็นตัวเลือก
    approvedIncoming.remark                                     // 'Created by Playwright Incoming approve flow'
  ],
  action: 'approve'
}
```

**การดำเนินการ:**
1. **ไปที่ Pending Requests**:
   - เปิดหน้า Pending Requests สำหรับแท็บ 'Incoming'
   - หารายการเมนู "Pending Requests" link
   - ตรวจสอบการแสดง (timeout: 1000ms)
   - ถ้าไม่แสดง ขยายเมนู "Corporate Report"
   - กด link
   - รอให้ URL ตรงกัน
2. **ไปที่หน้าสุดท้าย**:
   - หารายการ pagination ที่ตรงกับ `/^[0-9]+$/`
   - ถ้ามี pagination:
     - กดหมายเลขหน้าสุดท้าย
     - รอ 300ms
3. **หาแถวคำขอ**:
   - หาทุกแถวที่:
     - ไม่ประกอบด้วย `<th>` (ไม่รวมแถวหัวตาราง)
     - ประกอบด้วยข้อความที่ตรงกับรูปแบบบัญชี (เช่น "1-?2-?3-?4-?5-?6-?7-?8-?9-?0")
     - ประกอบด้วยข้อความ "Created by Playwright Incoming approve flow"
   - ถ้าไม่แสดงในหน้าปัจจุบัน:
     - ตรวจสอบว่าปุ่ม Previous Page มีและพร้อมใช้งานหรือไม่
     - ถ้าใช่ กด Previous และค้นหาอีกครั้ง
   - คาดหวังว่าแถวที่ตรงกันแถวแรกจะแสดงขึ้น (timeout: 15000ms)
4. **ทำการอนุมัติ**:
   - เลื่อนแถวเข้าไปในมุมมองถ้าจำเป็น
   - วาง hover บนแถวเพื่อเปิดเผย actions
   - กด link ที่ชื่อตรงกับ `/approve/i`
5. **ยืนยันการอนุมัติ**:
   - หา dialog แรกที่แสดง
   - กดปุ่มที่ตรงกับรูปแบบ `/confirm|ok|yes|approve/i`
6. **การยืนยันขั้นสุดท้าย**:
   - กดปุ่มชื่อ "Yes"
   - กด label "Close" (ตรงทุกประการ)
   - รอสถานะ 'networkidle'

**ผลลัพธ์**: Profile แรกได้รับการอนุมัติและเปิดใช้งาน

#### 2.3 ปฏิเสธคำขอสร้าง

**วัตถุประสงค์**: ปฏิเสธคำขอสร้าง profile ที่สอง

**อ้างอิงข้อมูลทดสอบ**:
```typescript
{
  tab: 'Incoming',
  texts: [
    formatIncomingAccountPattern(rejectedIncoming.accountNo),
    rejectedIncoming.remark  // 'Created by Playwright Incoming reject flow'
  ],
  action: 'reject'
}
```

**การดำเนินการ** (คล้ายกับ 2.2):
1. **ไปที่ Pending Requests** (เหมือนกับ 2.2.1)
2. **ไปที่หน้าสุดท้าย** (เหมือนกับ 2.2.2)
3. **หาแถวคำขอ** (เหมือนกับ 2.2.3 แต่ใช้ข้อมูล rejected profile)
4. **ทำการปฏิเสธ**:
   - เลื่อนแถวเข้าไปในมุมมอง
   - วาง hover บนแถว
   - กด link ที่ตรงกับ `/reject/i`
5. **ยืนยันการปฏิเสธ**:
   - หา dialog แรกที่แสดง
   - ตรวจสอบว่า remark textbox แสดงหรือไม่
   - ถ้าแสดง กรอกด้วย: `"Rejected by automation test"`
   - กดปุ่มที่ตรงกับ `/confirm|ok|yes|reject/i`
6. **การยืนยันขั้นสุดท้าย**:
   - กดปุ่ม "Yes"
   - กด label "Close"
   - รอสถานะ 'networkidle'

**ผลลัพธ์**: Profile ที่สองถูกปฏิเสธ

#### 2.4 ออกจากระบบ Approver

**การดำเนินการ** (เหมือนกับ 1.9):
1. ออกจากระบบจากเมนู
2. รอ 5000ms
3. ล้าง cookies

**ผลลัพธ์**: Approver ออกจากระบบ พร้อมสำหรับ flow ถัดไป

---

## Edit Flow

ไฟล์: `tests/flow/incoming-profile/edit-flow.ts`

### การตั้งค่าการทดสอบ
- **Timeout**: 600,000ms (10 นาที)
- **การทำงาน**: ต่อเนื่อง (ทำงานหลัง Create Flow ก่อน Delete Flow)
- **Dependency**: ต้องการ profile ที่อนุมัติแล้วจาก Create Flow

---

### ขั้นตอนที่ 1: Maker ตรวจสอบ validation guards ของการแก้ไข อัปเดต profile และตรวจสอบการป้องกันคำขอซ้ำ

**วัตถุประสงค์**: ทดสอบการตรวจสอบฟอร์มแก้ไข อัปเดต profile และตรวจสอบการป้องกันคำขอซ้ำ

#### 1.1 เข้าสู่ระบบในฐานะ Maker

**การดำเนินการ**: เหมือนกับ Create Flow 1.1

**ผลลัพธ์**: เข้าสู่ระบบในฐานะ Maker

#### 1.2 Validation Guard #1: ฟอร์มแก้ไข - ไม่กรอกบัญชี (ล้างฟิลด์ที่จำเป็น)

**วัตถุประสงค์**: ตรวจสอบว่าการล้างฟิลด์ที่จำเป็นจะทำให้ปุ่ม Save ถูก disable

**การดำเนินการ**:
1. **นำทางและค้นหา**:
   - ไปที่ Incoming Profiles
   - กรอกช่องค้นหาด้วย: `{approvedIncoming.accountNo}`
   - กดปุ่ม Search
2. **หาและแก้ไข Profile**:
   - หาแถวตารางที่ประกอบด้วย:
     - รูปแบบบัญชีที่ตรงกับ `{approvedIncoming.accountNo}`
     - ข้อความ "Active" (สถานะ profile)
   - เลื่อนแถวเข้าไปในมุมมอง
   - วาง hover บนแถว
   - กดการกระทำแก้ไข (ปุ่ม/link ที่ตรงกับ `/edit/i`)
   - รอให้ URL ตรงกับ: `/corporate-report/incoming-profiles/edit` (timeout: 15000ms)
3. **ล้างฟิลด์ที่จำเป็น**:
   - กดช่องบัญชี (placeholder "Enter Account No")
   - ล้างฟิลด์ (Ctrl+A, Delete)
   - กดช่อง remark เพื่อกระตุ้น validation
4. **ตรวจสอบว่า Save ถูก Disabled**:
   - คาดหวังว่าจะเห็นข้อความ "Please enter Account No"
   - คาดหวังว่าปุ่มชื่อ "save Save" จะถูก disabled
5. **รีเซ็ตฟอร์ม**:
   - กดปุ่มที่ตรงกับ `/Reset/i`

**ผลลัพธ์**: ตรวจสอบว่าฟอร์มแก้ไขป้องกันการบันทึกโดยไม่มีเลขบัญชีที่จำเป็น

#### 1.3 Validation Guard #2: ฟอร์มแก้ไข - บัญชีที่ไม่ใช่ตัวเลข

**วัตถุประสงค์**: ตรวจสอบการตรวจสอบฟอร์มแก้ไขสำหรับบัญชีที่ไม่ใช่ตัวเลข

**การดำเนินการ**:
1. **แก้ไข Profile** (นำทางเหมือนกับ 1.2.1-1.2.2)
2. **กรอกบัญชีที่ไม่ถูกต้อง**:
   - ล้างช่องบัญชี
   - กรอกด้วย: `"INVALID123"`
   - กดช่อง remark
3. **ตรวจสอบ Error**:
   - คาดหวังว่าจะเห็นข้อความ "Please enter only numbers and must be 10 digits."
   - คาดหวังว่าปุ่ม Save จะถูก disabled
4. **Reset Form**: Click Reset button

**Result**: Verified non-numeric validation in edit mode

#### 1.4 Validation Guard #3: Edit Form - Invalid Length

**Purpose**: Verify edit form validation for incorrect account length

**Actions**:
1. **Edit Profile** (same navigation)
2. **Fill Short Account**:
   - Clear account field
   - Fill with: `"123"` (only 3 digits)
   - Click remark field
3. **Validate Error**:
   - Expect error message about 10 digits
   - Expect Save button to be disabled
4. **Reset Form**: Click Reset

**Result**: Verified length validation in edit mode

#### 1.5 Update Profile Successfully

**Purpose**: Submit valid update request

**Test Data**:
```typescript
{
  accountNo: '{approvedIncoming.accountNo}',  // Keep same account
  newRemark: 'Updated by Playwright Incoming edit flow'
}
```

**Actions**:
1. **Edit Profile** (same navigation)
2. **Update Remark**:
   - Clear remark field
   - Fill with: `"Updated by Playwright Incoming edit flow"`
3. **Submit with 429 Retry**:
   - Click button with name "save Save"
   - Click "Yes" button in confirmation dialog
   - Wait for response notification (timeout: 3000ms)
   - If "Request failed with status code 429":
     - Wait 15,000ms
     - Automatic retry handling
4. **Validate Success**:
   - Wait for URL match: `/corporate-report/incoming-profiles`
   - Close success dialog (same as Create Flow 1.6.5)

**Result**: Update request submitted and pending approval

#### 1.6 Verify Duplicate Edit Request Blocked

**Purpose**: Verify cannot submit another edit while one is pending

**Actions**:
1. **Navigate and Search** (same as 1.2.1)
2. **Attempt to Edit**:
   - Find same profile row
   - Attempt to click edit action
3. **Validate Blocked**:
   - Expect notification message: "Profile's status is already pending request."
   - Edit action should be disabled/unavailable

**Result**: Verified duplicate edit requests are blocked

#### 1.7 Sign Out Maker

**Actions**: Same as Create Flow 1.9

**Result**: Maker signed out

---

### Step 2: Approver approves edit request

**Purpose**: Test edit approval workflow

#### 2.1 Login as Approver

**Actions**: Same as Create Flow 2.1

**Result**: Logged in as Approver

#### 2.2 Approve Edit Request

**Purpose**: Approve the profile update

**Test Data**:
```typescript
{
  tab: 'Incoming',
  texts: [
    formatIncomingAccountPattern(approvedIncoming.accountNo),
    'Updated by Playwright Incoming edit flow'  // New remark from edit
  ],
  action: 'approve'
}
```

**Actions**: Same as Create Flow 2.2

**Result**: Profile update approved

#### 2.3 Sign Out Approver

**Actions**: Same as Create Flow 2.4

**Result**: Approver signed out

---

## Delete Flow

File: `tests/flow/incoming-profile/delete-flow.ts`

### Test Configuration
- **Timeout**: 600,000ms (10 minutes)
- **Execution**: Sequential (runs after Edit Flow)
- **Dependency**: Requires approved profile from Create Flow

---

### Step 1: Maker deletes profile and verifies duplicate blocking

**Purpose**: Test delete workflow and verify duplicate delete request prevention

#### 1.1 Login as Maker

**Actions**: Same as Create Flow 1.1

**Result**: Logged in as Maker

#### 1.2 Delete Profile

**Purpose**: Submit delete request for the approved profile

**Actions**:
1. **Navigate and Search**:
   - Navigate to Incoming Profiles
   - Fill search field with: `{approvedIncoming.accountNo}`
   - Click Search button
2. **Find and Delete Profile**:
   - Find table row containing:
     - Account pattern matching `{approvedIncoming.accountNo}`
     - Text "Active"
   - Scroll row into view
   - Hover over row
   - Click delete action (button/link matching `/delete/i`)
   - Wait for URL match: `/corporate-report/incoming-profiles/delete` (timeout: 15000ms)
3. **Confirm Delete**:
   - **Confirmation Dialog**:
     - Wait for dialog to appear
     - The dialog shows profile details in read-only mode
     - Click button with name "delete Delete" (primary danger button)
   - **Delete Confirmation Popup**:
     - A second confirmation appears: "Are you sure you want to delete?"
     - Click "Yes" button in this confirmation
4. **Submit with 429 Retry**:
   - Wait for response notification (timeout: 3000ms)
   - If "Request failed with status code 429":
     - Wait 15,000ms
     - Automatic retry
5. **Validate Success**:
   - Wait for URL match: `/corporate-report/incoming-profiles`
   - Close success dialog
   - **Implicit API Validation**:
     - Response URL includes `/corporate-report/v1/incoming-profiles`
     - Request method is NOT 'GET'
     - Status code is 200

**Result**: Delete request submitted and pending approval

#### 1.3 Verify Duplicate Delete Request Blocked

**Purpose**: Verify cannot submit another delete while one is pending

**Actions**:
1. **Navigate and Search** (same as 1.2.1)
2. **Attempt to Delete Again**:
   - Find same profile row
   - Attempt to click delete action
3. **Validate Blocked**:
   - Expect notification: "Profile's status is already pending request."
   - Delete action should be disabled/unavailable

**Result**: Verified duplicate delete requests are blocked

#### 1.4 Sign Out Maker

**Actions**: Same as Create Flow 1.9

**Result**: Maker signed out

---

### Step 2: Approver approves delete request and verifies removal

**Purpose**: Test delete approval and verify profile is removed

#### 2.1 Login as Approver

**Actions**: Same as Create Flow 2.1

**Result**: Logged in as Approver

#### 2.2 Approve Delete Request

**Purpose**: Approve the profile deletion

**Test Data**:
```typescript
{
  tab: 'Incoming',
  texts: [
    formatIncomingAccountPattern(approvedIncoming.accountNo),
    'Updated by Playwright Incoming edit flow'  // Last known remark
  ],
  action: 'approve'
}
```

**Actions**: Same as Create Flow 2.2

**Result**: Profile deletion approved

#### 2.3 Verify Profile Removed

**Purpose**: Confirm profile no longer exists in active list

**Actions**:
1. **Navigate to Incoming Profiles**:
   - Navigate to Incoming Profiles page
2. **Search for Deleted Profile**:
   - Fill search field with: `{approvedIncoming.accountNo}`
   - Click Search button
3. **Validate Empty State**:
   - Expect text "No Data" to be visible (`.nth(1)`)
   - This confirms profile was successfully deleted from active profiles

**Result**: Verified profile is permanently removed after approval

#### 2.4 Sign Out Approver

**Actions**: Same as Create Flow 2.4

**Result**: Approver signed out, all tests complete

---

## Helper Functions Reference

### Authentication (`auth.helper.ts`)

#### `loginWithMicrosoft(page, username, password, options?)`
- **Purpose**: Handle Microsoft OAuth login with adaptive session handling
- **Parameters**:
  - `page`: Playwright Page object
  - `username`: Email address
  - `password`: Account password
  - `options.useAnotherAccount?`: If true, clicks "Use another account" to avoid cached sessions
- **Key Features**:
  - Handles Accept button
  - Adaptive to cached vs fresh login states
  - Conditional username entry (only if field visible)
  - Always enters password
  - Skips "Stay signed in" if `useAnotherAccount` is true

#### `signOut(page)`
- **Purpose**: Sign out current user
- **Actions**:
  - Click "Sign Out" text
  - Click "Sign Out" button
  - Wait for `/login` URL
  - Verify "windows Sign in with Microsoft" visible

### HTTP Retry (`http-retry.helper.ts`)

#### `submitWithRetryOn429(page, mode)`
- **Purpose**: Submit form with automatic retry on 429 rate limit
- **Parameters**:
  - `page`: Playwright Page
  - `mode`: 'create' | 'edit'
- **Behavior**:
  - For 'create': Clicks "Submit" button
  - For 'edit': Clicks "Save" then "Yes"
  - Waits for 429 notification (timeout: 3000ms)
  - If 429 detected: Waits 15,000ms before retry
- **Constants**:
  - `RATE_LIMIT_NOTIFY_TEXT`: "Request failed with status code 429"
  - `RATE_LIMIT_WAIT_MS`: 15000

### Incoming Profile (`incoming-profile.helper.ts`)

#### `createIncomingProfile(page, data)`
- **Purpose**: Fill and submit incoming profile creation form
- **Parameters**:
  - `data.corporateId`: Corporate ID to select
  - `data.accountNo`: 10-digit account number
  - `data.remark`: Remark text
- **Actions**:
  1. Navigate to Incoming Profiles
  2. Click "Add New"
  3. Select corporate from dropdown
  4. Fill account number
  5. Fill effective date (today)
  6. Fill remark
  7. Submit with 429 retry
  8. Close success dialog
- **API Monitoring**:
  - Waits for response matching:
    - URL contains `/corporate-report/v1/incoming-profiles`
    - Method is NOT 'GET'
    - Status is 200 or 429

#### `updateIncomingProfile(page, data)`
- **Purpose**: Update existing profile
- **Similar to `createIncomingProfile` but**:
  - Finds existing row by account number
  - Clicks edit action
  - Uses "Save" instead of "Submit"
  - Confirms with "Yes" button

#### `deleteIncomingProfile(page, accountNo)`
- **Purpose**: Delete profile
- **Actions**:
  1. Find row by account number
  2. Click delete action
  3. Click "Delete" button
  4. Confirm with "Yes"
  5. Submit with 429 retry
  6. Close success dialog

#### `formatIncomingAccountPattern(accountNo)`
- **Purpose**: Create regex pattern for account number matching
- **Example**: `"1234567890"` → pattern matches "1-?2-?3-?4-?5-?6-?7-?8-?9-?0"
- **Reason**: UI may display account with optional hyphens

#### `todayAsDdMmYyyy()`
- **Purpose**: Get today's date in DD/MM/YYYY format
- **Example**: `"03/04/2026"`

### Pending Request (`pending-request.helper.ts`)

#### `performPendingAction(page, data)`
- **Purpose**: Approve or reject pending request
- **Parameters**:
  - `data.tab`: 'Corporate' | 'Incoming'
  - `data.texts`: Array of text to match in row
  - `data.action`: 'approve' | 'reject'
  - `data.remark?`: Optional remark for rejection
- **Actions**:
  1. Navigate to Pending Requests
  2. Go to last pagination page
  3. Find row by texts
  4. Click action (approve/reject)
  5. Confirm in dialog (add remark if reject)
  6. Click final "Yes"
  7. Close notification

### Dialog (`dialog.helper.ts`)

#### `closeSuccessDialog(page)`
- **Purpose**: Close "Request Submitted!" success dialog
- **Actions**:
  1. Try to click "Yes" button (ignore if fails)
  2. Wait for dialog with "Request Submitted!"
  3. Click OK button

#### `confirmVisibleDialog(page, buttonPattern, remark?)`
- **Purpose**: Confirm action in visible dialog
- **Parameters**:
  - `buttonPattern`: Regex to match confirm button
  - `remark?`: Optional text to fill in remark field
- **Actions**:
  1. Find first visible dialog
  2. If remark provided and textbox visible: Fill it
  3. Click button matching pattern

#### `expectNotificationMessage(page, message)`
- **Purpose**: Verify notification message appears
- **Actions**: Expect last occurrence of message text to be visible (timeout: 15000ms)

### Table (`table.helper.ts`)

#### `findTableRowByTexts(page, texts)`
- **Purpose**: Find table row containing all specified texts
- **Parameters**: Array of strings or regex patterns
- **Actions**:
  1. Get all non-header rows
  2. Filter by each text sequentially
  3. If not visible, try previous page
  4. Expect first match visible (timeout: 15000ms)
- **Returns**: First matching row locator

#### `clickRowAction(row, action)`
- **Purpose**: Click action button in table row
- **Parameters**: `action` = 'edit' | 'delete' | 'approve' | 'reject'
- **Actions**:
  1. Scroll row into view
  2. Hover to reveal actions
  3. Try multiple locator strategies:
     - Button with name matching action
     - Element with aria-label containing action
     - Element with title containing action
     - Text matching exact action
  4. Click first found locator

#### `gotoLastPaginationPage(page, paginationPattern?)`
- **Purpose**: Navigate to last page of paginated results
- **Default Pattern**: `/^[0-9]+$/` (matches page numbers)
- **Actions**:
  1. Find pagination items matching pattern
  2. Click last item
  3. Wait 300ms

#### `expectEmptyState(page, text?)`
- **Purpose**: Verify empty state message
- **Default Text**: "No Data"
- **Actions**: Expect text to be visible (`.nth(1)`)

### Form (`form.helper.ts`)

#### `selectAutocompleteOption(page, fieldName, optionText, dropdownSelector?)`
- **Purpose**: Select option from Ant Design autocomplete/select
- **Parameters**:
  - `fieldName`: Combobox field label
  - `optionText`: Option to select
  - `dropdownSelector`: Default `.ant-select-dropdown:visible .ant-select-item-option`
- **Actions**:
  1. Click combobox field
  2. Fill with option text
  3. Click option by role
  4. If dropdown still visible (Ant Design quirk):
     - Click visible option again for deterministic selection

---

## Common Patterns and Best Practices

### Session Management
1. **Always use `useAnotherAccount: true`** for clean login states
2. **Always sign out** after completing user role actions
3. **Always wait 5000ms** after sign out before next login
4. **Always clear cookies** after sign out: `page.context().clearCookies()`

### 429 Rate Limiting
- **All submissions** use `submitWithRetryOn429()`
- **Automatic wait**: 15 seconds if 429 detected
- **No manual retry needed**: Function handles it

### Duplicate Request Prevention
- **Create**: Checks for existing account number
- **Edit**: Checks for pending edit request
- **Delete**: Checks for pending delete request
- **Message**: "Profile's status is already pending request." or "Incoming profile already exists."

### Validation Patterns
- **Missing required field**: Submit/Save button disabled
- **Invalid format**: Error message + button disabled
- **Trigger validation**: Click another field to trigger blur event

### Ant Design Quirks
- **Dropdown persistence**: May need double-click for selection
- **Notification overlap**: Use `closeNotificationAndClearForm()` to clear
- **Date format**: Always DD/MM/YYYY with Tab to confirm

---

## Test Data Patterns

### Account Numbers
- **Format**: 10-digit string (e.g., "1234567890")
- **Generation**: Random or sequential
- **Display**: May have hyphens in UI (1-2-3-4-5-6-7-8-9-0)

### Remarks
- **Create (Approve)**: "Created by Playwright Incoming approve flow"
- **Create (Reject)**: "Created by Playwright Incoming reject flow"
- **Edit**: "Updated by Playwright Incoming edit flow"
- **Rejection**: "Rejected by automation test"

### Corporate IDs
- Selected from dropdown (first option typically used in tests)

---

## API Endpoints Referenced

### Incoming Profiles
- **GET**: `/corporate-report/v1/incoming-profiles?page={}&size={}&accountNo={}`
- **POST**: `/corporate-report/v1/incoming-profiles` (Create)
- **PUT**: `/corporate-report/v1/incoming-profiles` (Update)
- **DELETE**: `/corporate-report/v1/incoming-profiles?id={}` (Delete)

### Pending Requests
- **GET**: `/corporate-report/v1/incoming-profiles/pending-requests?page={}&size={}`
- **POST**: `/corporate-report/v1/incoming-profiles/pending-requests/approve?id={}`
- **POST**: `/corporate-report/v1/incoming-profiles/pending-requests/reject?id={}`

---

## End of Documentation

All test flows are now fully documented with complete step-by-step details of every action, validation, and API interaction.

