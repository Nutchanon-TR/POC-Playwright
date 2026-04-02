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
    createIncomingProfile,
    deleteIncomingProfile,
    expectEmptyState,
    expectNotificationMessage,
    fillIncomingProfileForm,
    findTableRowByTexts,
    formatIncomingAccountPattern,
    loginWithMicrosoft,
    openIncomingProfileAddForm,
    searchIncomingProfile,
    selectFirstIncomingCorporateId,
    signOut,
    todayAsDdMmYyyy,
} from './support/helper';

test('Incoming Profile End-to-End Flow', async ({ page }) => {
    test.setTimeout(600000);
    const runData = buildTestRunData();
    const approvedIncoming = runData.incomingProfiles.approved;
    const rejectedIncoming = runData.incomingProfiles.rejected;

    await test.step('Part 1: Maker verifies empty state and negative create cases', async () => {
        await loginWithMicrosoft(page);

        await searchIncomingProfile(page, '0000000000');
        await expectEmptyState(page);

        await openIncomingProfileAddForm(page);
        await selectFirstIncomingCorporateId(page);
        await fillIncomingProfileForm(page, {
            effectiveDate: todayAsDdMmYyyy(),
            remark: 'Incoming missing account check',
        });
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
        await page.getByRole('button', { name: /Clear/i }).click();

        await openIncomingProfileAddForm(page);
        await selectFirstIncomingCorporateId(page);
        await fillIncomingProfileForm(page, {
            accountNo: 'ABC1234567',
            effectiveDate: todayAsDdMmYyyy(),
            remark: 'Incoming non-numeric account format',
        });
        await page.getByPlaceholder(UI_TEXT.placeholders.incomingRemark).click();
        await expect(page.getByText(TEST_CONTENT.validationMessages.incomingAccountNo)).toBeVisible();
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
        await page.getByRole('button', { name: /Clear/i }).click();

        await openIncomingProfileAddForm(page);
        await selectFirstIncomingCorporateId(page);
        await fillIncomingProfileForm(page, {
            accountNo: '12345',
            effectiveDate: todayAsDdMmYyyy(),
            remark: 'Incoming invalid account format',
        });
        await page.getByPlaceholder(UI_TEXT.placeholders.incomingRemark).click();
        await expect(page.getByText(TEST_CONTENT.validationMessages.incomingAccountNo)).toBeVisible();
        await expect(page.getByRole('button', { name: UI_TEXT.buttons.submit })).toBeDisabled();
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

    await test.step('Part 2: Approver approves and rejects incoming create requests', async () => {
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

    await test.step('Part 3: Maker performs negative edit checks and submits a valid update', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator.username,
            password: CREDENTIALS.creator.password,
            useAnotherAccount: true,
        });

        await searchIncomingProfile(page, approvedIncoming.accountNo);
        const approvedRow = await findTableRowByTexts(page, [approvedIncoming.remark]);
        await clickRowAction(approvedRow, 'edit');

        const accountField = page.getByPlaceholder(UI_TEXT.placeholders.accountNo);
        const remarkField = page.getByPlaceholder(UI_TEXT.placeholders.incomingRemark);
        const submitButton = page.getByRole('button', { name: UI_TEXT.buttons.genericSubmit });

        await expect(
            page.getByRole('heading', { name: UI_TEXT.headings.incomingProfileDetails })
        ).toBeVisible();

        await accountField.fill('');
        await remarkField.click();
        await expect(submitButton).toBeDisabled();

        await accountField.fill('1234');
        await remarkField.fill(' invalid incoming remark');
        await accountField.click();
        await expect(page.getByText(TEST_CONTENT.validationMessages.incomingAccountNo)).toBeVisible();
        await expect(page.getByText(TEST_CONTENT.validationMessages.remarkFormat)).toBeVisible();

        await accountField.fill(approvedIncoming.updatedAccountNo ?? '');
        await page.locator('label').filter({ hasText: approvedIncoming.updatedStatus ?? UI_TEXT.status.inactive }).click();
        await remarkField.fill(approvedIncoming.updatedRemark ?? '');
        await expect(submitButton).toBeEnabled();
        await submitButton.click();
        await confirmVisibleDialog(page, PATTERNS.confirmSubmit);
        await closeSuccessDialog(page);

        await signOut(page);
    });

    await test.step('Part 4: Approver approves the incoming update request', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver.username,
            password: CREDENTIALS.approver.password,
            useAnotherAccount: true,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.incoming,
            texts: [
                formatIncomingAccountPattern(approvedIncoming.updatedAccountNo || approvedIncoming.accountNo),
                approvedIncoming.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
                PATTERNS.updateRequest,
            ],
            action: 'approve',
        });

        await signOut(page);
    });

    await test.step('Part 5: Maker verifies update and submits incoming delete request', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator.username,
            password: CREDENTIALS.creator.password,
            useAnotherAccount: true,
        });

        await searchIncomingProfile(page, approvedIncoming.updatedAccountNo || approvedIncoming.accountNo);
        const updatedRow = await findTableRowByTexts(page, [
            approvedIncoming.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
            approvedIncoming.updatedStatus ?? UI_TEXT.status.inactive,
        ]);
        await expect(updatedRow).toContainText(
            approvedIncoming.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated
        );
        await expect(updatedRow).toContainText(
            approvedIncoming.updatedStatus ?? UI_TEXT.status.inactive
        );

        await deleteIncomingProfile(page, {
            accountNo: approvedIncoming.updatedAccountNo || approvedIncoming.accountNo,
            rowTexts: [
                approvedIncoming.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
                approvedIncoming.updatedStatus ?? UI_TEXT.status.inactive,
            ],
        });

        await signOut(page);
    });

    await test.step('Part 6: Approver approves incoming delete request', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.approver.username,
            password: CREDENTIALS.approver.password,
            useAnotherAccount: true,
        });

        await actOnPendingRequest(page, {
            tab: UI_TEXT.tabs.incoming,
            texts: [
                formatIncomingAccountPattern(approvedIncoming.updatedAccountNo || approvedIncoming.accountNo),
                approvedIncoming.updatedRemark ?? TEST_CONTENT.remarks.incomingUpdated,
                PATTERNS.deleteRequest,
            ],
            action: 'approve',
        });

        await signOut(page);
    });

    await test.step('Part 7: Maker verifies the incoming profile has been removed', async () => {
        await loginWithMicrosoft(page, {
            username: CREDENTIALS.creator.username,
            password: CREDENTIALS.creator.password,
            useAnotherAccount: true,
        });

        await searchIncomingProfile(page, approvedIncoming.updatedAccountNo || approvedIncoming.accountNo);
        await expectEmptyState(page);
    });
});
