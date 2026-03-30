import { expect, type Page } from '@playwright/test';
import { PATTERNS, SELECTORS, UI_TEXT, URLS } from '../../constant';
import { closeSuccessDialog, confirmVisibleDialog } from '../common/ui/dialog.helper';
import { selectAutocompleteOption } from '../common/ui/form.helper';
import { openCorporateProfiles } from '../common/ui/navigation.helper';
import { clickRowAction, findTableRowByTexts } from '../common/ui/table.helper';
import type { CorporateProfileData } from '../types';

async function openCorporateProfileAddForm(page: Page) {
    await openCorporateProfiles(page);
    const addNewButton = page.getByRole('button', { name: UI_TEXT.buttons.addNew });
    await expect(addNewButton).toBeVisible();
    await addNewButton.click();
    await expect(
        page.getByRole('heading', { name: UI_TEXT.headings.corporateProfileDetails })
    ).toBeVisible();
}

async function fillCorporateProfileBaseFields(
    page: Page,
    profile: CorporateProfileData
) {
    // Fill fields sequentially to ensure form change detection works properly
    await page.getByRole('textbox', { name: UI_TEXT.fields.corporateId }).fill(profile.corporateId);
    await page.getByRole('textbox', { name: UI_TEXT.fields.corporateNameThai }).fill(profile.thaiName);
    await page.getByRole('textbox', { name: UI_TEXT.fields.corporateNameEnglish }).fill(profile.englishName);
    await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).fill(profile.remark);
}



export async function createSftpCorporateProfile(
    page: Page,
    profile: CorporateProfileData
) {
    await openCorporateProfileAddForm(page);
    await fillCorporateProfileBaseFields(page, profile);

    // Explicitly select SFTP send type to trigger form validation
    // The label in the UI is 'sFTP' (note the lowercase 's')
    await page.locator('label').filter({ hasText: /sFTP/i }).click();

    // Submit the form
    const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();

    // Wait for navigation back to the listing page and the success dialog
    await expect(page).toHaveURL(URLS.corporateProfilesPattern, { timeout: 15000 });
    await closeSuccessDialog(page);
}

export async function createEmailCorporateProfile(
    page: Page,
    profile: CorporateProfileData
) {
    await openCorporateProfileAddForm(page);
    await fillCorporateProfileBaseFields(page, profile);

    await page.locator('label').filter({ hasText: UI_TEXT.sendType.email }).click();

    if (profile.taxId) {
        await page.getByPlaceholder(UI_TEXT.placeholders.taxId).fill(profile.taxId);
    }

    for (const email of profile.emails ?? []) {
        await page.locator(SELECTORS.emailListInput).fill(email);
        await page.locator(SELECTORS.emailListInput).press('Enter');
    }

    await page.getByRole('checkbox', { name: UI_TEXT.emailRound.round1 }).check();

    // Submit the form
    const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();

    // Wait for navigation and success dialog
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
    // The delete action shows a notification toast, not a modal, so we just wait for the page to settle
    await page.waitForLoadState('networkidle');
}
