import { expect, type Page } from '@playwright/test';
import { UI_TEXT, URLS } from '../constant';
import type { PendingRequestTab } from './types';

export async function openCorporateProfiles(page: Page) {
    await page.getByText(UI_TEXT.menu.corporateReport).click();
    await page.getByRole('link', { name: UI_TEXT.menu.corporateProfiles }).click();
    await expect(page.getByText(UI_TEXT.menu.corporateReport)).toBeVisible();
    await expect(page.getByText(UI_TEXT.menu.corporateProfiles)).toBeVisible();
    await expect(page).toHaveURL(URLS.corporateProfilesPattern);
}

export async function openIncomingProfiles(page: Page) {
    await page.getByText(UI_TEXT.menu.corporateReport).click();
    await page.getByRole('link', { name: UI_TEXT.menu.incomingProfiles }).click();
    await expect(page).toHaveURL(URLS.incomingProfilesPattern);
    await expect(page.getByText(UI_TEXT.menu.incomingProfiles)).toBeVisible();
}

export async function openPendingRequests(
    page: Page,
    tab: PendingRequestTab = UI_TEXT.tabs.corporate
) {
    await page.getByText(UI_TEXT.menu.corporateReport).click();
    await page.getByRole('link', { name: UI_TEXT.menu.pendingRequests }).click();
    await expect(page.getByText(UI_TEXT.menu.pendingRequests)).toBeVisible();
    await page.getByRole('menuitem', { name: tab }).click();
}
