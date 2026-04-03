import { expect, test } from '@playwright/test';
import {
    CREDENTIALS,
    TEST_CONTENT,
    UI_TEXT,
    URLS,
} from '../../support/constant';
import {
    actOnPendingRequest,
    closeNotificationAndClearForm,
    closeSuccessDialog,
    createEmailCorporateProfile,
    createSftpCorporateProfile,
    expectNotificationMessage,
    expectPendingRequestActionsHidden,
    fillCorporateProfileBaseFields,
    loginWithMicrosoft,
    openCorporateProfileAddForm,
    openEmailCreateForm,
    openSftpCreateForm,
    removeCorporateEmail,
    signOut,
    submitCorporateCreateForm,
    type TestRunData,
} from '../../support/helper';

export function corporateCreateFlow(ctx: { runData: () => TestRunData }) {
    test('Create', async ({ page }) => {
        test.setTimeout(600000);

        await test.step('1. Maker validates security & form guards', async () => {
            const runData = ctx.runData();
            const { sftpApproved, emailApproved } = runData.corporateProfiles;

            await loginWithMicrosoft(page);
            await expectPendingRequestActionsHidden(page);

            // SFTP create-form guards
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

            // Email create-form guards
            await openEmailCreateForm(page, {
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

            await openEmailCreateForm(page, {
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

            await openEmailCreateForm(page, emailApproved, {
                taxId: 'ABC123',
                emails: emailApproved.emails,
                checkRound1: true,
            });
            await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).click();
            await expect(page.getByText(TEST_CONTENT.validationMessages.taxIdDigits)).toBeVisible();
            await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
            await page.getByRole('button', { name: /Clear/i }).click();

            await openEmailCreateForm(page, emailApproved, {
                taxId: '123456',
                emails: emailApproved.emails,
                checkRound1: true,
            });
            await page.getByRole('textbox', { name: UI_TEXT.fields.remark }).click();
            await expect(page.getByText(TEST_CONTENT.validationMessages.taxIdMinLength)).toBeVisible();
            await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
            await page.getByRole('button', { name: /Clear/i }).click();
        });

        await test.step('2. Maker creates SFTP & Email profiles', async () => {
            const { sftpApproved, sftpRejected, emailApproved, emailRejected } = ctx.runData().corporateProfiles;
            const extraEmail = TEST_CONTENT.emails[2];

            await createSftpCorporateProfile(page, sftpApproved);
            await createSftpCorporateProfile(page, sftpRejected);

            await openEmailCreateForm(page, emailApproved, {
                taxId: emailApproved.taxId,
                emails: [...(emailApproved.emails ?? []), extraEmail],
                checkRound1: true,
            });
            await removeCorporateEmail(page, extraEmail);
            await submitCorporateCreateForm(page);
            await expect(page).toHaveURL(URLS.corporateProfilesPattern, { timeout: 15000 });
            await closeSuccessDialog(page);

            await createEmailCorporateProfile(page, emailRejected);
        });

        await test.step('3. Maker verifies duplicate blocking', async () => {
            const { sftpApproved, emailApproved } = ctx.runData().corporateProfiles;

            const reopenDuplicateSftpForm = async () => {
                await openSftpCreateForm(page, sftpApproved);
                await page.waitForTimeout(1000);
            };

            const reopenDuplicateEmailForm = async () => {
                await openEmailCreateForm(page, emailApproved, {
                    taxId: emailApproved.taxId,
                    emails: emailApproved.emails,
                    checkRound1: true,
                });
                await page.waitForTimeout(1000);
            };

            await reopenDuplicateSftpForm();
            await submitCorporateCreateForm(page);
            await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicateCorporateProfile);
            await closeNotificationAndClearForm(page);

            await reopenDuplicateEmailForm();
            await submitCorporateCreateForm(page);
            await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicateCorporateProfile);
            await closeNotificationAndClearForm(page);

            await signOut(page);
            await page.waitForTimeout(5000);
            await page.context().clearCookies();
        });

        await test.step('4. Approver approves and rejects create requests', async () => {
            const { sftpApproved, sftpRejected, emailApproved, emailRejected } = ctx.runData().corporateProfiles;

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
    });
}
