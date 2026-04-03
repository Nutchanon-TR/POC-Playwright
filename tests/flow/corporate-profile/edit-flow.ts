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
    closeSuccessDialog,
    confirmVisibleDialog,
    findTableRowByTexts,
    loginWithMicrosoft,
    searchCorporateProfile,
    signOut,
    type TestRunData,
} from '../../support/helper';

export function corporateEditFlow(ctx: { runData: () => TestRunData }) {
    test('Edit', async ({ page }) => {
        test.setTimeout(600000);

        await test.step('1. Maker validates edit guards and submits update', async () => {
            const { emailApproved, sftpApproved } = ctx.runData().corporateProfiles;

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

        await test.step('2. Approver approves update', async () => {
            const { emailApproved } = ctx.runData().corporateProfiles;

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
    });
}
