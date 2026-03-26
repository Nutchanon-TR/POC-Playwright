import { expect, type Page } from '@playwright/test';
import { UI_TEXT, URLS } from '../../constant';
import type { PendingRequestTab } from '../types';

export async function openCorporateProfiles(page: Page) {
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: UI_TEXT.menu.corporateProfiles }).click();
}

export async function openIncomingProfiles(page: Page) {
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: UI_TEXT.menu.incomingProfiles }).click();
}

export async function openPendingRequests(
    page: Page,
    tab: PendingRequestTab = UI_TEXT.tabs.corporate
) {
    await page.getByText(UI_TEXT.menu.corporateReport).click();
    await page.getByRole('link', { name: UI_TEXT.menu.pendingRequests }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(UI_TEXT.menu.pendingRequests)).toBeVisible();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: tab }).click();
}
