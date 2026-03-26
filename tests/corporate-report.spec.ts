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
    createEmailCorporateProfile,
    createIncomingProfile,
    createSftpCorporateProfile,
    deleteCorporateProfile,
    deleteIncomingProfile,
    editCorporateProfile,
    editIncomingProfile,
    findTableRowByTexts,
    loginWithMicrosoft,
    searchCorporateProfile,
    searchIncomingProfile,
    signOut,
} from './support/helper';

test('Corporate Report: create, approve, edit, and delete corporate and incoming profiles', async ({
    page,
}) => {
    const runData = buildTestRunData();

    // ------- 1. Login with creator -------
    await loginWithMicrosoft(page);
    await page.getByText(UI_TEXT.menu.corporateReport).click();

    // ------- 2. Create initial requests -------
    await createSftpCorporateProfile(page, runData.corporateProfiles.sftp);
    await createEmailCorporateProfile(page, runData.corporateProfiles.email);
    await createIncomingProfile(page, runData.incomingProfiles.approved);
    await createIncomingProfile(page, runData.incomingProfiles.rejected);

    // ------- 3. Sign out creator -------
    await signOut(page);

    // ------- 4. Login approver and process create requests -------
    await loginWithMicrosoft(page, {
        username: CREDENTIALS.approver,
        useAnotherAccount: true,
    });

    await actOnPendingRequest(page, {
        tab: UI_TEXT.tabs.corporate,
        texts: [
            runData.corporateProfiles.email.corporateId,
            UI_TEXT.sendType.email,
            runData.corporateProfiles.email.remark,
        ],
        action: 'approve',
    });

    await actOnPendingRequest(page, {
        tab: UI_TEXT.tabs.corporate,
        texts: [
            runData.corporateProfiles.sftp.corporateId,
            UI_TEXT.sendType.sftp,
            runData.corporateProfiles.sftp.remark,
        ],
        action: 'reject',
        remark: TEST_CONTENT.rejectReasons.sftp,
    });

    await actOnPendingRequest(page, {
        tab: UI_TEXT.tabs.incoming,
        texts: [runData.incomingProfiles.approved.remark],
        action: 'approve',
    });

    await actOnPendingRequest(page, {
        tab: UI_TEXT.tabs.incoming,
        texts: [runData.incomingProfiles.rejected.remark],
        action: 'reject',
        remark: TEST_CONTENT.rejectReasons.incoming,
    });

    // ------- 5. Sign out approver -------
    await signOut(page);

    // ------- 6. Login creator and edit approved records -------
    await loginWithMicrosoft(page);

    await editCorporateProfile(page, {
        corporateId: runData.corporateProfiles.email.corporateId,
        rowTexts: [
            runData.corporateProfiles.email.corporateId,
            runData.corporateProfiles.email.englishName,
            runData.corporateProfiles.email.remark,
        ],
        englishName: runData.corporateProfiles.email.updatedEnglishName,
        remark: runData.corporateProfiles.email.updatedRemark,
    });

    await editIncomingProfile(page, {
        accountNo: runData.incomingProfiles.approved.accountNo,
        rowTexts: [runData.incomingProfiles.approved.remark],
        status: runData.incomingProfiles.approved.updatedStatus ?? UI_TEXT.status.inactive,
        remark: runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
    });

    // ------- 7. Sign out creator -------
    await signOut(page);

    // ------- 8. Login approver and approve update requests -------
    await loginWithMicrosoft(page, {
        username: CREDENTIALS.approver,
        useAnotherAccount: true,
    });

    await actOnPendingRequest(page, {
        tab: UI_TEXT.tabs.corporate,
        texts: [
            runData.corporateProfiles.email.corporateId,
            runData.corporateProfiles.email.updatedRemark,
            PATTERNS.updateRequest,
        ],
        action: 'approve',
    });

    await actOnPendingRequest(page, {
        tab: UI_TEXT.tabs.incoming,
        texts: [
            runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
            PATTERNS.updateRequest,
        ],
        action: 'approve',
    });

    // ------- 9. Sign out approver -------
    await signOut(page);

    // ------- 10. Login creator and verify updated data -------
    await loginWithMicrosoft(page);

    await searchCorporateProfile(page, runData.corporateProfiles.email.corporateId);
    const updatedCorporateRow = await findTableRowByTexts(page, [
        runData.corporateProfiles.email.corporateId,
        runData.corporateProfiles.email.updatedEnglishName,
        runData.corporateProfiles.email.updatedRemark,
    ]);
    await expect(updatedCorporateRow).toContainText(
        runData.corporateProfiles.email.updatedEnglishName
    );
    await expect(updatedCorporateRow).toContainText(
        runData.corporateProfiles.email.updatedRemark
    );

    await searchIncomingProfile(page, runData.incomingProfiles.approved.accountNo);
    const updatedIncomingRow = await findTableRowByTexts(page, [
        runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
        runData.incomingProfiles.approved.updatedStatus ?? UI_TEXT.status.inactive,
    ]);
    await expect(updatedIncomingRow).toContainText(
        runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated
    );
    await expect(updatedIncomingRow).toContainText(
        runData.incomingProfiles.approved.updatedStatus ?? UI_TEXT.status.inactive
    );

    // ------- 11. Delete updated records -------
    await deleteCorporateProfile(page, {
        corporateId: runData.corporateProfiles.email.corporateId,
        rowTexts: [
            runData.corporateProfiles.email.corporateId,
            runData.corporateProfiles.email.updatedRemark,
        ],
    });

    await deleteIncomingProfile(page, {
        accountNo: runData.incomingProfiles.approved.accountNo,
        rowTexts: [
            runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
            runData.incomingProfiles.approved.updatedStatus ?? UI_TEXT.status.inactive,
        ],
    });

    // ------- 12. Sign out creator -------
    await signOut(page);

    // ------- 13. Login approver and approve delete requests -------
    await loginWithMicrosoft(page, {
        username: CREDENTIALS.approver,
        useAnotherAccount: true,
    });

    await actOnPendingRequest(page, {
        tab: UI_TEXT.tabs.corporate,
        texts: [
            runData.corporateProfiles.email.corporateId,
            runData.corporateProfiles.email.updatedRemark,
            PATTERNS.deleteRequest,
        ],
        action: 'approve',
    });

    await actOnPendingRequest(page, {
        tab: UI_TEXT.tabs.incoming,
        texts: [
            runData.incomingProfiles.approved.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
            PATTERNS.deleteRequest,
        ],
        action: 'approve',
    });

    // ------- 14. Final sign out -------
    await signOut(page);
});
