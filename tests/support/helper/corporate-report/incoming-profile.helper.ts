import { expect, type Page } from '@playwright/test';
import { API_PATHS, PATTERNS, SELECTORS, UI_TEXT, URLS } from '../../constant';
import { closeSuccessDialog, confirmVisibleDialog } from '../common/ui/dialog.helper';
import { openIncomingProfiles } from '../common/ui/navigation.helper';
import { clickRowAction, findTableRowByTexts } from '../common/ui/table.helper';
import type { IncomingProfileData } from '../types';

function todayAsDdMmYyyy() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${day}/${month}/${year}`;
}

async function openIncomingProfileAddForm(page: Page) {
    await openIncomingProfiles(page);
    const addNewButton = page.getByRole('button', { name: UI_TEXT.buttons.addNew });
    await expect(addNewButton).toBeVisible();
    await addNewButton.click();
    await expect(
        page.getByRole('heading', { name: UI_TEXT.headings.incomingProfileDetails })
    ).toBeVisible();
}

async function submitIncomingProfile(page: Page) {
    const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
}

/** Helper to wait for incoming profile API response */
function waitForIncomingProfileResponse(page: Page) {
    return page.waitForResponse(
        (res) =>
            res.url().includes(API_PATHS.corporateReport) &&
            res.url().includes(API_PATHS.incomingProfiles) &&
            res.request().method() !== 'GET' &&
            res.status() === 200
    );
}

/**
 * selectFirstIncomingCorporateId — moved from common/ui/form.helper.ts
 * because it contains business logic specific to Incoming Profile.
 */
async function selectFirstIncomingCorporateId(page: Page) {
    await page.getByRole('combobox', { name: UI_TEXT.fields.incomingCorporateId }).click();

    const visibleDropdownOptions = page.locator(SELECTORS.antSelectVisibleOptions);
    await expect(visibleDropdownOptions.first()).toBeVisible();
    await visibleDropdownOptions.first().click();
}

export async function createIncomingProfile(
    page: Page,
    profile: IncomingProfileData
) {
    await openIncomingProfileAddForm(page);

    await selectFirstIncomingCorporateId(page);
    await page.getByPlaceholder(UI_TEXT.placeholders.accountNo).fill(profile.accountNo);
    await page.getByPlaceholder(UI_TEXT.placeholders.selectDate).fill(todayAsDdMmYyyy());
    await page.getByPlaceholder(UI_TEXT.placeholders.selectDate).press('Tab');
    await page.getByPlaceholder(UI_TEXT.placeholders.incomingRemark).fill(profile.remark);

    const responsePromise = waitForIncomingProfileResponse(page);
    await submitIncomingProfile(page);
    await responsePromise;

    await expect(page).toHaveURL(URLS.incomingProfilesPattern, { timeout: 15000 });
    await closeSuccessDialog(page);
}

export async function searchIncomingProfile(page: Page, accountNo: string) {
    await openIncomingProfiles(page);
    await page.getByRole('textbox', { name: UI_TEXT.fields.searchAllowAccount }).fill(accountNo);
    await page.getByRole('button', { name: UI_TEXT.buttons.search }).click();
}

export async function editIncomingProfile(
    page: Page,
    options: {
        accountNo: string;
        rowTexts: Array<string | RegExp>;
        updatedAccountNo?: string;
        status: 'Active' | 'Inactive';
        remark: string;
    }
) {
    await searchIncomingProfile(page, options.accountNo);
    const row = await findTableRowByTexts(page, options.rowTexts);
    await clickRowAction(row, 'edit');

    await expect(
        page.getByRole('heading', { name: UI_TEXT.headings.incomingProfileDetails })
    ).toBeVisible();
    if (options.updatedAccountNo) {
        await page.getByPlaceholder(UI_TEXT.placeholders.accountNo).fill(options.updatedAccountNo);
    }
    await page.locator('label').filter({ hasText: options.status }).click();
    await page.getByPlaceholder(UI_TEXT.placeholders.incomingRemark).fill(options.remark);
    await page.getByRole('button', { name: UI_TEXT.buttons.genericSubmit }).click();
    await confirmVisibleDialog(page, PATTERNS.confirmSubmit);
    await closeSuccessDialog(page);
}

export async function deleteIncomingProfile(
    page: Page,
    options: {
        accountNo: string;
        rowTexts: Array<string | RegExp>;
    }
) {
    await searchIncomingProfile(page, options.accountNo);
    const row = await findTableRowByTexts(page, options.rowTexts);
    await clickRowAction(row, 'delete');

    // Setup waitForResponse BEFORE clicking Yes to prevent race condition
    const deleteResponsePromise = waitForIncomingProfileResponse(page);
    await page.getByRole('button', { name: 'Yes' }).click();
    await confirmVisibleDialog(page, PATTERNS.confirmDelete);
    await deleteResponsePromise;
}
