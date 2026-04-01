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
        await expect(
            page.locator('.ant-select-selection-item').filter({ hasText: email }).first()
        ).toBeVisible();
    }
}

export async function removeCorporateEmail(page: Page, email: string) {
    const tag = page.locator('.ant-select-selection-item').filter({ hasText: email }).first();
    await expect(tag).toBeVisible();

    const removeButton = tag.locator('.ant-select-selection-item-remove, .anticon-close').first();
    if (await removeButton.count()) {
        await removeButton.click();
    } else {
        const emailInput = page.locator(SELECTORS.emailListInput);
        await emailInput.click();
        await emailInput.press('Backspace');
    }

    await expect(page.locator('.ant-select-selection-item').filter({ hasText: email })).toHaveCount(0);
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

export async function createSftpCorporateProfile(
    page: Page,
    profile: CorporateProfileData
) {
    await openCorporateProfileAddForm(page);
    await fillCorporateProfileBaseFields(page, profile);

    await selectCorporateSendType(page, profile.sendType);

    const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();

    await expect(page).toHaveURL(URLS.corporateProfilesPattern, { timeout: 15000 });
    await closeSuccessDialog(page);
}

export async function createEmailCorporateProfile(
    page: Page,
    profile: CorporateProfileData
) {
    await openCorporateProfileAddForm(page);
    await fillCorporateProfileBaseFields(page, profile);

    await selectCorporateSendType(page, profile.sendType);
    await fillCorporateEmailFields(page, {
        taxId: profile.taxId,
        emails: profile.emails,
        checkRound1: true,
    });

    const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();

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
