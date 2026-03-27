import { expect, test } from '@playwright/test';
import {
    CREDENTIALS,
    PATTERNS,
    TEST_CONTENT,
    UI_TEXT,
} from './support/constant';
import {
    actOnPendingRequest,
    buildTestRunData,
    createIncomingProfile,
    deleteIncomingProfile,
    editIncomingProfile,
    findTableRowByTexts,
    loginWithMicrosoft,
    searchIncomingProfile,
    signOut,
} from './support/helper';

test('Incoming Profile End-to-End Flow', async ({ page }) => {
    test.setTimeout(300000);
    const runData = buildTestRunData();

    await test.step('Part 1: Creator creates incoming profiles', async () => {
        await loginWithMicrosoft(page);
        await page.getByText(UI_TEXT.menu.corporateReport).click();

        await createIncomingProfile(page, runData.incomingProfiles.approved);
        await createIncomingProfile(page, runData.incomingProfiles.rejected);

        await signOut(page);
    });

    await test.step('Part 2: Approver approves/rejects incoming profiles', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver,
            useAnotherAccount: true,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.incoming,
            texts: [
                new RegExp(runData.incomingProfiles.approved.accountNo.split('').join('-?')),
                runData.incomingProfiles.approved.remark,
            ],
            action: 'approve',
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.incoming,
            texts: [
                new RegExp(runData.incomingProfiles.rejected.accountNo.split('').join('-?')),
                runData.incomingProfiles.rejected.remark,
            ],
            action: 'reject',
            remark: TEST_CONTENT.rejectReasons.incoming,
        });

        await signOut(page);
    });

    await test.step('Part 3: Creator edits approved incoming profile', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator,
            useAnotherAccount: true,
        });

        await editIncomingProfile(page, {
            accountNo: runData.incomingProfiles.approved.accountNo,
            rowTexts: [runData.incomingProfiles.approved.remark],
            updatedAccountNo: runData.incomingProfiles.approved.updatedAccountNo,
            status: runData.incomingProfiles.approved.updatedStatus ?? UI_TEXT.status.inactive,
            remark: runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
        });

        await signOut(page);
    });

    await test.step('Part 4: Approver approves incoming update', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver,
            useAnotherAccount: true,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.incoming,
            texts: [
                new RegExp((runData.incomingProfiles.approved.updatedAccountNo || runData.incomingProfiles.approved.accountNo).split('').join('-?')),
                runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
                PATTERNS.updateRequest,
            ],
            action: 'approve',
        });

        await signOut(page);
    });

    await test.step('Part 5: Creator verifies and deletes incoming profile', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator,
            useAnotherAccount: true,
        });

        await searchIncomingProfile(page, runData.incomingProfiles.approved.updatedAccountNo || runData.incomingProfiles.approved.accountNo);
        const updatedRow = await findTableRowByTexts(page, [
            runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
            runData.incomingProfiles.approved.updatedStatus ?? UI_TEXT.status.inactive,
        ]);
        await expect(updatedRow).toContainText(
            runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated
        );
        await expect(updatedRow).toContainText(
            runData.incomingProfiles.approved.updatedStatus ?? UI_TEXT.status.inactive
        );

        await deleteIncomingProfile(page, {
            accountNo: runData.incomingProfiles.approved.updatedAccountNo || runData.incomingProfiles.approved.accountNo,
            rowTexts: [
                runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
                runData.incomingProfiles.approved.updatedStatus ?? UI_TEXT.status.inactive,
            ],
        });

        await signOut(page);
    });

    await test.step('Part 6: Approver approves incoming delete', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver,
            useAnotherAccount: true,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.incoming,
            texts: [
                new RegExp((runData.incomingProfiles.approved.updatedAccountNo || runData.incomingProfiles.approved.accountNo).split('').join('-?')),
                runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
                PATTERNS.deleteRequest,
            ],
            action: 'approve',
        });

        await signOut(page);
    });
});
