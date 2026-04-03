import type { Page } from '@playwright/test';

const RATE_LIMIT_NOTIFY_TEXT = 'Request failed with status code 429';
const RATE_LIMIT_WAIT_MS = 15_000;

export async function submitWithRetryOn429(
    page: Page,
    submitAction: () => Promise<void>,
    logPrefix = 'Submit'
): Promise<void> {
    await submitAction();

    const got429 = await page
        .getByText(RATE_LIMIT_NOTIFY_TEXT)
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false);

    if (got429) {
        console.log(`[${logPrefix}] [429 Rate Limit] Detected "Request failed with status code 429" — waiting ${RATE_LIMIT_WAIT_MS / 1000}s before continuing`);
        await page.waitForTimeout(RATE_LIMIT_WAIT_MS);
    }
}
