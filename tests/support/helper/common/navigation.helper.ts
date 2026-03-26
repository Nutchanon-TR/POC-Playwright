import { expect, type Page } from '@playwright/test';
import { UI_TEXT, URLS } from '../../constant';
import type { PendingRequestTab } from '../types';

export async function openCorporateProfiles(page: Page) {
    const corporateProfilesLink = page.getByRole('link', { name: UI_TEXT.menu.corporateProfiles });

    // Check if the menu is already expanded
    const isVisible = await corporateProfilesLink.isVisible({ timeout: 1000 }).catch(() => false);

    if (!isVisible) {
        // Expand the Corporate Report menu
        const corporateReportMenu = page.getByText(UI_TEXT.menu.corporateReport);
        await expect(corporateReportMenu).toBeVisible();
        await corporateReportMenu.click({ force: true });
        await expect(corporateProfilesLink).toBeVisible();
    }

    await corporateProfilesLink.click();
    await expect(page).toHaveURL(URLS.corporateProfilesPattern);
}

export async function openIncomingProfiles(page: Page) {
    const incomingProfilesLink = page.getByRole('link', { name: UI_TEXT.menu.incomingProfiles });

    // Check if the menu is already expanded
    const isVisible = await incomingProfilesLink.isVisible({ timeout: 1000 }).catch(() => false);

    if (!isVisible) {
        // Expand the Corporate Report menu
        const corporateReportMenu = page.getByText(UI_TEXT.menu.corporateReport);
        await expect(corporateReportMenu).toBeVisible();
        await corporateReportMenu.click({ force: true });
        await expect(incomingProfilesLink).toBeVisible();
    }

    await incomingProfilesLink.click();
    await expect(page).toHaveURL(URLS.incomingProfilesPattern);
}

export async function openPendingRequests(
    page: Page,
    tab: PendingRequestTab = UI_TEXT.tabs.corporate
) {
    // Wait for the page to be fully loaded and stable
    await page.waitForLoadState('domcontentloaded');

    // Check if we're already on the Pending Requests page
    const currentUrl = page.url();
    const isOnPendingRequestsPage = currentUrl.includes('/pending-requests');

    if (!isOnPendingRequestsPage) {
        const corporateReportMenu = page.getByText(UI_TEXT.menu.corporateReport);
        await expect(corporateReportMenu).toBeVisible({ timeout: 15000 });

        // Check if the menu is already expanded by looking for the Pending Requests link
        const pendingRequestsLink = page.getByRole('link', { name: UI_TEXT.menu.pendingRequests });
        const isExpanded = await pendingRequestsLink.isVisible({ timeout: 1000 }).catch(() => false);

        // Only click to expand if not already expanded
        if (!isExpanded) {
            // Use force: true to bypass any overlays (like success messages)
            await corporateReportMenu.click({ force: true });
            await expect(pendingRequestsLink).toBeVisible();
        }

        // Click the link and wait for URL change
        await pendingRequestsLink.click();
        await expect(page).toHaveURL(/\/corporate-report\/pending-requests/);

        // Wait for the page to load by checking for the table
        await page.waitForSelector('table', { timeout: 10000 });
    }

    // Wait for the page to load and find the horizontal menu tab
    // Use a more specific selector to avoid matching sidebar menu items
    const pendingRequestTab = page.locator('[role="menuitem"]').filter({ hasText: new RegExp(`^${tab}$`) }).first();
    await expect(pendingRequestTab).toBeVisible();

    // Check if the tab is already active
    const isTabActive = await pendingRequestTab.getAttribute('class').then(cls => cls?.includes('active')).catch(() => false);

    // Only click if not already active
    if (!isTabActive) {
        await pendingRequestTab.click();
        // Wait for the table to be visible (it should reload with new data)
        await page.waitForSelector('table', { state: 'visible', timeout: 10000 });
    }
}
