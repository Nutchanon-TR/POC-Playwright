import type { Page, Response } from '@playwright/test';

type RetryCallback = (attempt: number) => Promise<void> | void;

type SubmitRetryOptions = {
    maxRetries?: number;
    retryDelayMs?: number;
    settleDelayMs?: number;
    responseUrlIncludes?: string[];
    logPrefix?: string;
    onRetry?: RetryCallback;
};

const DEFAULT_RESPONSE_URL_INCLUDES = ['/corporate-profiles', '/incoming-profiles'];

function isRetryableResponse(response: Response, responseUrlIncludes: string[]) {
    return response.status() === 429 &&
        responseUrlIncludes.some((path) => response.url().includes(path));
}

export async function submitWithRetryOn429(
    page: Page,
    submitAction: () => Promise<void>,
    options: SubmitRetryOptions = {}
) {
    const maxRetries = options.maxRetries ?? 3;
    const retryDelayMs = options.retryDelayMs ?? 5000;
    const settleDelayMs = options.settleDelayMs ?? 500;
    const responseUrlIncludes = options.responseUrlIncludes ?? DEFAULT_RESPONSE_URL_INCLUDES;
    const logPrefix = options.logPrefix ?? 'Submit';

    let last429Url: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let got429 = false;

        const responseHandler = (response: Response) => {
            if (isRetryableResponse(response, responseUrlIncludes)) {
                got429 = true;
                last429Url = response.url();
            }
        };

        page.on('response', responseHandler);

        try {
            await submitAction();
            await page.waitForTimeout(settleDelayMs);

            if (!got429) {
                return;
            }
        } catch (error) {
            if (!got429) {
                throw error;
            }
        } finally {
            page.off('response', responseHandler);
        }

        if (attempt < maxRetries) {
            console.log(`[${logPrefix}] Attempt ${attempt}/${maxRetries} got 429, waiting ${retryDelayMs}ms before retry...`);
            await page.waitForTimeout(retryDelayMs);
            await options.onRetry?.(attempt);
            continue;
        }
    }

    throw new Error(
        `[${logPrefix}] Failed after ${maxRetries} attempts due to rate limiting${last429Url ? `: ${last429Url}` : ''}`
    );
}
