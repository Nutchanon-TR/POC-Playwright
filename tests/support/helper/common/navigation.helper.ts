import { expect, type Page } from '@playwright/test';
import { UI_TEXT, URLS } from '../../constant';
import type { PendingRequestTab } from '../types';

export async function openCorporateProfiles(page: Page) {
    const corporateProfilesLink = page.getByRole('link', { name: UI_TEXT.menu.corporateProfiles });
    await expect(corporateProfilesLink).toBeVisible();
    await corporateProfilesLink.click();
}

export async function openIncomingProfiles(page: Page) {
    const incomingProfilesLink = page.getByRole('link', { name: UI_TEXT.menu.incomingProfiles });
    await expect(incomingProfilesLink).toBeVisible();
    await incomingProfilesLink.click();
}

export async function openPendingRequests(
    page: Page,
    tab: PendingRequestTab = UI_TEXT.tabs.corporate
) {
    const corporateReportMenu = page.getByText(UI_TEXT.menu.corporateReport);
    await expect(corporateReportMenu).toBeVisible();
    await corporateReportMenu.click();

    const pendingRequestsLink = page.getByRole('link', { name: UI_TEXT.menu.pendingRequests });
    await expect(pendingRequestsLink).toBeVisible();
    await pendingRequestsLink.click();

    const pendingRequestTab = page.getByRole('menuitem', { name: tab });
    await expect(pendingRequestTab).toBeVisible();
    const pendingRequestsLoadPromise = page.waitForResponse(
        (res) =>
            res.url().includes('/corporate-report/v1/') &&
            res.status() === 200 &&
            res.request().method() === 'GET' &&
            res.url().toLowerCase().includes('pending')
    );
    await pendingRequestTab.click();
    await pendingRequestsLoadPromise;
}
