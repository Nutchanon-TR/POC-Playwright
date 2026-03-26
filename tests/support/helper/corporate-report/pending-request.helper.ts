import type { Page } from '@playwright/test';
import { PATTERNS } from '../../constant';
import { confirmVisibleDialog } from '../common/dialog.helper';
import { openPendingRequests } from '../common/navigation.helper';
import { clickRowAction, findTableRowByTexts, gotoLastPaginationPage } from '../common/table.helper';
import type { PendingRequestOptions } from '../types';

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

    const actionSubmitPromise = page.waitForResponse(
        (res) =>
            res.url().includes('/corporate-report/v1/') &&
            res.status() === 200 &&
            res.request().method() !== 'GET'
    );

    const pendingListReloadPromise = page.waitForResponse(
        (res) =>
            res.url().includes('/corporate-report/v1/') &&
            res.status() === 200 &&
            res.request().method() === 'GET' &&
            res.url().toLowerCase().includes('pending')
    );

    await confirmVisibleDialog(
        page,
        options.action === 'approve'
            ? PATTERNS.confirmApprove
            : PATTERNS.confirmReject,
        options.remark
    );

    await actionSubmitPromise;
    await pendingListReloadPromise;
}
