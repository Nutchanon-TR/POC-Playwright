import { expect, test } from '@playwright/test';
import {
    CREDENTIALS,
    PATTERNS,
    TEST_CONTENT,
    UI_TEXT,
} from '../../support/constant';
import {
    actOnPendingRequest,
    deleteIncomingProfile,
    expectEmptyState,
    findTableRowByTexts,
    formatIncomingAccountPattern,
    loginWithMicrosoft,
    searchIncomingProfile,
    signOut,
    type TestRunData,
} from '../../support/helper';

export function incomingDeleteFlow(ctx: { runData: () => TestRunData }) {
    test.describe('Delete', () => {
        test('1. Maker verifies update and submits delete', async ({ page }) => {
            test.setTimeout(600000);
            const { approved: approvedIncoming } = ctx.runData().incomingProfiles;

            await loginWithMicrosoft(page, {
                username: CREDENTIALS.creator.username,
                password: CREDENTIALS.creator.password,
                useAnotherAccount: true,
            });

            await searchIncomingProfile(page, approvedIncoming.updatedAccountNo || approvedIncoming.accountNo);
            const updatedRow = await findTableRowByTexts(page, [
                approvedIncoming.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
                approvedIncoming.updatedStatus ?? UI_TEXT.status.inactive,
            ]);
            await expect(updatedRow).toContainText(
                approvedIncoming.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated
            );
            await expect(updatedRow).toContainText(
                approvedIncoming.updatedStatus ?? UI_TEXT.status.inactive
            );

            await deleteIncomingProfile(page, {
                accountNo: approvedIncoming.updatedAccountNo || approvedIncoming.accountNo,
                rowTexts: [
                    approvedIncoming.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
                    approvedIncoming.updatedStatus ?? UI_TEXT.status.inactive,
                ],
            });

            await signOut(page);
        });

        test('2. Approver approves delete', async ({ page }) => {
            test.setTimeout(600000);
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
                    PATTERNS.deleteRequest,
                ],
                action: 'approve',
            });

            await signOut(page);
        });

        test('3. Maker confirms deleted', async ({ page }) => {
            test.setTimeout(600000);
            const { approved: approvedIncoming } = ctx.runData().incomingProfiles;

            await loginWithMicrosoft(page, {
                username: CREDENTIALS.creator.username,
                password: CREDENTIALS.creator.password,
                useAnotherAccount: true,
            });

            await searchIncomingProfile(page, approvedIncoming.updatedAccountNo || approvedIncoming.accountNo);
            await expectEmptyState(page);
        });
    });
}
