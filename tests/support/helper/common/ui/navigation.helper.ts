import { expect, type Page } from '@playwright/test';
import { UI_TEXT, URLS } from '../../../constant';
import type { PendingRequestTab } from '../../types';

export async function openCorporateProfiles(page: Page) {
    const corporateProfilesLink = page.getByRole('menuitem', { name: UI_TEXT.menu.corporateProfiles }).getByRole('link');

    const isVisible = await corporateProfilesLink.isVisible({ timeout: 1000 }).catch(() => false);

    if (!isVisible) {
        const corporateReportMenu = page.getByRole('complementary').getByText(UI_TEXT.menu.corporateReport);
        await expect(corporateReportMenu).toBeVisible();
        await corporateReportMenu.click({ force: true });
        await expect(corporateProfilesLink).toBeVisible();
    }

    await corporateProfilesLink.click();
    await expect(page).toHaveURL(URLS.corporateProfilesPattern);
}

export async function openIncomingProfiles(page: Page) {
    const incomingProfilesLink = page.getByRole('menuitem', { name: UI_TEXT.menu.incomingProfiles }).getByRole('link');

    const isVisible = await incomingProfilesLink.isVisible({ timeout: 1000 }).catch(() => false);

    if (!isVisible) {
        const corporateReportMenu = page.getByRole('complementary').getByText(UI_TEXT.menu.corporateReport);
        await expect(corporateReportMenu).toBeVisible();
        await corporateReportMenu.click({ force: true });
        await expect(incomingProfilesLink).toBeVisible();
    }

    await incomingProfilesLink.click();
    await expect(page).toHaveURL(URLS.incomingProfilesPattern, { timeout: 15000 });
}

export async function openPendingRequests(
    page: Page,
    tab: PendingRequestTab = UI_TEXT.tabs.corporate
) {
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    const isOnPendingRequestsPage = currentUrl.includes('/pending-requests');

    if (!isOnPendingRequestsPage) {
        const corporateReportMenu = page.getByRole('complementary').getByText(UI_TEXT.menu.corporateReport);
        await expect(corporateReportMenu).toBeVisible({ timeout: 15000 });

        const pendingRequestsLink = page.getByRole('menuitem', { name: UI_TEXT.menu.pendingRequests }).getByRole('link');
        const isExpanded = await pendingRequestsLink.isVisible({ timeout: 1000 }).catch(() => false);

        if (!isExpanded) {
            await corporateReportMenu.click({ force: true });
            await expect(pendingRequestsLink).toBeVisible();
        }

        await pendingRequestsLink.click();
        await expect(page).toHaveURL(/\/corporate-report\/pending-requests/);

        await page.waitForSelector('table', { timeout: 10000 });
    }

    const pendingRequestTab = page.locator('[role="menuitem"]').filter({ hasText: new RegExp(`^${tab}$`) }).first();
    await expect(pendingRequestTab).toBeVisible();

    const isTabActive = await pendingRequestTab.getAttribute('class').then(cls => cls?.includes('active')).catch(() => false);

    if (!isTabActive) {
        await pendingRequestTab.click();
        await page.waitForSelector('table', { state: 'visible', timeout: 10000 });
    }
}
