import type { Page } from '@playwright/test';

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

    const visibleDropdownOptions = page.locator(dropdownSelector);
    const hasDropdown = await visibleDropdownOptions.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (hasDropdown) {
        // Ant Design occasionally leaves a second visible dropdown layer after the first role-based click,
        // so we click the visible option again to make the selection deterministic.
        const option = visibleDropdownOptions.filter({ hasText: optionText });
        await option.first().click();
    }
}
