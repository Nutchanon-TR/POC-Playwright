import type { Page } from '@playwright/test';
import { PATTERNS } from '../constant';
import { confirmVisibleDialog } from './dialog.helper';
import { openPendingRequests } from './navigation.helper';
import { clickRowAction, findTableRowByTexts, gotoLastPaginationPage } from './table.helper';
import type { PendingRequestOptions } from './types';

export async function actOnPendingRequest(
    page: Page,
    options: PendingRequestOptions
) {
    await openPendingRequests(page, options.tab);
    await gotoLastPaginationPage(page);

    const row = await findTableRowByTexts(page, options.texts);

    try {
        await clickRowAction(row, options.action);
    } catch {
        await row.click();
        await page
            .getByRole('button', { name: new RegExp(options.action, 'i') })
            .first()
            .click();
    }

    await confirmVisibleDialog(
        page,
        options.action === 'approve'
            ? PATTERNS.confirmApprove
            : PATTERNS.confirmReject,
        options.remark
    );

    await page.waitForTimeout(1000);
}
