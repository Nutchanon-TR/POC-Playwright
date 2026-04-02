import { expect, test } from '@playwright/test';
import {
    CREDENTIALS,
    PATTERNS,
    TEST_CONTENT,
    UI_TEXT,
    URLS,
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
    fillCorporateEmailFields,
    fillCorporateProfileBaseFields,
    findTableRowByTexts,
    loginWithMicrosoft,
    openCorporateProfileAddForm,
    openCorporateProfilesWithSearch,
    removeCorporateEmail,
    searchCorporateProfile,
    selectCorporateSendType,
    signOut,
    submitWithRetryOn429,
    type CorporateProfileData,
} from './support/helper';

test('Corporate Profile End-to-End Flow', async ({ page }) => {
    test.setTimeout(600000);
    const runData = buildTestRunData();
    const sftpApproved = runData.corporateProfiles.sftpApproved;
    const sftpRejected = runData.corporateProfiles.sftpRejected;
    const emailApproved = runData.corporateProfiles.emailApproved;
    const emailRejected = runData.corporateProfiles.emailRejected;
    const extraEmail = TEST_CONTENT.emails[2];

    const openSftpCreateForm = async (profile: CorporateProfileData) => {
        await openCorporateProfileAddForm(page);
        // SFTP is already selected by default, so we switch away and back to trigger Ant Design change detection.
        await page.locator('label').filter({ hasText: UI_TEXT.sendType.email }).click();
        await page.waitForTimeout(200);
        await selectCorporateSendType(page, profile.sendType);
        await fillCorporateProfileBaseFields(page, profile);
    };

    const openEmailCreateForm = async (
        profile: Pick<CorporateProfileData, 'corporateId' | 'thaiName' | 'englishName' | 'remark'>,
        emailOptions: {
            taxId?: string;
            emails?: string[];
            checkRound1?: boolean;
        } = {}
    ) => {
        await openCorporateProfileAddForm(page);
        await fillCorporateProfileBaseFields(page, profile);
        await selectCorporateSendType(page, 'Email');
        await fillCorporateEmailFields(page, emailOptions);
    };

    const submitCorporateCreateForm = async (
        logPrefix: string,
        options: {
            force?: boolean;
            settleDelayMs?: number;
            onRetry?: (attempt: number) => Promise<void> | void;
        } = {}
    ) => {
        await submitWithRetryOn429(page, async () => {
            const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });

            if (options.force) {
                await submitButton.click({ force: true });
                return;
            }

            const isEnabled = await submitButton.isEnabled().catch(() => false);
            if (isEnabled) {
                await submitButton.click();
                return;
            }

            await page.evaluate(() => {
                const formElement = document.querySelector('form[name="validateOnly"]');
                if (formElement) {
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    formElement.dispatchEvent(submitEvent);
                }
            });
        }, {
            logPrefix,
            onRetry: options.onRetry,
            settleDelayMs: options.settleDelayMs,
        });
    };

    const closeNotificationAndClearForm = async () => {
        const closeButton = page.getByLabel('Close', { exact: true }).first();
        const hasCloseButton = await closeButton.isVisible({ timeout: 1000 }).catch(() => false);

        if (hasCloseButton) {
            await closeButton.click();
            await page.waitForTimeout(500);
        }

        await page.getByRole('button', { name: /Clear/i }).click();
    };

    await test.step('Part 1: Maker validates security rules', async () => {
        await loginWithMicrosoft(page);
        await expectPendingRequestActionsHidden(page);
    });

    await test.step('Part 2: Maker validates SFTP create-form guards', async () => {
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
            englishName: sftpApproved.thaiName,
            remark: 'Corporate invalid format check',
        });
        await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).click();

        await expect(page.getByText(TEST_CONTENT.validationMessages.corporateIdFormat)).toBeVisible();
        await expect(page.getByText(TEST_CONTENT.validationMessages.corporateThaiNameFormat)).toBeVisible();
        await expect(page.getByText(TEST_CONTENT.validationMessages.corporateEnglishNameFormat)).toBeVisible();
        await page.getByRole('button', { name: /Clear/i }).click();
    });

    await test.step('Part 3: Maker creates SFTP profiles', async () => {
        await createSftpCorporateProfile(page, sftpApproved);
        await createSftpCorporateProfile(page, sftpRejected);
    });

    await test.step('Part 4: Maker validates Email create-form guards', async () => {
        await openEmailCreateForm({
            corporateId: `EMAIL-M-TAX-${runData.idSuffix}`,
            thaiName: emailApproved.thaiName,
            englishName: `${emailApproved.englishName} Missing Tax`,
            remark: 'Email missing tax id check',
        }, {
            emails: emailApproved.emails,
            checkRound1: true,
        });
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
        await page.getByRole('button', { name: /Clear/i }).click();

        await openEmailCreateForm({
            corporateId: `EMAIL-M-EMAIL-${runData.idSuffix}`,
            thaiName: emailApproved.thaiName,
            englishName: `${emailApproved.englishName} Missing Email`,
            remark: 'Email missing address check',
        }, {
            taxId: emailApproved.taxId,
            checkRound1: true,
        });
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
        await page.getByRole('button', { name: /Clear/i }).click();

        await openEmailCreateForm(emailApproved, {
            taxId: 'ABC123',
            emails: emailApproved.emails,
            checkRound1: true,
        });
        await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).click();
        await expect(page.getByText(TEST_CONTENT.validationMessages.taxIdDigits)).toBeVisible();
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
        await page.getByRole('button', { name: /Clear/i }).click();

        await openEmailCreateForm(emailApproved, {
            taxId: '123456',
            emails: emailApproved.emails,
            checkRound1: true,
        });
        await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).click();
        await expect(page.getByText(TEST_CONTENT.validationMessages.taxIdMinLength)).toBeVisible();
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
        await page.getByRole('button', { name: /Clear/i }).click();
    });

    await test.step('Part 5: Maker creates Email profiles', async () => {
        await openEmailCreateForm(emailApproved, {
            taxId: emailApproved.taxId,
            emails: [...(emailApproved.emails ?? []), extraEmail],
            checkRound1: true,
        });
        await removeCorporateEmail(page, extraEmail);
        await submitCorporateCreateForm('Create Approved Email Corporate Profile');
        await expect(page).toHaveURL(URLS.corporateProfilesPattern, { timeout: 15000 });
        await closeSuccessDialog(page);

        await createEmailCorporateProfile(page, emailRejected);
    });

    await test.step('Part 6: Maker verifies duplicate blocking', async () => {
        const reopenDuplicateSftpForm = async () => {
            await openSftpCreateForm(sftpApproved);
            await page.waitForTimeout(1000);
        };

        const reopenDuplicateEmailForm = async () => {
            await openEmailCreateForm(emailApproved, {
                taxId: emailApproved.taxId,
                emails: emailApproved.emails,
                checkRound1: true,
            });
            await page.waitForTimeout(1000);
        };

        await reopenDuplicateSftpForm();
        await submitCorporateCreateForm('Duplicate SFTP Corporate Profile', {
            force: true,
            settleDelayMs: 1500,
            onRetry: reopenDuplicateSftpForm,
        });
        await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicatePendingRequest);
        await closeNotificationAndClearForm();

        await reopenDuplicateEmailForm();
        await submitCorporateCreateForm('Duplicate Email Corporate Profile', {
            force: true,
            settleDelayMs: 1500,
            onRetry: reopenDuplicateEmailForm,
        });
        await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicatePendingRequest);
        await closeNotificationAndClearForm();

        await signOut(page);
        await page.waitForTimeout(5000);
        await page.context().clearCookies();
    });

    await test.step('Part 7: Approver approves and rejects 4 requests', async () => {
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver.username,
            password: CREDENTIALS.approver.password,
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
        await page.waitForTimeout(3000);
    });

    await test.step('Part 8: Maker negative edit and valid update', async () => {
        await page.waitForLoadState('networkidle');
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator.username,
            password: CREDENTIALS.creator.password,
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

        await englishNameField.fill(sftpApproved.thaiName);
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
        await page.waitForTimeout(3000);
    });

    await test.step('Part 9: Approver approves update', async () => {
        await page.waitForLoadState('networkidle');
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver.username,
            password: CREDENTIALS.approver.password,
            useAnotherAccount: true,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.corporate,
            texts: [emailApproved.corporateId, emailApproved.updatedRemark, PATTERNS.updateRequest],
            action: 'approve',
        });

        await signOut(page);
        await page.waitForTimeout(3000);
    });

    await test.step('Part 10: Maker verifies update and submits delete', async () => {
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

    await test.step('Part 11: Approver approves delete', async () => {
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

    await test.step('Part 12: Maker confirms deleted', async () => {
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
