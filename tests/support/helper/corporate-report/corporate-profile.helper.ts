import { expect, type Page } from '@playwright/test';
import { PATTERNS, SELECTORS, UI_TEXT, URLS } from '../../constant';
import { closeSuccessDialog, confirmVisibleDialog } from '../common/ui/dialog.helper';
import { selectAutocompleteOption } from '../common/ui/form.helper';
import { openCorporateProfiles } from '../common/ui/navigation.helper';
import { clickRowAction, findTableRowByTexts } from '../common/ui/table.helper';
import type { CorporateProfileData } from '../types';

const PORTAL_ORIGIN = URLS.login.replace(/\/login$/, '');

export async function openCorporateProfileAddForm(page: Page) {
    await openCorporateProfiles(page);
    const addNewButton = page.getByRole('button', { name: UI_TEXT.buttons.addNew });
    await expect(addNewButton).toBeVisible();
    await addNewButton.click();
    await expect(
        page.getByRole('heading', { name: UI_TEXT.headings.corporateProfileDetails })
    ).toBeVisible();
}

export async function fillCorporateProfileBaseFields(
    page: Page,
    profile: Pick<CorporateProfileData, 'corporateId' | 'thaiName' | 'englishName' | 'remark'>
) {
    await page.getByRole('textbox', { name: UI_TEXT.fields.corporateId }).fill(profile.corporateId);
    await page.getByRole('textbox', { name: UI_TEXT.fields.corporateNameThai }).fill(profile.thaiName);
    await page.getByRole('textbox', { name: UI_TEXT.fields.corporateNameEnglish }).fill(profile.englishName);
    await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).fill(profile.remark);
}

export async function selectCorporateSendType(
    page: Page,
    sendType: CorporateProfileData['sendType']
) {
    if (sendType === 'Email') {
        await page.locator('label').filter({ hasText: UI_TEXT.sendType.email }).click();
        return;
    }

    await page.locator('label').filter({ hasText: /sFTP/i }).click();
}

export async function addCorporateEmails(page: Page, emails: string[]) {
    const emailInput = page.locator(SELECTORS.emailListInput);

    for (const email of emails) {
        await emailInput.fill(email);
        await emailInput.press('Enter');
        await page.waitForTimeout(500); // Wait for email to be added to the list
        // Verify email appears as a tag (EmailListFormItem uses ant-tag class)
        await expect(page.locator('.ant-tag').filter({ hasText: email }).first()).toBeVisible({ timeout: 3000 });
    }
}

export async function removeCorporateEmail(page: Page, email: string) {
    const tag = page.locator('.ant-tag').filter({ hasText: email }).first();
    await expect(tag).toBeVisible();

    const removeButton = tag.locator('.anticon-close').first();
    if (await removeButton.count()) {
        await removeButton.click();
    } else {
        const emailInput = page.locator(SELECTORS.emailListInput);
        await emailInput.click();
        await emailInput.press('Backspace');
    }

    await expect(page.locator('.ant-tag').filter({ hasText: email })).toHaveCount(0);
}

export async function fillCorporateEmailFields(
    page: Page,
    options: {
        taxId?: string;
        emails?: string[];
        checkRound1?: boolean;
    }
) {
    if (options.taxId !== undefined) {
        await page.getByPlaceholder(UI_TEXT.placeholders.taxId).fill(options.taxId);
    }

    if (options.emails?.length) {
        await addCorporateEmails(page, options.emails);
    }

    if (options.checkRound1) {
        await page.getByRole('checkbox', { name: UI_TEXT.emailRound.round1 }).check();
    }
}

export async function openCorporateProfilesWithSearch(page: Page, corporateId: string) {
    await page.goto(
        `${PORTAL_ORIGIN}/corporate-report/corporate-profiles?corporateId=${encodeURIComponent(corporateId)}&page=1&pageSize=10`
    );
    await page.waitForSelector('table', { state: 'visible', timeout: 15000 });
}

/**
 * Submit form with retry on 429 (Rate Limiting) error
 * @param page Playwright Page
 * @param submitAction Function that triggers form submission
 * @param maxRetries Maximum number of retries (default: 3)
 * @param retryDelay Delay in ms before retry (default: 5000)
 */
async function submitFormWithRetry(
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
                console.log(`[Attempt ${attempt}/${maxRetries}] Got 429 error, waiting ${retryDelay}ms before retry...`);
                await page.waitForTimeout(retryDelay);
                continue; // Retry
            }

            // Success - no 429
            return;
        } catch (error) {
            page.off('response', responseHandler);

            if (got429 && attempt < maxRetries) {
                console.log(`[Attempt ${attempt}/${maxRetries}] Got 429 error, waiting ${retryDelay}ms before retry...`);
                await page.waitForTimeout(retryDelay);
                continue;
            }

            throw error; // Re-throw if not 429 or max retries reached
        }
    }

    // If we got here, all retries failed with 429
    throw new Error(`Failed after ${maxRetries} attempts due to rate limiting (429): ${last429Error?.url}`);
}

export async function createSftpCorporateProfile(
    page: Page,
    profile: CorporateProfileData
) {
    await openCorporateProfileAddForm(page);

    // WORKAROUND: Click Email first to trigger change detection, then click SFTP
    // This is needed because SFTP is default, so direct click doesn't trigger form state change
    await page.locator('label').filter({ hasText: UI_TEXT.sendType.email }).click();
    await page.waitForTimeout(200);

    await selectCorporateSendType(page, profile.sendType);
    await fillCorporateProfileBaseFields(page, profile);

    // Submit with retry on 429
    await submitFormWithRetry(page, async () => {
        // WORKAROUND: Frontend bug - submit button may stay disabled even with valid data
        const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });
        const isEnabled = await submitButton.isEnabled().catch(() => false);

        if (isEnabled) {
            await submitButton.click();
        } else {
            // Force submit by calling form's onFinish handler
            await page.evaluate(() => {
                const formElement = document.querySelector('form[name="validateOnly"]') as any;
                if (formElement) {
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    formElement.dispatchEvent(submitEvent);
                }
            });
        }
    });

    await expect(page).toHaveURL(URLS.corporateProfilesPattern, { timeout: 15000 });
    await closeSuccessDialog(page);
}

export async function createEmailCorporateProfile(
    page: Page,
    profile: CorporateProfileData
) {
    await openCorporateProfileAddForm(page);
    await selectCorporateSendType(page, profile.sendType);
    await fillCorporateProfileBaseFields(page, profile);
    await fillCorporateEmailFields(page, {
        taxId: profile.taxId,
        emails: profile.emails,
        checkRound1: true,
    });

    // Submit with retry on 429
    await submitFormWithRetry(page, async () => {
        const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });
        await expect(submitButton).toBeEnabled({ timeout: 10000 });
        await submitButton.click();
    });

    await expect(page).toHaveURL(URLS.corporateProfilesPattern, { timeout: 15000 });
    await closeSuccessDialog(page);
}

export async function searchCorporateProfile(page: Page, corporateId: string) {
    await openCorporateProfiles(page);
    await selectAutocompleteOption(
        page,
        UI_TEXT.fields.searchCorporateId,
        corporateId,
        SELECTORS.antSelectVisibleOptions
    );

    const field = page.getByRole('combobox', { name: UI_TEXT.fields.searchCorporateId });
    await expect(field).toHaveValue(corporateId);

    await page.getByRole('button', { name: UI_TEXT.buttons.search }).click();
    await page.waitForSelector('table', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);
}

export async function editCorporateProfile(
    page: Page,
    options: {
        corporateId: string;
        rowTexts: Array<string | RegExp>;
        englishName: string;
        remark: string;
    }
) {
    await searchCorporateProfile(page, options.corporateId);
    await page.waitForSelector('table', { state: 'visible', timeout: 10000 });

    const row = await findTableRowByTexts(page, options.rowTexts);
    await clickRowAction(row, 'edit');

    await expect(
        page.getByRole('heading', { name: UI_TEXT.headings.corporateProfileDetails })
    ).toBeVisible();
    await page
        .getByRole('textbox', { name: UI_TEXT.fields.corporateNameEnglish })
        .fill(options.englishName);
    await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).fill(options.remark);
    await page.getByRole('button', { name: UI_TEXT.buttons.save }).click();
    await confirmVisibleDialog(page, PATTERNS.confirmSave);
    await closeSuccessDialog(page);
}

export async function deleteCorporateProfile(
    page: Page,
    options: {
        corporateId: string;
        rowTexts: Array<string | RegExp>;
    }
) {
    await searchCorporateProfile(page, options.corporateId);
    const row = await findTableRowByTexts(page, options.rowTexts);
    await clickRowAction(row, 'delete');

    await page.getByRole('button', { name: 'Yes' }).click();
    await confirmVisibleDialog(page, PATTERNS.confirmDelete);
    await page.waitForLoadState('networkidle');
}
