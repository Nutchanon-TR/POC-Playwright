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
        await page.getByRole('button', { name: /Clear/i }).click();

        await openCorporateProfileAddForm(page);
        // SFTP is default, so click Email first to create a change, then click SFTP
        await page.locator('label').filter({ hasText: UI_TEXT.sendType.email }).click();
        await page.waitForTimeout(200);
        await selectCorporateSendType(page, sftpApproved.sendType);
        await fillCorporateProfileBaseFields(page, sftpApproved);

        // Submit with retry on 429 error
        let submitAttempt = 0;
        const maxSubmitRetries = 3;
        let submitSuccess = false;

        while (submitAttempt < maxSubmitRetries && !submitSuccess) {
            submitAttempt++;
            let got429 = false;

            const responseHandler = (response: any) => {
                if (response.status() === 429 && response.url().includes('/corporate-profiles')) {
                    got429 = true;
                }
            };
            page.on('response', responseHandler);

            try {
                // WORKAROUND: Frontend bug - try to submit even if button disabled
                const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });

                try {
                    await expect(submitButton).toBeEnabled({ timeout: 3000 });
                    await submitButton.click();
                } catch {
                    await page.evaluate(() => {
                        const btn = document.querySelector('button[type="submit"]');
                        if (btn) btn.removeAttribute('disabled');
                    });
                    await page.waitForTimeout(500);
                    const isStillOnAddPage = await page.locator('text=Create New Corporate Profile').isVisible();
                    if (isStillOnAddPage) {
                        throw new Error('BLOCKING: Submit button stays disabled due to frontend bug.');
                    }
                }

                await page.waitForTimeout(1000);
                page.off('response', responseHandler);

                if (got429) {
                    console.log(`[Part 1 Submit - Attempt ${submitAttempt}/${maxSubmitRetries}] Got 429, waiting 5s...`);
                    await page.waitForTimeout(5000);
                    continue;
                }

                submitSuccess = true;
            } catch (error) {
                page.off('response', responseHandler);
                if (got429 && submitAttempt < maxSubmitRetries) {
                    console.log(`[Part 1 Submit - Attempt ${submitAttempt}/${maxSubmitRetries}] Got 429, waiting 5s...`);
                    await page.waitForTimeout(5000);
                    continue;
                }
                throw error;
            }
        }

        if (!submitSuccess) {
            throw new Error('Failed to submit after 3 attempts due to 429 rate limiting');
        }

        await expect(page).toHaveURL(URLS.corporateProfilesPattern, { timeout: 15000 });
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
        // WORKAROUND: Click Email first to trigger change detection
        await page.locator('label').filter({ hasText: UI_TEXT.sendType.email }).click();
        await page.waitForTimeout(200);
        await selectCorporateSendType(page, sftpApproved.sendType);
        await fillCorporateProfileBaseFields(page, sftpApproved);

        // Wait for form to stabilize
        await page.waitForTimeout(1000);

        // Submit with retry on 429 error
        let dupCheckAttempt = 0;
        const maxDupCheckRetries = 3;
        let gotDuplicateError = false;

        while (dupCheckAttempt < maxDupCheckRetries && !gotDuplicateError) {
            dupCheckAttempt++;
            let got429 = false;

            const responseHandler = (response: any) => {
                if (response.status() === 429 && response.url().includes('/corporate-profiles')) {
                    got429 = true;
                }
            };
            page.on('response', responseHandler);

            try {
                // Force click the submit button (bypassing disabled state)
                const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.submit });
                await submitButton.click({ force: true });

                // Wait for response/notification
                await page.waitForTimeout(1500);
                page.off('response', responseHandler);

                if (got429) {
                    console.log(`[Part 2 Duplicate Check - Attempt ${dupCheckAttempt}/${maxDupCheckRetries}] Got 429, waiting 5s...`);
                    await page.waitForTimeout(5000);
                    // Reload the form
                    await openCorporateProfileAddForm(page);
                    await page.locator('label').filter({ hasText: UI_TEXT.sendType.email }).click();
                    await page.waitForTimeout(200);
                    await selectCorporateSendType(page, sftpApproved.sendType);
                    await fillCorporateProfileBaseFields(page, sftpApproved);
                    await page.waitForTimeout(1000);
                    continue;
                }

                // Check if duplicate notification appeared
                const duplicateNotification = page.getByText(TEST_CONTENT.notifications.duplicatePendingRequest);
                const isDuplicateVisible = await duplicateNotification.isVisible({ timeout: 2000 }).catch(() => false);

                if (isDuplicateVisible) {
                    gotDuplicateError = true;
                } else {
                    // If we're still on the form page, submission didn't work
                    const stillOnForm = await page.locator('text=Create New Corporate Profile').isVisible({ timeout: 1000 }).catch(() => false);
                    if (stillOnForm && dupCheckAttempt < maxDupCheckRetries) {
                        console.log(`[Part 2 Duplicate Check - Attempt ${dupCheckAttempt}/${maxDupCheckRetries}] Submit didn't trigger, retrying...`);
                        await page.waitForTimeout(1000);
                        continue;
                    }
                }

                break;
            } catch (error) {
                page.off('response', responseHandler);
                if (got429 && dupCheckAttempt < maxDupCheckRetries) {
                    console.log(`[Part 2 Duplicate Check - Attempt ${dupCheckAttempt}/${maxDupCheckRetries}] Got 429, waiting 5s...`);
                    await page.waitForTimeout(5000);
                    await openCorporateProfileAddForm(page);
                    await page.locator('label').filter({ hasText: UI_TEXT.sendType.email }).click();
                    await page.waitForTimeout(200);
                    await selectCorporateSendType(page, sftpApproved.sendType);
                    await fillCorporateProfileBaseFields(page, sftpApproved);
                    await page.waitForTimeout(1000);
                    continue;
                }
                throw error;
            }
        }

        await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicatePendingRequest);

        // Close the notification first (it blocks the Clear button)
        await page.getByLabel('Close', { exact: true }).first().click();
        await page.waitForTimeout(500);

        await page.getByRole('button', { name: /Clear/i }).click();

        await openCorporateProfileAddForm(page);
        await fillCorporateProfileBaseFields(page, emailApproved);
        await selectCorporateSendType(page, emailApproved.sendType);
        await fillCorporateEmailFields(page, {
            taxId: emailApproved.taxId,
            emails: emailApproved.emails,
            checkRound1: true,
        });

        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: UI_TEXT.buttons.submit }).click();

        await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicatePendingRequest);
        await page.getByRole('button', { name: /Clear/i }).click();

        await signOut(page);
        // Wait for Microsoft to fully process sign out and clear all sessions
        await page.waitForTimeout(5000);
        // Clear any leftover storage/cache that might interfere with new login
        await page.context().clearCookies();
    });

    await test.step('Part 3: Approver approves and rejects the four corporate requests', async () => {
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Additional wait before login
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

    await test.step('Part 4: Maker performs negative edit checks and submits a valid update', async () => {
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
        await page.waitForTimeout(3000);
    });

    await test.step('Part 5: Approver approves the corporate update request', async () => {
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

    await test.step('Part 6: Maker verifies update and submits corporate delete request', async () => {
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

    await test.step('Part 7: Approver approves corporate delete request', async () => {
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

    await test.step('Part 8: Maker confirms the deleted corporate profile is gone', async () => {
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
