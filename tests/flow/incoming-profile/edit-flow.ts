import { expect, test } from '@playwright/test';
import {
    CREDENTIALS,
    PATTERNS,
    TEST_CONTENT,
    UI_TEXT,
} from '../../support/constant';
import {
    actOnPendingRequest,
    clickRowAction,
    closeSuccessDialog,
    confirmVisibleDialog,
    findTableRowByTexts,
    formatIncomingAccountPattern,
    loginWithMicrosoft,
    searchIncomingProfile,
    signOut,
    type TestRunData,
} from '../../support/helper';

export function incomingEditFlow(ctx: { runData: () => TestRunData }) {
    test('Edit', async ({ page }) => {
        test.setTimeout(600000);

        await test.step('1. Maker validates edit guards and submits update', async () => {
            const { approved: approvedIncoming } = ctx.runData().incomingProfiles;

            await loginWithMicrosoft(page, {
                username: CREDENTIALS.creator.username,
                password: CREDENTIALS.creator.password,
                useAnotherAccount: true,
            });

            await searchIncomingProfile(page, approvedIncoming.accountNo);
            const approvedRow = await findTableRowByTexts(page, [approvedIncoming.remark]);
            await clickRowAction(approvedRow, 'edit');

            const accountField = page.getByPlaceholder(UI_TEXT.placeholders.accountNo);
            const remarkField = page.getByPlaceholder(UI_TEXT.placeholders.incomingRemark);
            const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.genericSubmit });

            await expect(
                page.getByRole('heading', { name: UI_TEXT.headings.incomingProfileDetails })
            ).toBeVisible();

            await accountField.fill('');
            await remarkField.click();
            await expect(submitButton).toBeDisabled();

            await accountField.fill('1234');
            await remarkField.fill(' invalid incoming remark');
            await accountField.click();
            await expect(page.getByText(TEST_CONTENT.validationMessages.incomingAccountNo)).toBeVisible();
            await expect(page.getByText(TEST_CONTENT.validationMessages.remarkFormat)).toBeVisible();

            await accountField.fill(approvedIncoming.updatedAccountNo ?? '');
            await page.locator('label').filter({ hasText: approvedIncoming.updatedStatus ?? UI_TEXT.status.inactive }).click();
            await remarkField.fill(approvedIncoming.updatedRemark ?? '');
            await expect(submitButton).toBeEnabled();
            await submitButton.click();
            await confirmVisibleDialog(page, PATTERNS.confirmSubmit);
            await closeSuccessDialog(page);

            await signOut(page);
        });

        await test.step('2. Approver approves update', async () => {
            const { approved: approvedIncoming } = ctx.runData().incomingProfiles;

            await loginWithMicrosoft(page, {
                username: CREDENTIALS.approver.username,
                password: CREDENTIALS.approver.password,
                useAnotherAccount: true,
            });

            await actOnPendingRequest(page, {
                tab: UI_TEXT.tabs.incoming,
                texts: [
                    formatIncomingAccountPattern(approvedIncoming.updatedAccountNo || approvedIncoming.accountNo),
                    approvedIncoming.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
                    PATTERNS.updateRequest,
                ],
                action: 'approve',
            });

            await signOut(page);
        });
    });
}
