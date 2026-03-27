import { expect, type Locator, type Page } from '@playwright/test';
import { PATTERNS } from '../../../constant';

type RowAction = 'edit' | 'delete' | 'approve' | 'reject';

export async function gotoLastPaginationPage(page: Page) {
    const paginationItems = page
        .getByRole('listitem')
        .filter({ hasText: PATTERNS.pagination });

    if (await paginationItems.count()) {
        await paginationItems.last().click();
        // Wait for the table to update
        await page.waitForTimeout(300);
    }
}

export function tableRows(page: Page) {
    return page.getByRole('row').filter({ hasNot: page.locator('th') });
}

export async function findTableRowByTexts(
    page: Page,
    texts: Array<string | RegExp>
) {
    let rows = tableRows(page);

    for (const text of texts) {
        rows = rows.filter({ hasText: text });
    }

    // Try to find the row on the current page
    const isVisible = await rows.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (!isVisible) {
        // If not found, try the previous page
        const prevPageItem = page.getByRole('listitem', { name: 'Previous Page' });
        const isPrevPageVisible = await prevPageItem.isVisible().catch(() => false);

        if (isPrevPageVisible) {
            // Click the previous page button
            const prevButton = prevPageItem.getByRole('button', { name: 'left' });
            const isPrevEnabled = await prevButton.isEnabled().catch(() => false);

            if (isPrevEnabled) {
                await prevButton.click();
                await page.waitForTimeout(500);

                // Re-filter rows on the new page
                rows = tableRows(page);
                for (const text of texts) {
                    rows = rows.filter({ hasText: text });
                }
            }
        }
    }

    await expect(rows.first()).toBeVisible({ timeout: 15000 });
    return rows.first();
}

export async function clickRowAction(row: Locator, action: RowAction) {
    await row.scrollIntoViewIfNeeded();
    await row.hover();

    const candidates = [
        row.getByRole('button', { name: new RegExp(action, 'i') }).first(),
        row.locator(`[aria-label*="${action}" i]`).first(),
        row.locator(`[title*="${action}" i]`).first(),
        row.getByText(new RegExp(`^${action}$`, 'i')).first(),
    ];

    for (const locator of candidates) {
        if (await locator.count()) {
            await locator.click();
            return;
        }
    }

    throw new Error(`Could not find row action "${action}"`);
}
