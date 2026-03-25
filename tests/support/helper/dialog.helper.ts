import type { Page } from '@playwright/test';
import { UI_TEXT } from '../constant';

export async function closeSuccessDialog(page: Page) {
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    if (await dialog.isVisible().catch(() => false)) {
        const okButton = dialog.getByRole('button', { name: UI_TEXT.buttons.ok });
        if (await okButton.count()) {
            await okButton.first().click();
        }
    }
}

export async function confirmVisibleDialog(
    page: Page,
    buttonPattern: RegExp,
    remark?: string
) {
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});

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
