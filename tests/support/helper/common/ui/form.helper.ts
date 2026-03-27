import { expect, type Page } from '@playwright/test';

/**
 * Generic autocomplete/combobox selector.
 * Accepts an optional dropdownSelector for custom dropdown containers.
 */
export async function selectAutocompleteOption(
    page: Page,
    fieldName: string,
    optionText: string,
    dropdownSelector = '.ant-select-dropdown:visible .ant-select-item-option'
) {
    const field = page.getByRole('combobox', { name: fieldName });
    await field.click();
    await field.fill(optionText);
    await page.getByRole('option', { name: optionText }).click();

    // Try to wait for dropdown options to appear
    const visibleDropdownOptions = page.locator(dropdownSelector);
    const hasDropdown = await visibleDropdownOptions.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (hasDropdown) {
        const option = visibleDropdownOptions.filter({ hasText: optionText });
        await option.first().click();
    }
}
