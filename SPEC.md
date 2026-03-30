# Helper Function Specification

เอกสารนี้อธิบาย helper ในโฟลเดอร์ `tests/support/helper` ว่าแต่ละ function ใช้ทำอะไร รับค่าอะไร และควรเรียกใช้อย่างไรจาก test

## 1. วิธี import helper

helper ถูก re-export ผ่าน `tests/support/helper/index.ts` ดังนั้นใน test สามารถ import จาก path กลางได้เลย

```ts
import {
  loginWithMicrosoft,
  signOut,
  createEmailCorporateProfile,
  createIncomingProfile,
  actOnPendingRequest,
} from './support/helper';
```

## 2. Types ที่ใช้กับ helper

### `CorporateProfileData`

ใช้เป็น input ของ helper ที่เกี่ยวกับ `Corporate Profile`

```ts
type CorporateProfileData = {
  corporateId: string;
  thaiName: string;
  englishName: string;
  remark: string;
  sendType: 'SFTP' | 'Email';
  taxId?: string;
  emails?: string[];
};
```

### `IncomingProfileData`

ใช้เป็น input ของ helper ที่เกี่ยวกับ `Incoming Profile`

```ts
type IncomingProfileData = {
  accountNo: string;
  remark: string;
  updatedRemark?: string;
  updatedStatus?: 'Active' | 'Inactive';
};
```

### `PendingRequestOptions`

ใช้เป็น input ของ helper สำหรับ approve/reject รายการใน `Pending Requests`

```ts
type PendingRequestOptions = {
  tab: 'Corporate' | 'Incoming';
  texts: Array<string | RegExp>;
  action: 'approve' | 'reject';
  remark?: string;
};
```

### `TestRunData`

ใช้เป็น output ของ `buildTestRunData()` เพื่อสร้าง test data แบบ dynamic สำหรับทั้ง flow

## 3. Public Helper Functions

ส่วนนี้คือ function ที่ถูก export และควรเรียกใช้จาก test ได้โดยตรง

### `auth.helper.ts`

#### `loginWithMicrosoft(page, options?)`

- หน้าที่: login เข้าระบบผ่าน Microsoft account และรอจนหน้า portal โหลดสำเร็จ
- รับค่า:
  - `page`: Playwright `Page`
  - `options.username?`: email ที่จะใช้ login
  - `options.password?`: password
  - `options.useAnotherAccount?`: ถ้าเป็น `true` จะกด `Use another account` ก่อนกรอกข้อมูล
- ใช้เมื่อ:
  - เริ่ม test
  - สลับจาก creator ไป approver
  - login กลับเข้ามาหลัง sign out
- หมายเหตุ:
  - ถ้าไม่ส่ง `options` จะใช้ creator account จาก `CREDENTIALS`
  - ถ้า `useAnotherAccount` เป็น `false` helper จะกด `Stay signed in`

```ts
await loginWithMicrosoft(page);

await loginWithMicrosoft(page, {
  username: CREDENTIALS.approver,
  useAnotherAccount: true,
});
```

#### `signOut(page)`

- หน้าที่: sign out ออกจากระบบและตรวจสอบว่ากลับไปหน้า login แล้ว
- รับค่า:
  - `page`: Playwright `Page`
- ใช้เมื่อ:
  - จบช่วงทำงานของ creator
  - จบช่วงทำงานของ approver

```ts
await signOut(page);
```

### `data.helper.ts`

#### `buildTestRunData(timestamp?)`

- หน้าที่: สร้าง test data แบบ dynamic จาก timestamp เพื่อหลีกเลี่ยงข้อมูลซ้ำ
- รับค่า:
  - `timestamp?`: number
- คืนค่า:
  - object รูปแบบ `TestRunData`
- ใช้เมื่อ:
  - ต้องเตรียมข้อมูลสำหรับทั้ง flow ก่อนเริ่ม test
- หมายเหตุ:
  - ถ้าไม่ส่งค่า จะใช้ `Date.now()`
  - สร้างทั้งข้อมูล `Corporate Profile` และ `Incoming Profile`
  - มีข้อมูลสำหรับทั้ง create และ update อยู่ใน object เดียว

```ts
const runData = buildTestRunData();

await createEmailCorporateProfile(page, runData.corporateProfiles.email);
await createIncomingProfile(page, runData.incomingProfiles.approved);
```

### `dialog.helper.ts`

#### `closeSuccessDialog(page)`

- หน้าที่: ปิด Ant Design success modal dialog ที่มี title "Request Submitted!" หลัง submit/save
- รับค่า:
  - `page`: Playwright `Page`
- ใช้เมื่อ:
  - หลัง create
  - หลัง edit
  - หลัง action ที่ระบบแสดง modal.success dialog พร้อมปุ่ม `OK`
- หมายเหตุ:
  - ใช้ `getByRole('dialog').filter({ hasText: 'Request Submitted!' })` เพื่อหลีกเลี่ยง strict mode violation
  - จะพยายามกดปุ่ม "Yes" ก่อน (ถ้ามี) แล้วจึงรอ dialog และกด OK
  - Dialog บางตัวอาจมี "Request Submitted!" ปรากฏใน `<div>` และ `<span>` ทำให้เกิด strict mode error ถ้าใช้ `getByText()` โดยตรง

```ts
await closeSuccessDialog(page);
```

#### `confirmVisibleDialog(page, buttonPattern, remark?)`

- หน้าที่: กดยืนยัน dialog ถ้ามี หรือ skip ไปถ้าไม่มี dialog (เช่น approve/reject ที่แสดง notification toast แทน dialog)
- รับค่า:
  - `page`: Playwright `Page`
  - `buttonPattern`: `RegExp` สำหรับปุ่มยืนยัน เช่น approve, reject, save, submit, delete
  - `remark?`: string สำหรับกรอกใน textbox แรกของ dialog
- ใช้เมื่อ:
  - ตอน save
  - ตอน submit
  - ตอน approve/reject (แต่บาง action ไม่มี dialog ก็จะ skip ไป)
  - ตอน delete
- หมายเหตุ:
  - ใช้ `try-catch` และ `waitFor()` timeout 3 วินาที - ถ้า dialog ไม่ขึ้นภายในเวลานั้นจะ return ทันที
  - เหมาะกับ flow ที่บางครั้งมี dialog บางครั้งไม่มี (เช่น approve ที่แสดงแค่ notification toast)

```ts
await confirmVisibleDialog(page, PATTERNS.confirmSave);
await confirmVisibleDialog(page, PATTERNS.confirmReject, 'Rejected by test');
```

### `form.helper.ts`

#### `selectAutocompleteOption(page, fieldName, optionText)`

- หน้าที่: ใช้กับ field แบบ combobox/autocomplete โดยคลิก field พิมพ์ค่า และเลือก option ที่ตรงกัน
- รับค่า:
  - `page`: Playwright `Page`
  - `fieldName`: label ของ field
  - `optionText`: ข้อความของ option ที่ต้องการเลือก
- ใช้เมื่อ:
  - search หรือ fill ฟอร์มที่ใช้ autocomplete
- ตอนนี้ถูกใช้ใน `searchCorporateProfile()`

```ts
await selectAutocompleteOption(page, UI_TEXT.fields.searchCorporateId, corporateId);
```

#### `selectFirstIncomingCorporateId(page)`

- หน้าที่: เปิด dropdown ของ `Incoming Profile` แล้วเลือก option แรกที่มองเห็นได้
- รับค่า:
  - `page`: Playwright `Page`
- ใช้เมื่อ:
  - สร้าง `Incoming Profile`
- หมายเหตุ:
  - function นี้ไม่ได้เลือกจาก text ที่ระบุเอง แต่เลือกตัวแรกของ dropdown

```ts
await selectFirstIncomingCorporateId(page);
```

### `navigation.helper.ts`

#### `openCorporateProfiles(page)`

- หน้าที่: เปิดเมนู `Corporate Report > Corporate Profiles` และ assert URL/ข้อความบนหน้า
- รับค่า:
  - `page`: Playwright `Page`
- ใช้เมื่อ:
  - ก่อน create/search/edit/delete corporate profile

```ts
await openCorporateProfiles(page);
```

#### `openIncomingProfiles(page)`

- หน้าที่: เปิดเมนู `Corporate Report > Incoming Profiles` และ assert URL/ข้อความบนหน้า
- รับค่า:
  - `page`: Playwright `Page`
- ใช้เมื่อ:
  - ก่อน create/search/edit/delete incoming profile

```ts
await openIncomingProfiles(page);
```

#### `openPendingRequests(page, tab?)`

- หน้าที่: เปิดเมนู `Corporate Report > Pending Requests` และเลือก tab ที่ต้องการ
- รับค่า:
  - `page`: Playwright `Page`
  - `tab?`: `'Corporate' | 'Incoming'`
- ใช้เมื่อ:
  - ก่อน approve หรือ reject request
- หมายเหตุ:
  - ถ้าไม่ส่ง `tab` จะใช้ `Corporate`

```ts
await openPendingRequests(page);
await openPendingRequests(page, 'Incoming');
```

### `table.helper.ts`

#### `gotoLastPaginationPage(page)`

- หน้าที่: ถ้าหน้ามี pagination จะคลิกหน้าสุดท้ายแล้วรอ 1 วินาที
- รับค่า:
  - `page`: Playwright `Page`
- ใช้เมื่อ:
  - ตอนต้องไปหา request ล่าสุดใน `Pending Requests`
- หมายเหตุ:
  - ถ้าไม่มี pagination function จะไม่ทำอะไร

```ts
await gotoLastPaginationPage(page);
```

#### `tableRows(page)`

- หน้าที่: คืนค่า locator ของ row ในตาราง โดยตัด header row ที่มี `th` ออก
- รับค่า:
  - `page`: Playwright `Page`
- คืนค่า:
  - Playwright `Locator`
- ใช้เมื่อ:
  - ต้องการเอา locator row ไป filter ต่อเอง

```ts
const rows = tableRows(page);
await expect(rows.first()).toBeVisible();
```

#### `findTableRowByTexts(page, texts)`

- หน้าที่: หา row แรกที่มีข้อความครบทุกตัวใน array `texts`
- รับค่า:
  - `page`: Playwright `Page`
  - `texts`: array ของ `string` หรือ `RegExp`
- คืนค่า:
  - row locator ตัวแรกที่ตรงเงื่อนไข
- ใช้เมื่อ:
  - หา row ก่อนกด edit/delete/approve/reject
  - หา row เพื่อ assert ข้อมูลหลัง update
- หมายเหตุ:
  - function นี้ใช้การ filter ต่อเนื่องทีละ text
  - ถ้าไม่พบ row ที่ visible ภายในเวลาที่กำหนด จะ fail

```ts
const row = await findTableRowByTexts(page, [
  runData.corporateProfiles.email.corporateId,
  runData.corporateProfiles.email.updatedRemark,
]);
```

#### `clickRowAction(row, action)`

- หน้าที่: กด action ภายใน row เช่น `edit`, `delete`, `approve`, `reject`
- รับค่า:
  - `row`: Playwright `Locator` ของแถวที่ต้องการ
  - `action`: `'edit' | 'delete' | 'approve' | 'reject'`
- ใช้เมื่อ:
  - ต้องกดปุ่ม action ในตาราง
- หมายเหตุ:
  - helper จะลองหา action หลายรูปแบบ เช่น role button, `aria-label`, `title`, หรือ text
  - ถ้าไม่เจอเลยจะ throw error

```ts
const row = await findTableRowByTexts(page, ['EMAIL-123']);
await clickRowAction(row, 'edit');
```

### `corporate-profile.helper.ts`

#### `createSftpCorporateProfile(page, profile)`

- หน้าที่: สร้าง `Corporate Profile` แบบ `SFTP`
- รับค่า:
  - `page`: Playwright `Page`
  - `profile`: `CorporateProfileData`
- ใช้เมื่อ:
  - ต้องการสร้าง profile แบบส่งผ่าน SFTP
- หมายเหตุ:
  - helper จะเปิดหน้า add form ให้เอง
  - ใช้เฉพาะ field พื้นฐานของ corporate profile

```ts
await createSftpCorporateProfile(page, runData.corporateProfiles.sftp);
```

#### `createEmailCorporateProfile(page, profile)`

- หน้าที่: สร้าง `Corporate Profile` แบบ `Email`
- รับค่า:
  - `page`: Playwright `Page`
  - `profile`: `CorporateProfileData`
- ใช้เมื่อ:
  - ต้องการสร้าง profile ที่มี email recipients
- หมายเหตุ:
  - helper จะเลือก `Send Type = Email`
  - ถ้ามี `taxId` จะกรอกให้
  - ถ้ามี `emails` จะใส่ทุกค่าแล้วกด Enter ทีละรายการ
  - helper จะ check `Round 1 (09.00)` ให้

```ts
await createEmailCorporateProfile(page, runData.corporateProfiles.email);
```

#### `searchCorporateProfile(page, corporateId)`

- หน้าที่: เปิดหน้า `Corporate Profiles`, เลือก `Corporate ID` ใน autocomplete แล้วกด search
- รับค่า:
  - `page`: Playwright `Page`
  - `corporateId`: string
- ใช้เมื่อ:
  - ก่อน edit
  - ก่อน delete
  - ก่อน verify row

```ts
await searchCorporateProfile(page, runData.corporateProfiles.email.corporateId);
```

#### `editCorporateProfile(page, options)`

- หน้าที่: ค้นหารายการ corporate, เปิด form แก้ไข, เปลี่ยนชื่ออังกฤษและ remark, จากนั้น save และยืนยัน dialog
- รับค่า:
  - `page`: Playwright `Page`
  - `options.corporateId`: corporate id ที่ใช้ search
  - `options.rowTexts`: ข้อความที่ใช้หา row เป้าหมาย
  - `options.englishName`: ชื่ออังกฤษใหม่
  - `options.remark`: remark ใหม่
- ใช้เมื่อ:
  - แก้ไข corporate profile ที่ถูกอนุมัติแล้ว
- หมายเหตุ:
  - helper นี้ไม่ได้ approve การแก้ไขให้เอง แค่สร้าง update request

```ts
await editCorporateProfile(page, {
  corporateId: runData.corporateProfiles.email.corporateId,
  rowTexts: [
    runData.corporateProfiles.email.corporateId,
    runData.corporateProfiles.email.englishName,
    runData.corporateProfiles.email.remark,
  ],
  englishName: runData.corporateProfiles.email.updatedEnglishName,
  remark: runData.corporateProfiles.email.updatedRemark,
});
```

#### `deleteCorporateProfile(page, options)`

- หน้าที่: ค้นหารายการ corporate, กด delete, ยืนยัน dialog แล้วรอให้ request ถูกสร้าง
- รับค่า:
  - `page`: Playwright `Page`
  - `options.corporateId`: corporate id ที่ใช้ search
  - `options.rowTexts`: ข้อความที่ใช้หา row เป้าหมาย
- ใช้เมื่อ:
  - ลบ corporate profile ที่ถูกอนุมัติแล้ว
- หมายเหตุ:
  - helper นี้ไม่ได้ตรวจสอบผลลบปลายทางเอง
  - helper นี้ไม่ได้ approve delete request ให้เอง

```ts
await deleteCorporateProfile(page, {
  corporateId: runData.corporateProfiles.email.corporateId,
  rowTexts: [
    runData.corporateProfiles.email.corporateId,
    runData.corporateProfiles.email.updatedRemark,
  ],
});
```

### `incoming-profile.helper.ts`

#### `createIncomingProfile(page, profile)`

- หน้าที่: สร้าง `Incoming Profile`
- รับค่า:
  - `page`: Playwright `Page`
  - `profile`: `IncomingProfileData`
- ใช้เมื่อ:
  - สร้าง incoming profile ใหม่
- หมายเหตุ:
  - helper จะเลือก corporate id ตัวแรกใน dropdown
  - helper จะใช้วันที่ปัจจุบันในรูปแบบ `dd/mm/yyyy`
  - หลัง submit จะรอกลับมาที่หน้า list แล้วปิด success dialog

```ts
await createIncomingProfile(page, runData.incomingProfiles.approved);
```

#### `searchIncomingProfile(page, accountNo)`

- หน้าที่: เปิดหน้า `Incoming Profiles`, กรอก `Allow Account` แล้วกด search
- รับค่า:
  - `page`: Playwright `Page`
  - `accountNo`: string
- ใช้เมื่อ:
  - ก่อน edit
  - ก่อน delete
  - ก่อน verify row

```ts
await searchIncomingProfile(page, runData.incomingProfiles.approved.accountNo);
```

#### `editIncomingProfile(page, options)`

- หน้าที่: ค้นหารายการ incoming, เปิด form แก้ไข, เปลี่ยน status และ remark, จากนั้น submit และยืนยัน dialog
- รับค่า:
  - `page`: Playwright `Page`
  - `options.accountNo`: account no ที่ใช้ search
  - `options.rowTexts`: ข้อความที่ใช้หา row เป้าหมาย
  - `options.status`: `'Active' | 'Inactive'`
  - `options.remark`: remark ใหม่
- ใช้เมื่อ:
  - แก้ไข incoming profile ที่ถูกอนุมัติแล้ว
- หมายเหตุ:
  - helper นี้สร้าง update request เท่านั้น ยังไม่ approve ให้เอง

```ts
await editIncomingProfile(page, {
  accountNo: runData.incomingProfiles.approved.accountNo,
  rowTexts: [runData.incomingProfiles.approved.remark],
  status: 'Inactive',
  remark: runData.incomingProfiles.approved.updatedRemark!,
});
```

#### `deleteIncomingProfile(page, options)`

- หน้าที่: ค้นหารายการ incoming, กด delete, ยืนยัน dialog และรอให้ request ถูกสร้าง
- รับค่า:
  - `page`: Playwright `Page`
  - `options.accountNo`: account no ที่ใช้ search
  - `options.rowTexts`: ข้อความที่ใช้หา row เป้าหมาย
- ใช้เมื่อ:
  - ลบ incoming profile ที่ถูกอนุมัติแล้ว

```ts
await deleteIncomingProfile(page, {
  accountNo: runData.incomingProfiles.approved.accountNo,
  rowTexts: [
    runData.incomingProfiles.approved.updatedRemark!,
    runData.incomingProfiles.approved.updatedStatus!,
  ],
});
```

### `pending-request.helper.ts`

#### `actOnPendingRequest(page, options)`

- หน้าที่: เปิด `Pending Requests`, ไปหน้าท้ายสุด, หา row เป้าหมาย แล้วกด approve หรือ reject
- รับค่า:
  - `page`: Playwright `Page`
  - `options.tab`: `'Corporate' | 'Incoming'`
  - `options.texts`: ข้อความที่ใช้หา row
  - `options.action`: `'approve' | 'reject'`
  - `options.remark?`: ใช้ตอน reject หรือกรณี dialog ต้องการข้อความเพิ่ม
- ใช้เมื่อ:
  - approver ต้องจัดการ create/update/delete request
- หมายเหตุ:
  - action link อยู่ใน Actions column ของแต่ละ row (ใช้ `getByRole('link')` เพราะเป็น `<a>` tag ไม่ใช่ `<button>`)
  - ต้อง scope locator ให้อยู่ใน row เดียวกันเพื่อหลีกเลี่ยง strict mode violation
  - หลังกด approve/reject จะแสดง notification toast (ไม่ใช่ modal dialog) ดังนั้นใช้ `waitForLoadState('networkidle')` แทนการปิด dialog
  - ถ้า `action` เป็น `reject` ควรส่ง `remark`

```ts
await actOnPendingRequest(page, {
  tab: 'Corporate',
  texts: [
    runData.corporateProfiles.email.corporateId,
    runData.corporateProfiles.email.remark,
  ],
  action: 'approve',
});

await actOnPendingRequest(page, {
  tab: 'Incoming',
  texts: [runData.incomingProfiles.rejected.remark],
  action: 'reject',
  remark: 'Rejected by automated test',
});
```

## 4. Internal Helper Functions

ส่วนนี้คือ function ที่อยู่ในไฟล์ helper แต่ไม่ได้ export ออกมา ใช้เป็นชั้นย่อยเพื่อประกอบ public helper ด้านบน ไม่ควร import มาใช้ตรงจาก test

### `corporate-profile.helper.ts`

#### `openCorporateProfileAddForm(page)`

- หน้าที่: เปิดหน้า `Corporate Profiles`, กด `Add New`, แล้ว assert ว่า heading ของ form แสดงอยู่
- ถูกใช้โดย:
  - `createSftpCorporateProfile()`
  - `createEmailCorporateProfile()`

#### `fillCorporateProfileBaseFields(page, profile)`

- หน้าที่: กรอก field พื้นฐานของ corporate profile
  - `Corporate ID`
  - `Corporate Name (Thai)`
  - `Corporate Name (English)`
  - `Remark`
- ถูกใช้โดย:
  - `createSftpCorporateProfile()`
  - `createEmailCorporateProfile()`

#### `submitCorporateProfile(page)`

- หน้าที่: ตรวจว่าปุ่ม submit ใช้งานได้ แล้วกด submit
- ถูกใช้โดย:
  - `createSftpCorporateProfile()`
  - `createEmailCorporateProfile()`

### `incoming-profile.helper.ts`

#### `todayAsDdMmYyyy()`

- หน้าที่: คืนค่าวันปัจจุบันในรูปแบบ `dd/mm/yyyy`
- ถูกใช้โดย:
  - `createIncomingProfile()`

#### `openIncomingProfileAddForm(page)`

- หน้าที่: เปิดหน้า `Incoming Profiles`, กด `Add New`, แล้ว assert ว่า heading ของ form แสดงอยู่
- ถูกใช้โดย:
  - `createIncomingProfile()`

#### `submitIncomingProfile(page)`

- หน้าที่: ตรวจว่าปุ่ม submit ใช้งานได้ แล้วกด submit
- ถูกใช้โดย:
  - `createIncomingProfile()`

## 5. Helper ที่ใช้บ่อยใน flow จริง

ตัวอย่างลำดับการใช้ helper แบบเดียวกับ test หลัก ซึ่งปัจจุบันครอบด้วย `test.step` และใช้ `page` ตัวเดียวกันแบบรันต่อเนื่อง:

```ts
test('Corporate Report flow', async ({ page }) => {
  const runData = buildTestRunData();

  await test.step('Part 1: Creator creates profiles', async () => {
    await loginWithMicrosoft(page);
    await createSftpCorporateProfile(page, runData.corporateProfiles.sftp);
    await createEmailCorporateProfile(page, runData.corporateProfiles.email);
    await createIncomingProfile(page, runData.incomingProfiles.approved);
    await signOut(page);
  });

  await test.step('Part 2: Approver approves requests', async () => {
    await loginWithMicrosoft(page, {
      username: CREDENTIALS.approver,
      useAnotherAccount: true,
    });
    
    await actOnPendingRequest(page, {
      tab: 'Corporate',
      texts: [
        runData.corporateProfiles.email.corporateId,
        runData.corporateProfiles.email.remark,
      ],
      action: 'approve',
    });
    await signOut(page);
  });
});
```

## 6. สรุปแนวทางใช้งาน

- ถ้าต้องการ login/logout ใช้ `loginWithMicrosoft()` และ `signOut()`
- ถ้าต้องการข้อมูลทดสอบแบบไม่ชนกัน ใช้ `buildTestRunData()`
- ถ้าต้องการสร้างหรือแก้ไข `Corporate Profile` ใช้ helper ใน `corporate-profile.helper.ts`
- ถ้าต้องการสร้างหรือแก้ไข `Incoming Profile` ใช้ helper ใน `incoming-profile.helper.ts`
- ถ้าต้องการ approve/reject request ใช้ `actOnPendingRequest()`
- ถ้าต้องการหา row หรือกด action ในตาราง ใช้ helper ใน `table.helper.ts`
- ถ้าต้องการเปิดหน้าตามเมนู ใช้ helper ใน `navigation.helper.ts`
- ถ้าต้องการจัดการ dialog ใช้ helper ใน `dialog.helper.ts`

## 7. Technical Notes & Bug Fixes

### 7.1 Form Validation และ Submit Button

**ปัญหา:** ปุ่ม Submit ใน Corporate Profile creation form ยังคง disabled อยู่แม้จะกรอกฟอร์มครบแล้ว

**สาเหตุ:**
- Ant Design form ใช้ `disabled={loading || !submittable}` โดย `submittable` จะเป็น true ก็ต่อเมื่อฟอร์มมีการเปลี่ยนแปลงและ validate ผ่าน
- การใช้ `Promise.all()` เพื่อ fill หลาย field พร้อมกันอาจทำให้ form change detection ไม่ทำงาน
- การไม่ได้คลิก radio button (SFTP/Email) อย่างชัดเจนทำให้ form ไม่ detect การเปลี่ยนแปลง

**วิธีแก้:**
1. เปลี่ยนจาก parallel fill (`Promise.all`) เป็น sequential fill
2. คลิก radio button (SFTP หรือ Email) อย่างชัดเจนเพื่อ trigger form validation
3. รอให้ submit button เป็น enabled ด้วย `toBeEnabled({ timeout: 10000 })`

```ts
// ❌ ก่อนแก้ - parallel fill
await Promise.all([
  page.getByRole('textbox', { name: 'Corporate ID' }).fill(id),
  page.getByRole('textbox', { name: 'Thai Name' }).fill(thai),
]);

// ✅ หลังแก้ - sequential fill + explicit radio click
await page.getByRole('textbox', { name: 'Corporate ID' }).fill(id);
await page.getByRole('textbox', { name: 'Thai Name' }).fill(thai);
await page.locator('label').filter({ hasText: /sFTP/i }).click();
await expect(submitButton).toBeEnabled({ timeout: 10000 });
```

### 7.2 Strict Mode Violations

**ปัญหา:** Playwright ขึ้น error "strict mode violation: ... resolved to 2 elements"

**กรณีที่พบ:**
1. `getByText('Request Submitted!')` match ทั้ง `<div>` และ `<span>` ใน Ant Design modal
2. `getByRole('button', { name: 'Approve' })` เมื่อมีหลาย row ที่มีปุ่ม Approve

**วิธีแก้:**
1. ใช้ `getByRole('dialog').filter({ hasText: '...' })` สำหรับ modal
2. Scope locator ลงไปที่ row level: `row.getByRole('link', { name: /approve/i })`

```ts
// ❌ Strict mode violation
await page.getByText('Request Submitted!').waitFor();

// ✅ ใช้ role + filter
const dialog = page.getByRole('dialog').filter({ hasText: 'Request Submitted!' });
await dialog.waitFor({ state: 'visible' });
```

### 7.3 Modal vs Notification Toast

**ปัญหา:** สับสนระหว่าง `modal.success` dialog และ `notification.success` toast

**คำอธิบาย:**
- **`modal.success`**: แสดง dialog ที่ต้องกด OK เพื่อปิด (ใช้ใน create/edit flow)
- **`notification.success`**: แสดง toast ที่หายไปเองโดยอัตโนมัติ (ใช้ใน approve/reject flow)

**วิธีแก้:**
- Create/Edit: รอ URL navigation แล้วใช้ `closeSuccessDialog()`
- Approve/Reject: ใช้ `waitForLoadState('networkidle')` แทนการปิด dialog
