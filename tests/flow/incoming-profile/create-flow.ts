import { test } from '@playwright/test';
import {
    CREDENTIALS,
    TEST_CONTENT,
    UI_TEXT,
} from '../../support/constant';
import {
    actOnPendingRequest,
    createIncomingProfile,
    expectEmptyState,
    expectNotificationMessage,
    fillIncomingProfileForm,
    formatIncomingAccountPattern,
    loginWithMicrosoft,
    openIncomingProfileAddForm,
    searchIncomingProfile,
    selectFirstIncomingCorporateId,
    signOut,
    todayAsDdMmYyyy,
    type TestRunData,
} from '../../support/helper';

export function incomingCreateFlow(ctx: { runData: () => TestRunData }) {
    test('Create', async ({ page }) => {
        test.setTimeout(600000);

        await test.step('1. Maker validates form guards, creates profiles, verifies duplicate', async () => {
            const { approved: approvedIncoming, rejected: rejectedIncoming } = ctx.runData().incomingProfiles;

            await loginWithMicrosoft(page);

            await searchIncomingProfile(page, '0000000000');
            await expectEmptyState(page);

            await openIncomingProfileAddForm(page);
            await selectFirstIncomingCorporateId(page);
            await fillIncomingProfileForm(page, {
                effectiveDate: todayAsDdMmYyyy(),
                remark: 'Incoming missing account check',
            });
            await test.expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
            await page.getByRole('button', { name: /Clear/i }).click();

            await openIncomingProfileAddForm(page);
            await selectFirstIncomingCorporateId(page);
            await fillIncomingProfileForm(page, {
                accountNo: 'ABC1234567',
                effectiveDate: todayAsDdMmYyyy(),
                remark: 'Incoming non-numeric account format',
            });
            await page.getByPlaceholder(UI_TEXT.placeholders.incomingRemark).click();
            await test.expect(page.getByText(TEST_CONTENT.validationMessages.incomingAccountNo)).toBeVisible();
            await test.expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
            await page.getByRole('button', { name: /Clear/i }).click();

            await openIncomingProfileAddForm(page);
            await selectFirstIncomingCorporateId(page);
            await fillIncomingProfileForm(page, {
                accountNo: '12345',
                effectiveDate: todayAsDdMmYyyy(),
                remark: 'Incoming invalid account format',
            });
            await page.getByPlaceholder(UI_TEXT.placeholders.incomingRemark).click();
            await test.expect(page.getByText(TEST_CONTENT.validationMessages.incomingAccountNo)).toBeVisible();
            await test.expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
            await page.getByRole('button', { name: /Clear/i }).click();

            await createIncomingProfile(page, approvedIncoming);

            await openIncomingProfileAddForm(page);
            await selectFirstIncomingCorporateId(page);
            await fillIncomingProfileForm(page, {
                accountNo: approvedIncoming.accountNo,
                effectiveDate: todayAsDdMmYyyy(),
                remark: `${approvedIncoming.remark} duplicate`,
            });
            await page.getByRole('button', { name: UI_TEXT.buttons.submit }).click();
            await expectNotificationMessage(page, TEST_CONTENT.notifications.duplicatePendingRequest);
            await page.getByRole('button', { name: /Clear/i }).click();

            await createIncomingProfile(page, rejectedIncoming);
            await signOut(page);
        });

        await test.step('2. Approver approves and rejects create requests', async () => {
            const { approved: approvedIncoming, rejected: rejectedIncoming } = ctx.runData().incomingProfiles;

            await loginWithMicrosoft(page, {
                username: CREDENTIALS.approver.username,
                password: CREDENTIALS.approver.password,
                useAnotherAccount: true,
            });

            await actOnPendingRequest(page, {
                tab: UI_TEXT.tabs.incoming,
                texts: [formatIncomingAccountPattern(approvedIncoming.accountNo), approvedIncoming.remark],
                action: 'approve',
            });

            await actOnPendingRequest(page, {
                tab: UI_TEXT.tabs.incoming,
                texts: [formatIncomingAccountPattern(rejectedIncoming.accountNo), rejectedIncoming.remark],
                action: 'reject',
                remark: TEST_CONTENT.rejectReasons.incoming,
            });

            await signOut(page);
        });
    });
}
