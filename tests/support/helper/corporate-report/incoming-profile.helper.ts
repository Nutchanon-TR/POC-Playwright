import { expect, type Page } from '@playwright/test';
import { API_PATHS, PATTERNS, SELECTORS, UI_TEXT, URLS } from '../../constant';
import { submitWithRetryOn429 } from '../common/core/http-retry.helper';
import { closeSuccessDialog, confirmVisibleDialog } from '../common/ui/dialog.helper';
import { openIncomingProfiles } from '../common/ui/navigation.helper';
import { clickRowAction, findTableRowByTexts } from '../common/ui/table.helper';
import type { IncomingProfileData } from '../types';

export function todayAsDdMmYyyy() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${day}/${month}/${year}`;
}

export function formatIncomingAccountPattern(accountNo: string) {
    return new RegExp(accountNo.split('').join('-?'));
}

export async function openIncomingProfileAddForm(page: Page) {
    await openIncomingProfiles(page);
    const addNewButton = page.getByRole('button', { name: UI_TEXT.buttons.addNew });
    await expect(addNewButton).toBeVisible();
    await addNewButton.click();
    await expect(
        page.getByRole('heading', { name: UI_TEXT.headings.incomingProfileDetails })
    ).toBeVisible();
}

function waitForIncomingProfileResponse(page: Page) {
    return page.waitForResponse(
        (res) =>
            res.url().includes(API_PATHS.corporateReport) &&
            res.url().includes(API_PATHS.incomingProfiles) &&
            res.request().method() !== 'GET' &&
            res.status() === 200
    );
}

export async function selectFirstIncomingCorporateId(page: Page) {
    await page.getByRole('combobox', { name: UI_TEXT.fields.incomingCorporateId }).click();

    const visibleDropdownOptions = page.locator(SELECTORS.antSelectVisibleOptions);
    await expect(visibleDropdownOptions.first()).toBeVisible();
    await visibleDropdownOptions.first().click();
}

export async function fillIncomingProfileForm(
    page: Page,
    options: {
        accountNo?: string;
        remark?: string;
        effectiveDate?: string;
    }
) {
    if (options.accountNo !== undefined) {
        await page.getByPlaceholder(UI_TEXT.placeholders.accountNo).fill(options.accountNo);
    }

    if (options.effectiveDate !== undefined) {
        await page.getByPlaceholder(UI_TEXT.placeholders.selectDate).fill(options.effectiveDate);
        await page.getByPlaceholder(UI_TEXT.placeholders.selectDate).press('Tab');
    }

    if (options.remark !== undefined) {
        await page.getByPlaceholder(UI_TEXT.placeholders.incomingRemark).fill(options.remark);
    }
}

export async function createIncomingProfile(
    page: Page,
    profile: IncomingProfileData
) {
    await openIncomingProfileAddForm(page);

    await selectFirstIncomingCorporateId(page);
    await fillIncomingProfileForm(page, {
        accountNo: profile.accountNo,
        effectiveDate: todayAsDdMmYyyy(),
        remark: profile.remark,
    });

    await submitWithRetryOn429(page);

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
    await submitWithRetryOn429(page, 'edit-incoming');

    await expect(page).toHaveURL(URLS.incomingProfilesPattern, { timeout: 15000 });
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

    const deleteResponsePromise = waitForIncomingProfileResponse(page);
    await page.getByRole('button', { name: 'Yes' }).click();
    await confirmVisibleDialog(page, PATTERNS.confirmDelete);
    await deleteResponsePromise;
}
