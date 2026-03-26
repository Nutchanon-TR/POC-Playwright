import { expect, type Page } from '@playwright/test';
import { PATTERNS, UI_TEXT, URLS } from '../../constant';
import { closeSuccessDialog, confirmVisibleDialog } from '../common/dialog.helper';
import { selectFirstIncomingCorporateId } from '../common/form.helper';
import { openIncomingProfiles } from '../common/navigation.helper';
import { clickRowAction, findTableRowByTexts } from '../common/table.helper';
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

export async function createIncomingProfile(
    page: Page,
    profile: IncomingProfileData
) {
    await openIncomingProfileAddForm(page);

    await selectFirstIncomingCorporateId(page);
    await page
        .getByPlaceholder(UI_TEXT.placeholders.accountNo)
        .fill(profile.accountNo);
    await page
        .getByPlaceholder(UI_TEXT.placeholders.selectDate)
        .fill(todayAsDdMmYyyy());
    await page.getByPlaceholder(UI_TEXT.placeholders.selectDate).press('Tab');
    await page
        .getByPlaceholder(UI_TEXT.placeholders.incomingRemark)
        .fill(profile.remark);

    await submitIncomingProfile(page);
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
    await page.getByRole('radio', { name: options.status }).click();
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

    const deleteResponsePromise = page.waitForResponse(
        (res) =>
            res.url().includes('/corporate-report/v1/') &&
            res.url().includes('/incoming-profiles') &&
            res.request().method() !== 'GET' &&
            res.status() === 200
    );

    await confirmVisibleDialog(page, PATTERNS.confirmDelete);
    await deleteResponsePromise;
}
