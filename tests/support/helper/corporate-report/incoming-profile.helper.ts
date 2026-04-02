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

async function submitIncomingProfile(page: Page) {
    const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
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

/**
 * Submit incoming profile form with retry on 429 (Rate Limiting) error
 * @param page Playwright Page
 * @param submitAction Function that triggers form submission
 * @param maxRetries Maximum number of retries (default: 3)
 * @param retryDelay Delay in ms before retry (default: 5000)
 */
async function submitIncomingFormWithRetry(
    page: Page,
    submitAction: () => Promise<void>,
    maxRetries: number = 3,
    retryDelay: number = 5000
) {
    let attempt = 0;
    let last429Error: any = null;

    while (attempt < maxRetries) {
        attempt++;
        let got429 = false;

        // Listen for 429 responses
        const responseHandler = (response: any) => {
            if (response.status() === 429 &&
                (response.url().includes('/corporate-profiles') || response.url().includes('/incoming-profiles'))) {
                got429 = true;
                last429Error = { status: 429, url: response.url() };
            }
        };

        page.on('response', responseHandler);

        try {
            await submitAction();
            await page.waitForTimeout(500); // Wait for potential 429 response

            // Remove listener
            page.off('response', responseHandler);

            if (got429) {
                console.log(`[Incoming Profile - Attempt ${attempt}/${maxRetries}] Got 429 error, waiting ${retryDelay}ms before retry...`);
                await page.waitForTimeout(retryDelay);
                continue; // Retry
            }

            // Success - no 429
            return;
        } catch (error) {
            page.off('response', responseHandler);

            if (got429 && attempt < maxRetries) {
                console.log(`[Incoming Profile - Attempt ${attempt}/${maxRetries}] Got 429 error, waiting ${retryDelay}ms before retry...`);
                await page.waitForTimeout(retryDelay);
                continue;
            }

            throw error; // Re-throw if not 429 or max retries reached
        }
    }

    // If we got here, all retries failed with 429
    throw new Error(`Failed after ${maxRetries} attempts due to rate limiting (429): ${last429Error?.url}`);
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

    // Submit with retry on 429
    await submitIncomingFormWithRetry(page, async () => {
        const responsePromise = waitForIncomingProfileResponse(page);
        await submitIncomingProfile(page);
        await responsePromise;
    });

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
