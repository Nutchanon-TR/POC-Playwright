import { expect, type Locator, type Page } from '@playwright/test';
import { TEST_CONTENT } from '../../../constant';

type RowAction = 'edit' | 'delete' | 'approve' | 'reject';

export async function gotoLastPaginationPage(
    page: Page,
    paginationPattern: RegExp = /^[0-9]+$/
) {
    const paginationItems = page
        .getByRole('listitem')
        .filter({ hasText: paginationPattern });

    if (await paginationItems.count()) {
        await paginationItems.last().click();
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

    const isVisible = await rows.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (!isVisible) {
        const prevPageItem = page.getByRole('listitem', { name: 'Previous Page' });
        const isPrevPageVisible = await prevPageItem.isVisible().catch(() => false);

        if (isPrevPageVisible) {
            const prevButton = prevPageItem.getByRole('button', { name: 'left' });
            const isPrevEnabled = await prevButton.isEnabled().catch(() => false);

            if (isPrevEnabled) {
                await prevButton.click();
                await page.waitForTimeout(500);

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

export async function expectEmptyState(
    page: Page,
    text: string = TEST_CONTENT.validationMessages.emptyState
) {
    await expect(page.getByText(text).first()).toBeVisible();
}
