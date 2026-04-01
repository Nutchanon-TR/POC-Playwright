import { expect, type Page } from '@playwright/test';

export async function closeSuccessDialog(page: Page) {
    const yesBtn = page.getByRole('button', { name: 'Yes' });
    await yesBtn.click({ timeout: 2000 }).catch(() => {});

    const successDialog = page.getByRole('dialog').filter({ hasText: 'Request Submitted!' });
    await successDialog.waitFor({ state: 'visible', timeout: 10000 });
    await successDialog.getByRole('button', { name: /ok/i }).click();
}

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

export async function expectNotificationMessage(page: Page, message: string) {
    await expect(page.getByText(message).last()).toBeVisible({ timeout: 15000 });
}
