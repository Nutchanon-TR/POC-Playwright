import type { Page } from '@playwright/test';
import { UI_TEXT } from '../../constant';

export async function closeSuccessDialog(page: Page) {
    await page.getByRole('button', { name: 'Yes' }).click({ timeout: 2000 }).catch(() => {});
    await page.locator('span').filter({ hasText: 'Request Submitted!' }).click();
    await page.getByRole('button', { name: UI_TEXT.buttons.ok }).click();
}

export async function confirmVisibleDialog(
    page: Page,
    buttonPattern: RegExp,
    remark?: string
) {
    const dialog = page.getByRole('dialog').first();
    // await dialog.waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });

    if (!(await dialog.isVisible().catch(() => false))) {
        return;
    }

    if (remark) {
        const remarkInput = dialog.getByRole('textbox').first();
        if (await remarkInput.isVisible().catch(() => false)) {
            await remarkInput.fill(remark);
        }
    }

    const confirmButton = dialog.getByRole('button', { name: buttonPattern }).first();
    if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
    }
}
