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
    confirmVisibleDialog,
    deleteCorporateProfile,
    expectEmptyState,
    expectNotificationMessage,
    findTableRowByTexts,
    loginWithMicrosoft,
    openCorporateProfilesWithSearch,
    searchCorporateProfile,
    signOut,
    type TestRunData,
} from '../../support/helper';

export function corporateDeleteFlow(ctx: { runData: () => TestRunData }) {
    test('Delete', async ({ page }) => {
        test.setTimeout(600000);

        await test.step('1. Maker verifies update and submits delete', async () => {
            const { emailApproved } = ctx.runData().corporateProfiles;

            await page.waitForLoadState('networkidle');
            await loginWithMicrosoft(page, {
                username: CREDENTIALS.creator.username,
                password: CREDENTIALS.creator.password,
                useAnotherAccount: true,
            });

            await searchCorporateProfile(page, emailApproved.corporateId);
            const updatedRow = await findTableRowByTexts(page, [
                emailApproved.corporateId,
                emailApproved.updatedEnglishName,
                emailApproved.updatedRemark,
            ]);
            await expect(updatedRow).toContainText(emailApproved.updatedEnglishName);
            await expect(updatedRow).toContainText(emailApproved.updatedRemark);

            await deleteCorporateProfile(page, {
                corporateId: emailApproved.corporateId,
                rowTexts: [emailApproved.corporateId, emailApproved.updatedRemark],
            });

        });

        await test.step('2. Maker verifies duplicate delete is blocked', async () => {
            const { emailApproved } = ctx.runData().corporateProfiles;

            await searchCorporateProfile(page, emailApproved.corporateId);
            const row = await findTableRowByTexts(page, [
                emailApproved.corporateId,
                emailApproved.updatedRemark,
            ]);
            await clickRowAction(row, 'delete');
            await page.getByRole('button', { name: 'Yes' }).click();
            await confirmVisibleDialog(page, PATTERNS.confirmDelete);
            await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicatePendingRequest);

            await signOut(page);
            await page.waitForTimeout(3000);
        });

        await test.step('3. Approver approves delete', async () => {
            const { emailApproved } = ctx.runData().corporateProfiles;

            await page.waitForLoadState('networkidle');
            await loginWithMicrosoft(page, {
                username: CREDENTIALS.approver.username,
                password: CREDENTIALS.approver.password,
                useAnotherAccount: true,
            });

            await actOnPendingRequest(page, {
                tab: UI_TEXT.tabs.corporate,
                texts: [emailApproved.corporateId, emailApproved.updatedRemark, PATTERNS.deleteRequest],
                action: 'approve',
            });

            await signOut(page);
            await page.waitForTimeout(3000);
        });

        await test.step('4. Maker confirms deleted', async () => {
            const { emailApproved } = ctx.runData().corporateProfiles;

            await page.waitForLoadState('networkidle');
            await loginWithMicrosoft(page, {
                username: CREDENTIALS.creator.username,
                password: CREDENTIALS.creator.password,
                useAnotherAccount: true,
            });

            await openCorporateProfilesWithSearch(page, emailApproved.corporateId);
            await expectEmptyState(page);
        });
    });
}
