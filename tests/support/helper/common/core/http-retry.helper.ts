import type { Page } from '@playwright/test';
import { UI_TEXT } from '../../../constant';

const RATE_LIMIT_NOTIFY_TEXT = 'Request failed with status code 429';
const RATE_LIMIT_WAIT_MS = 15_000;

export async function submitWithRetryOn429(
    page: Page,
    mode: 'create' | 'edit' = 'create'
): Promise<void> {
    if (mode === 'edit') {
        await page.getByRole('button', { name: UI_TEXT.buttons.save }).click();
        await page.getByRole('button', { name: 'Yes' }).click();
    } else {
        await page.getByRole('button', { name: UI_TEXT.buttons.genericSubmit }).click();
    }

    const got429 = await page
        .getByText(RATE_LIMIT_NOTIFY_TEXT)
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false);

    if (got429) {
        await page.waitForTimeout(RATE_LIMIT_WAIT_MS);
    }
}
