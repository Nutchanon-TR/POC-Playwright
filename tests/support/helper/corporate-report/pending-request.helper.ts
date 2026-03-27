import type { Page } from '@playwright/test';
import { PATTERNS } from '../../constant';
import { confirmVisibleDialog } from '../common/ui/dialog.helper';
import { openPendingRequests } from '../common/ui/navigation.helper';
import { clickRowAction, findTableRowByTexts, gotoLastPaginationPage } from '../common/ui/table.helper';
import type { PendingRequestOptions } from '../types';

export async function actOnPendingRequest(
    page: Page,
    options: PendingRequestOptions
) {
    await openPendingRequests(page, options.tab);
    await gotoLastPaginationPage(page, PATTERNS.pagination);

    const row = await findTableRowByTexts(page, options.texts);

    // Use Playwright's .or() locator instead of try/catch for auto-retry
    await row.hover();
    const inlineBtn = row.getByRole('button', { name: new RegExp(options.action, 'i') }).first();
    const fallbackBtn = page.getByRole('button', { name: new RegExp(options.action, 'i') }).first();
    await inlineBtn.or(fallbackBtn).click();

    await confirmVisibleDialog(
        page,
        options.action === 'approve'
            ? PATTERNS.confirmApprove
            : PATTERNS.confirmReject,
        options.remark
    );

    await page.getByRole('button', { name: 'Yes' }).click();
    await page.getByLabel('Close', { exact: true }).click();
}
