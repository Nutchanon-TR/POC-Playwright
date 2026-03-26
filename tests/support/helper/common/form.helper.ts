import { expect, type Page } from '@playwright/test';
import { SELECTORS, UI_TEXT } from '../../constant';

export async function selectAutocompleteOption(
    page: Page,
    fieldName: string,
    optionText: string
) {
    const field = page.getByRole('combobox', { name: fieldName });
    await field.click();
    await field.fill(optionText);
    await page.getByRole('option', { name: optionText }).click();
}

export async function selectFirstIncomingCorporateId(page: Page) {
    await page.getByRole('combobox', { name: UI_TEXT.fields.incomingCorporateId }).click();

    const visibleDropdownOptions = page.locator(SELECTORS.antSelectVisibleOptions);
    await expect(visibleDropdownOptions.first()).toBeVisible();
    await visibleDropdownOptions.first().click();
}
