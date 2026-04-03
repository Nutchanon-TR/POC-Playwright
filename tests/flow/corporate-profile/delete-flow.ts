import { expect, test } from '@playwright/test';
import {
    CREDENTIALS,
    PATTERNS,
    UI_TEXT,
} from '../../support/constant';
import {
    actOnPendingRequest,
    deleteCorporateProfile,
    expectEmptyState,
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

            await signOut(page);
            await page.waitForTimeout(3000);
        });

        await test.step('2. Approver approves delete', async () => {
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

        await test.step('3. Maker confirms deleted', async () => {
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
