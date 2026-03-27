import { expect, type Page } from '@playwright/test';
import { SELECTORS, UI_TEXT } from '../../../constant';

export async function selectAutocompleteOption(
    page: Page,
    fieldName: string,
    optionText: string
) {
    const field = page.getByRole('combobox', { name: fieldName });
    await field.click();
    await field.fill(optionText);
    await page.getByRole('option', { name: optionText }).click();

    // Try to wait for dropdown options to appear
    const visibleDropdownOptions = page.locator(SELECTORS.antSelectVisibleOptions);
    const hasDropdown = await visibleDropdownOptions.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (hasDropdown) {
        // If dropdown appeared, find and click the option with the matching text
        const option = visibleDropdownOptions.filter({ hasText: optionText });
        await option.first().click();
    }
    // If no dropdown, the field accepts direct text input, so we're done
}

export async function selectFirstIncomingCorporateId(page: Page) {
    await page.getByRole('combobox', { name: UI_TEXT.fields.incomingCorporateId }).click();

    const visibleDropdownOptions = page.locator(SELECTORS.antSelectVisibleOptions);
    await expect(visibleDropdownOptions.first()).toBeVisible();
    await visibleDropdownOptions.first().click();
}
