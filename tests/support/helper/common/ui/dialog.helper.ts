import type { Page } from '@playwright/test';

/**
 * Safely closes a success dialog by clicking the optional 'Yes' button
 * and then dismissing the 'Request Submitted!' confirmation.
 */
export async function closeSuccessDialog(page: Page) {
    const yesBtn = page.getByRole('button', { name: 'Yes' });
    if (await yesBtn.isVisible({ timeout: 2000 })) {
        await yesBtn.click();
    }
    // Wait for the success modal to appear and click OK to dismiss it
    // The modal has role='dialog' and contains "Request Submitted!" text
    const successDialog = page.getByRole('dialog').filter({ hasText: 'Request Submitted!' });
    await successDialog.waitFor({ state: 'visible', timeout: 10000 });
    await successDialog.getByRole('button', { name: /ok/i }).click();
}

/**
 * Confirms a visible dialog by optionally filling a remark and clicking a confirm button.
 * Waits for the dialog to appear with a short timeout, then interacts with it if present.
 */
export async function confirmVisibleDialog(
    page: Page,
    buttonPattern: RegExp,
    remark?: string
) {
    const dialog = page.getByRole('dialog').first();
    if (remark) {
        const remarkInput = dialog.getByRole('textbox').first();
        if (await remarkInput.isVisible()) {
            await remarkInput.fill(remark);
        }
    }

    const confirmButton = dialog.getByRole('button', { name: buttonPattern }).first();
    if (await confirmButton.isVisible()) {
        await confirmButton.click();
    }
}
