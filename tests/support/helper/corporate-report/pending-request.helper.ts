import { expect, type Page } from '@playwright/test';
import { PATTERNS, UI_TEXT } from '../../constant';
import { confirmVisibleDialog } from '../common/ui/dialog.helper';
import { openPendingRequests } from '../common/ui/navigation.helper';
import { findTableRowByTexts, gotoLastPaginationPage } from '../common/ui/table.helper';
import type { PendingRequestOptions } from '../types';

export async function expectPendingRequestActionsHidden(page: Page) {
    await openPendingRequests(page, UI_TEXT.tabs.corporate);
    await expect(page.getByRole('button', { name: /approve/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /reject/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /approve/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /reject/i })).toHaveCount(0);
}

export async function actOnPendingRequest(
    page: Page,
    options: PendingRequestOptions
) {
    await openPendingRequests(page, options.tab);
    await gotoLastPaginationPage(page, PATTERNS.pagination);

    const row = await findTableRowByTexts(page, options.texts);

    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await row.getByRole('link', { name: new RegExp(options.action, 'i') }).click();

    await confirmVisibleDialog(
        page,
        options.action === 'approve'
            ? PATTERNS.confirmApprove
            : PATTERNS.confirmReject,
        options.remark
    );

    await page.getByRole('button', { name: 'Yes' }).click();
    await page.getByLabel('Close', { exact: true }).click();
    await page.waitForLoadState('networkidle');
}
