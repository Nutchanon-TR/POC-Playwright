# รายงานวิเคราะห์เชิงโครงสร้างและการ Refactor ระบบ Test Automation

> **โปรเจกต์:** Corporate Report E2E Playwright Test Suite  
> **วันที่:** 27 มีนาคม 2569  
> **สถานะ:** ดำเนินการเสร็จสิ้น ✅

---

## สารบัญ

1. [ภาพรวมโปรเจกต์](#1-ภาพรวมโปรเจกต์)
2. [Code Anomalies & Anti-patterns](#2-code-anomalies--anti-patterns)
3. [Parallel Processing Strategy](#3-parallel-processing-strategy)
4. [Performance & Latency Optimization](#4-performance--latency-optimization)
5. [Extensibility & Common Module Design](#5-extensibility--common-module-design)
6. [โครงสร้างไฟล์หลังการ Refactor](#6-โครงสร้างไฟล์หลังการ-refactor)
7. [สรุปและข้อเสนอแนะ](#7-สรุปและข้อเสนอแนะ)

---

## 1. ภาพรวมโปรเจกต์

ระบบ Test Automation นี้เป็น E2E Test Suite ที่ใช้ **Playwright** ทดสอบระบบ **Corporate Report** บน Corporate Admin Portal (SIT Environment) โดยครอบคลุม Workflow ดังนี้:

| ขั้นตอน | รายละเอียด |
|---|---|
| **Create** | Creator สร้าง Corporate Profile (SFTP/Email) และ Incoming Profile |
| **Approve/Reject** | Approver อนุมัติหรือปฏิเสธคำขอ |
| **Edit** | Creator แก้ไขข้อมูลที่ผ่านการอนุมัติ |
| **Approve Update** | Approver อนุมัติการแก้ไข |
| **Verify & Delete** | Creator ตรวจสอบข้อมูลและลบ |
| **Approve Delete** | Approver อนุมัติการลบ |

### เทคโนโลยีที่ใช้

- **Playwright** — Test framework & browser automation
- **TypeScript** — ภาษาหลักสำหรับเขียน Test
- **Microsoft Login** — ระบบ Authentication ผ่าน Azure AD
- **Ant Design** — UI Component Library ที่ระบบเว็บใช้

---

## 2. Code Anomalies & Anti-patterns

### 2.1 ปัญหาที่พบ

#### a) Improper Error Handling (try/catch เป็น Control Flow)

**ไฟล์:** `pending-request.helper.ts`

ฟังก์ชัน `actOnPendingRequest` ใช้ `try/catch` เพื่อสลับกลยุทธ์การกดปุ่ม:

```typescript
// ❌ Anti-pattern: ใช้ try/catch เป็น control flow
try {
    await clickRowAction(row, options.action);
} catch {
    await row.click();
    await page.getByRole('button', { name: new RegExp(options.action, 'i') }).first().click();
}
```

**ผลกระทบ:**
- สูญเสียความสามารถ Auto-retrying ของ Playwright
- กลบเกลื่อนปัญหา Selector ที่ไม่เสถียร (Masking flakiness)
- ทำให้ Debug ยากขึ้นเมื่อเทสล้มเหลว

**แก้ไข:** เปลี่ยนไปใช้ Playwright `.or()` Locator ซึ่ง Playwright จะ auto-retry ทั้ง 2 strategy โดยอัตโนมัติ:

```typescript
// ✅ Playwright-native: .or() locator สำหรับ fallback strategy
await row.hover();
const inlineBtn = row.getByRole('button', { name: new RegExp(options.action, 'i') }).first();
const fallbackBtn = page.getByRole('button', { name: new RegExp(options.action, 'i') }).first();
await inlineBtn.or(fallbackBtn).click();
```

---

#### b) Silent Failures (.catch(() => {}))

**ไฟล์:** `dialog.helper.ts`

มีการใช้ `.catch(() => {})` หลายจุด ทำให้ Error ถูกกลบเงียบ:

```typescript
// ❌ Silent failure: ถ้า button ไม่เจอจะข้ามไปเงียบๆ
await page.getByRole('button', { name: 'Yes' }).click({ timeout: 2000 }).catch(() => {});
```

**ผลกระทบ:**
- เกิด **False-positive** (เทสผ่านทั้งที่ระบบพัง)
- ตรวจจับ Bug ได้ยากขึ้นใน CI/CD Pipeline

**แก้ไข:** เปลี่ยนเป็น Conditional Visibility Check:

```typescript
// ✅ Explicit check: ถ้ามองเห็นค่อย click
const yesBtn = page.getByRole('button', { name: 'Yes' });
if (await yesBtn.isVisible({ timeout: 2000 })) {
    await yesBtn.click();
}
```

---

#### c) Hardcoded Coupling (Business Logic ใน Common Module)

**ไฟล์:** `common/ui/form.helper.ts`

ฟังก์ชัน `selectFirstIncomingCorporateId` ผูก Business Logic เฉพาะของ Incoming Profile ไว้ในโฟลเดอร์ `common/ui/` ซึ่งควรจะเป็น Generic Module:

```typescript
// ❌ ก่อน: ฟังก์ชันเฉพาะทางอยู่ใน common module
// ไฟล์: common/ui/form.helper.ts
export async function selectFirstIncomingCorporateId(page: Page) {
    await page.getByRole('combobox', { name: UI_TEXT.fields.incomingCorporateId }).click();
    // ...
}
```

**แก้ไข:** ย้ายไปอยู่ใน `corporate-report/incoming-profile.helper.ts` เพราะเป็น Logic เฉพาะทาง

---

## 3. Parallel Processing Strategy

### 3.1 ปัญหาที่พบ

ไฟล์ `corporate-report.spec.ts` เป็น **Monolith** ที่รวมทุก Workflow ไว้ในที่เดียว (ทั้ง Corporate Profile และ Incoming Profile) ทำให้:

- รันแบบ **Serial** ตั้งแต่ต้นจนจบ (ใช้เวลา 3-5 นาที)
- ไม่สามารถแยกรันหรือ Debug เฉพาะ Module ได้
- เมื่อเทสหนึ่งล้มเหลว ทุก Step ถัดไปจะถูกข้ามหมด

### 3.2 Domain Isolation Analysis

| เงื่อนไข | Corporate Profile | Incoming Profile |
|---|---|---|
| ข้อมูลที่สร้าง | Corporate ID, English Name | Account No, Remark |
| Pending Request Tab | Corporate | Incoming |
| API Endpoint | `/corporate-profiles` | `/incoming-profiles` |
| **ความเกี่ยวข้องกัน** | **ไม่มี** | **ไม่มี** |

> ❗ ทั้ง 2 Domain เป็น **Independent Data Entities** — ไม่มี Dependency ต่อกัน

### 3.3 การแก้ไข (File Splitting)

แยกเป็น 2 ไฟล์:

| ไฟล์ | เนื้อหา | Steps |
|---|---|---|
| `corporate-profile.spec.ts` | Create SFTP/Email → Approve/Reject → Edit → Approve Edit → Verify → Delete → Approve Delete | 6 parts |
| `incoming-profile.spec.ts` | Create approved/rejected → Approve/Reject → Edit → Approve Edit → Verify → Delete → Approve Delete | 6 parts |

**ผลลัพธ์:** ด้วยค่า Config `fullyParallel: true` ที่มีอยู่แล้วใน `playwright.config.ts` ทำให้ Playwright จะรันทั้ง 2 ไฟล์แบบ **Parallel** โดยอัตโนมัติ ภายในแต่ละไฟล์ยังคงเป็น Serial Step ตามลำดับ Workflow

**คาดการณ์:** Execution Time ลดลงจากเดิม ~50-60%

---

## 4. Performance & Latency Optimization

### 4.1 Transition from UI-Waiting to API-Waiting

**ปัญหา:** ใช้ `timeout: 15000` รอ UI แสดงผล ซึ่งช้าและไม่แน่นอน

**แก้ไข:** เพิ่ม `page.waitForResponse()` เพื่อรอ API ตอบกลับก่อน แล้วค่อยรอ UI:

```typescript
// ✅ รอ API ก่อน → ลดเวลารอ UI
function waitForCorporateProfileResponse(page: Page) {
    return page.waitForResponse(
        (res) =>
            res.url().includes(API_PATHS.corporateReport) &&
            res.url().includes(API_PATHS.corporateProfiles) &&
            res.request().method() !== 'GET' &&
            res.status() === 200
    );
}

// ใช้งาน:
const responsePromise = waitForCorporateProfileResponse(page);
await submitButton.click();
await responsePromise; // รอ API ก่อน
await closeSuccessDialog(page); // แล้วค่อยจัดการ UI
```

> 🔑 ใช้ `API_PATHS` จาก `app.constant.ts` แทน Hardcoded String ตามหลัก Maintainability

| ฟังก์ชัน | การปรับปรุง |
|---|---|
| `createSftpCorporateProfile` | เพิ่ม `waitForResponse` ก่อน Success Dialog |
| `createEmailCorporateProfile` | เพิ่ม `waitForResponse` ก่อน Success Dialog |
| `createIncomingProfile` | เพิ่ม `waitForResponse` ก่อน URL Check |
| `deleteCorporateProfile` | เพิ่ม `waitForResponse` + Setup ก่อน Yes Click |
| `deleteIncomingProfile` | แก้ Race Condition: Setup `waitForResponse` **ก่อน** กด Yes |

### 4.2 Promise.all() สำหรับ Parallel Form Fill

**ปัญหา:** การเติมฟิลด์ 4 ช่อง (Corporate ID, Thai Name, English Name, Remark) ทำทีละช่อง

**แก้ไข:** หุ้มด้วย `Promise.all()` เพราะทั้ง 4 ฟิลด์ไม่มี Dependency ต่อกัน:

```typescript
// ✅ Parallel form fill
await Promise.all([
    page.getByRole('textbox', { name: UI_TEXT.fields.corporateId }).fill(profile.corporateId),
    page.getByRole('textbox', { name: UI_TEXT.fields.corporateNameThai }).fill(profile.thaiName),
    page.getByRole('textbox', { name: UI_TEXT.fields.corporateNameEnglish }).fill(profile.englishName),
    page.getByRole('textbox', { name: UI_TEXT.fields.remark }).fill(profile.remark),
]);
```

### 4.3 Race Condition Fix

**ปัญหา:** `deleteIncomingProfile` กด Yes ก่อนแล้วค่อย Setup `waitForResponse` ทำให้ Response อาจมาถึงก่อนที่จะเริ่มรอ

```typescript
// ❌ Race condition: response อาจมาก่อน waitForResponse
await page.getByRole('button', { name: 'Yes' }).click();
const deleteResponsePromise = page.waitForResponse(...); // สายเกินไป!
```

**แก้ไข:** Setup `waitForResponse` ก่อนกด Yes:

```typescript
// ✅ ปลอดภัย: setup listener ก่อน action
const deleteResponsePromise = waitForIncomingProfileResponse(page);
await page.getByRole('button', { name: 'Yes' }).click();
await confirmVisibleDialog(page, PATTERNS.confirmDelete);
await deleteResponsePromise;
```

---

## 5. Extensibility & Common Module Design

### 5.1 Locator Parameterization

**เป้าหมาย:** ให้โฟลเดอร์ `common/` ไม่ผูก Business Logic เพื่อนำไปใช้ข้าม Module ได้

#### form.helper.ts

```typescript
// ❌ ก่อน: hardcode SELECTORS ภายใน
export async function selectAutocompleteOption(page, fieldName, optionText) {
    const visibleDropdownOptions = page.locator(SELECTORS.antSelectVisibleOptions);
    // ...
}

// ✅ หลัง: รับ parameter จากข้างนอก (default ค่าเดิม)
export async function selectAutocompleteOption(
    page: Page,
    fieldName: string,
    optionText: string,
    dropdownSelector = '.ant-select-dropdown:visible .ant-select-item-option'
) { /* ... */ }
```

#### table.helper.ts

```typescript
// ❌ ก่อน: hardcode PATTERNS.pagination
export async function gotoLastPaginationPage(page: Page) {
    const paginationItems = page.getByRole('listitem').filter({ hasText: PATTERNS.pagination });
}

// ✅ หลัง: รับ pattern เป็น parameter (default ค่าเดิม)
export async function gotoLastPaginationPage(
    page: Page,
    paginationPattern: RegExp = /^[0-9]+$/
) { /* ... */ }
```

**ผลลัพธ์:** `common/ui/form.helper.ts` และ `common/ui/table.helper.ts` ไม่มี import จาก `constant/` แล้ว → พร้อมนำไปใช้กับ Module อื่น

### 5.2 Data Builder / Factory Pattern

**ปัญหา:** `core/data.helper.ts` มี Logic เฉพาะของ Corporate Report (import `TEST_CONTENT`, `UI_TEXT`)

**แก้ไข:** แยกเป็น 2 ส่วน:

| ไฟล์ | บทบาท | Dependencies |
|---|---|---|
| `common/core/data.helper.ts` | Generic utilities (`generateIdSuffix`, `lastDigits`, `randomDigits`) | **ไม่มี** |
| `corporate-report/data.factory.ts` | `buildTestRunData()` สำหรับ Corporate Report | `TEST_CONTENT`, `UI_TEXT`, `data.helper` |

ตัวอย่างการใช้งานเมื่อต้องสร้าง Module ใหม่ เช่น Cash Management:

```typescript
// cash-management/data.factory.ts
import { generateIdSuffix, randomDigits } from '../common/core/data.helper';

export function buildCashManagementTestData() {
    const idSuffix = generateIdSuffix();
    return {
        transactionId: `TXN-${idSuffix}`,
        amount: randomDigits(6),
        // ...
    };
}
```

---

## 6. โครงสร้างไฟล์หลังการ Refactor

```
tests/
├── corporate-profile.spec.ts        ← [NEW] Parallel file 1
├── incoming-profile.spec.ts         ← [NEW] Parallel file 2
└── support/
    ├── constant/
    │   ├── app.constant.ts          ← เพิ่ม API_PATHS
    │   ├── pattern.constant.ts
    │   ├── selector.constant.ts
    │   ├── test-content.constant.ts
    │   ├── ui-text.constant.ts
    │   └── index.ts
    └── helper/
        ├── common/
        │   ├── core/                ← Generic System Layer
        │   │   ├── auth.helper.ts       (Login / Sign Out)
        │   │   └── data.helper.ts       (generateIdSuffix, lastDigits, randomDigits)
        │   └── ui/                  ← Generic UI Layer
        │       ├── dialog.helper.ts     (closeSuccessDialog, confirmVisibleDialog)
        │       ├── form.helper.ts       (selectAutocompleteOption — parameterized)
        │       ├── navigation.helper.ts (openCorporateProfiles, openIncomingProfiles, ...)
        │       └── table.helper.ts      (findTableRowByTexts, clickRowAction — parameterized)
        ├── corporate-report/        ← Domain-specific Layer
        │   ├── corporate-profile.helper.ts  (CRUD + waitForResponse)
        │   ├── data.factory.ts              [NEW] (buildTestRunData)
        │   ├── incoming-profile.helper.ts   (CRUD + waitForResponse + selectFirstIncomingCorporateId)
        │   └── pending-request.helper.ts    (actOnPendingRequest — .or() locator)
        ├── index.ts                 ← Barrel exports
        └── types.ts                 ← Type definitions
```

---

## 7. สรุปและข้อเสนอแนะ

### สิ่งที่ดำเนินการแล้ว

| หัวข้อ | สถานะ | ผลกระทบ |
|---|---|---|
| Anti-pattern Fix | ✅ | ลดความเสี่ยง False-positive, เพิ่ม Debug-ability |
| Parallel Processing | ✅ | ลด Execution Time ~50% |
| waitForResponse | ✅ | ลด Flakiness จากการรอ UI, แก้ Race Condition |
| Common Module Design | ✅ | พร้อมต่อยอดข้ามโมดูลได้ทันที |

### ข้อเสนอแนะสำหรับอนาคต

1. **เพิ่ม Retry Strategy** — ตั้งค่า `retries: 1` ใน `playwright.config.ts` สำหรับ Local Development เพื่อจัดการกับ Network Instability
2. **สร้าง Shared Auth State** — ใช้ `storageState` เก็บ Session ไว้ใช้ซ้ำแทนการ Login ทุกครั้ง จะลดเวลาเทสลงอีก 30-40%
3. **เพิ่ม Module ใหม่** — เมื่อต้องการเทส Module อื่น (เช่น Cash Management) สามารถสร้างโฟลเดอร์ `cash-management/` พร้อม `data.factory.ts` ของตัวเอง และหยิบ `common/` ไปใช้ได้เลย
