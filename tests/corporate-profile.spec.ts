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
    createSftpCorporateProfile,
    deleteCorporateProfile,
    editCorporateProfile,
    findTableRowByTexts,
    loginWithMicrosoft,
    searchCorporateProfile,
    signOut,
} from './support/helper';

test('Corporate Profile End-to-End Flow', async ({ page }) => {
    test.setTimeout(300000);
    const runData = buildTestRunData();

    await test.step('Part 1: Creator creates corporate profiles', async () => {
        await loginWithMicrosoft(page);
        await page.getByText(UI_TEXT.menu.corporateReport).click();

        await createSftpCorporateProfile(page, runData.corporateProfiles.sftp);
        await createEmailCorporateProfile(page, runData.corporateProfiles.email);

        await signOut(page);
    });

    await test.step('Part 2: Approver approves/rejects corporate profiles', async () => {
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

        await signOut(page);
    });

    await test.step('Part 3: Creator edits approved corporate profile', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator,
            useAnotherAccount: true,
        });

        await editCorporateProfile(page, {
            corporateId: runData.corporateProfiles.email.corporateId,
            rowTexts: [
                runData.corporateProfiles.email.corporateId,
                runData.corporateProfiles.email.englishName,
            ],
            englishName: runData.corporateProfiles.email.updatedEnglishName,
            remark: runData.corporateProfiles.email.updatedRemark,
        });

        await signOut(page);
    });

    await test.step('Part 4: Approver approves corporate update', async () => {
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

        await signOut(page);
    });

    await test.step('Part 5: Creator verifies and deletes corporate profile', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator,
            useAnotherAccount: true,
        });

        await searchCorporateProfile(page, runData.corporateProfiles.email.corporateId);
        const updatedRow = await findTableRowByTexts(page, [
            runData.corporateProfiles.email.corporateId,
            runData.corporateProfiles.email.updatedEnglishName,
            runData.corporateProfiles.email.updatedRemark,
        ]);
        await expect(updatedRow).toContainText(runData.corporateProfiles.email.updatedEnglishName);
        await expect(updatedRow).toContainText(runData.corporateProfiles.email.updatedRemark);

        await deleteCorporateProfile(page, {
            corporateId: runData.corporateProfiles.email.corporateId,
            rowTexts: [
                runData.corporateProfiles.email.corporateId,
                runData.corporateProfiles.email.updatedRemark,
            ],
        });

        await signOut(page);
    });

    await test.step('Part 6: Approver approves corporate delete', async () => {
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

        await signOut(page);
    });
});
