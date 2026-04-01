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
    clickRowAction,
    closeSuccessDialog,
    confirmVisibleDialog,
    createEmailCorporateProfile,
    createSftpCorporateProfile,
    deleteCorporateProfile,
    expectEmptyState,
    expectNotificationMessage,
    expectPendingRequestActionsHidden,
    findTableRowByTexts,
    fillCorporateEmailFields,
    fillCorporateProfileBaseFields,
    loginWithMicrosoft,
    openCorporateProfileAddForm,
    openCorporateProfilesWithSearch,
    removeCorporateEmail,
    searchCorporateProfile,
    selectCorporateSendType,
    signOut,
} from './support/helper';

test('Corporate Profile End-to-End Flow', async ({ page }) => {
    test.setTimeout(600000);
    const runData = buildTestRunData();
    const sftpApproved = runData.corporateProfiles.sftpApproved;
    const sftpRejected = runData.corporateProfiles.sftpRejected;
    const emailApproved = runData.corporateProfiles.emailApproved;
    const emailRejected = runData.corporateProfiles.emailRejected;
    const extraEmail = TEST_CONTENT.emails[2];

    await test.step('Part 1: Maker validates security rules and create-form guards', async () => {
        await loginWithMicrosoft(page);

        await expectPendingRequestActionsHidden(page);

        await openCorporateProfileAddForm(page);
        await page.getByRole('textbox', { name: UI_TEXT.fields.corporateId }).fill(`SFTP-M-${runData.idSuffix}`);
        await page
            .getByRole('textbox', { name: UI_TEXT.fields.corporateNameEnglish })
            .fill('Autotest Missing Thai');
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
        await page.getByRole('button', { name: /Clear/i }).click();

        await openCorporateProfileAddForm(page);
        await fillCorporateProfileBaseFields(page, {
            corporateId: `SFTP@${runData.idSuffix}`,
            thaiName: 'Invalid Thai Name',
            englishName: 'ชื่อภาษาไทย',
            remark: 'Corporate invalid format check',
        });
        await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).click();

        await expect(page.getByText(TEST_CONTENT.validationMessages.corporateIdFormat)).toBeVisible();
        await expect(page.getByText(TEST_CONTENT.validationMessages.corporateThaiNameFormat)).toBeVisible();
        await expect(page.getByText(TEST_CONTENT.validationMessages.corporateEnglishNameFormat)).toBeVisible();

        await fillCorporateProfileBaseFields(page, sftpApproved);
        await selectCorporateSendType(page, sftpApproved.sendType);
        await page.getByRole('button', { name: UI_TEXT.buttons.submit }).click();
        await closeSuccessDialog(page);

        await createSftpCorporateProfile(page, sftpRejected);

        await openCorporateProfileAddForm(page);
        await fillCorporateProfileBaseFields(page, {
            corporateId: `EMAIL-M-TAX-${runData.idSuffix}`,
            thaiName: emailApproved.thaiName,
            englishName: `${emailApproved.englishName} Missing Tax`,
            remark: 'Email missing tax id check',
        });
        await selectCorporateSendType(page, 'Email');
        await fillCorporateEmailFields(page, {
            emails: emailApproved.emails,
            checkRound1: true,
        });
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
        await page.getByRole('button', { name: /Clear/i }).click();

        await openCorporateProfileAddForm(page);
        await fillCorporateProfileBaseFields(page, {
            corporateId: `EMAIL-M-EMAIL-${runData.idSuffix}`,
            thaiName: emailApproved.thaiName,
            englishName: `${emailApproved.englishName} Missing Email`,
            remark: 'Email missing address check',
        });
        await selectCorporateSendType(page, 'Email');
        await fillCorporateEmailFields(page, {
            taxId: emailApproved.taxId,
            checkRound1: true,
        });
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
        await page.getByRole('button', { name: /Clear/i }).click();

        await openCorporateProfileAddForm(page);
        await fillCorporateProfileBaseFields(page, emailApproved);
        await selectCorporateSendType(page, emailApproved.sendType);
        await fillCorporateEmailFields(page, {
            taxId: 'ABC123',
            emails: [...(emailApproved.emails ?? []), extraEmail],
            checkRound1: true,
        });
        await removeCorporateEmail(page, extraEmail);
        await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).click();
        await expect(page.getByText(TEST_CONTENT.validationMessages.taxIdDigits)).toBeVisible();
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();

        await page.getByPlaceholder(UI_TEXT.placeholders.taxId).fill(emailApproved.taxId ?? '');
        await page.getByRole('button', { name: UI_TEXT.buttons.submit }).click();
        await closeSuccessDialog(page);

        await createEmailCorporateProfile(page, emailRejected);
    });

    await test.step('Part 2: Maker verifies duplicate pending request blocking', async () => {
        await openCorporateProfileAddForm(page);
        await fillCorporateProfileBaseFields(page, sftpApproved);
        await selectCorporateSendType(page, sftpApproved.sendType);
        await page.getByRole('button', { name: UI_TEXT.buttons.submit }).click();
        await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicatePendingRequest);
        await page.getByRole('button', { name: /Clear/i }).click();

        await openCorporateProfileAddForm(page);
        await fillCorporateProfileBaseFields(page, emailApproved);
        await selectCorporateSendType(page, emailApproved.sendType);
        await fillCorporateEmailFields(page, {
            taxId: emailApproved.taxId,
            emails: emailApproved.emails,
            checkRound1: true,
        });
        await page.getByRole('button', { name: UI_TEXT.buttons.submit }).click();
        await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicatePendingRequest);
        await page.getByRole('button', { name: /Clear/i }).click();

        await signOut(page);
    });

    await test.step('Part 3: Approver approves and rejects the four corporate requests', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver,
            useAnotherAccount: true,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.corporate,
            texts: [emailApproved.corporateId, UI_TEXT.sendType.email, emailApproved.remark],
            action: 'approve',
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.corporate,
            texts: [emailRejected.corporateId, UI_TEXT.sendType.email, emailRejected.remark],
            action: 'reject',
            remark: TEST_CONTENT.rejectReasons.email,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.corporate,
            texts: [sftpApproved.corporateId, UI_TEXT.sendType.sftp, sftpApproved.remark],
            action: 'approve',
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.corporate,
            texts: [sftpRejected.corporateId, UI_TEXT.sendType.sftp, sftpRejected.remark],
            action: 'reject',
            remark: TEST_CONTENT.rejectReasons.sftp,
        });

        await signOut(page);
    });

    await test.step('Part 4: Maker performs negative edit checks and submits a valid update', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator,
            useAnotherAccount: true,
        });

        await searchCorporateProfile(page, emailApproved.corporateId);
        const emailApprovedRow = await findTableRowByTexts(page, [
            emailApproved.corporateId,
            emailApproved.englishName,
            emailApproved.remark,
        ]);
        await clickRowAction(emailApprovedRow, 'edit');

        const englishNameField = page.getByRole('textbox', {
            name: UI_TEXT.fields.corporateNameEnglish,
        });
        const remarkField = page.getByRole('textbox', { name: UI_TEXT.fields.remark });
        const saveButton = page.getByRole('button', { name: UI_TEXT.buttons.save });

        await expect(
            page.getByRole('heading', { name: UI_TEXT.headings.corporateProfileDetails })
        ).toBeVisible();

        await englishNameField.fill('');
        await remarkField.click();
        await expect(saveButton).toBeDisabled();

        await englishNameField.fill('ชื่อภาษาไทย');
        await remarkField.fill(' invalid corporate remark');
        await englishNameField.click();
        await expect(page.getByText(TEST_CONTENT.validationMessages.corporateEnglishNameFormat)).toBeVisible();
        await expect(page.getByText(TEST_CONTENT.validationMessages.remarkFormat)).toBeVisible();

        await englishNameField.fill(emailApproved.updatedEnglishName);
        await remarkField.fill(emailApproved.updatedRemark);
        await expect(saveButton).toBeEnabled();
        await saveButton.click();
        await confirmVisibleDialog(page, PATTERNS.confirmSave);
        await closeSuccessDialog(page);

        await signOut(page);
    });

    await test.step('Part 5: Approver approves the corporate update request', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver,
            useAnotherAccount: true,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.corporate,
            texts: [emailApproved.corporateId, emailApproved.updatedRemark, PATTERNS.updateRequest],
            action: 'approve',
        });

        await signOut(page);
    });

    await test.step('Part 6: Maker verifies update and submits corporate delete request', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator,
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
    });

    await test.step('Part 7: Approver approves corporate delete request', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver,
            useAnotherAccount: true,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.corporate,
            texts: [emailApproved.corporateId, emailApproved.updatedRemark, PATTERNS.deleteRequest],
            action: 'approve',
        });

        await signOut(page);
    });

    await test.step('Part 8: Maker confirms the deleted corporate profile is gone', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator,
            useAnotherAccount: true,
        });

        await openCorporateProfilesWithSearch(page, emailApproved.corporateId);
        await expectEmptyState(page);
    });
});
