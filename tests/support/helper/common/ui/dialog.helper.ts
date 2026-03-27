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
    await page.locator('span').filter({ hasText: 'Request Submitted!' }).click();
    await page.getByRole('button', { name: /ok/i }).click();
}

/**
 * Confirms a visible dialog by optionally filling a remark and clicking a confirm button.
 * Uses proper visibility checks instead of silent .catch(() => {}).
 */
export async function confirmVisibleDialog(
    page: Page,
    buttonPattern: RegExp,
    remark?: string
) {
    const dialog = page.getByRole('dialog').first();

    if (!(await dialog.isVisible())) {
        return;
    }

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
