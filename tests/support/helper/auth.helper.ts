import { expect, type Page } from '@playwright/test';
import { CREDENTIALS, SELECTORS, UI_TEXT, URLS } from '../constant';

type LoginOptions = {
    username?: string;
    password?: string;
    useAnotherAccount?: boolean;
};

export async function loginWithMicrosoft(
    page: Page,
    options: LoginOptions = {}
) {
    const {
        username = CREDENTIALS.creator,
        password = CREDENTIALS.password,
        useAnotherAccount = false,
    } = options;

    await page.goto(URLS.login);

    await page.getByRole('button', { name: UI_TEXT.buttons.accept }).click();
    await page
        .getByRole('button', { name: UI_TEXT.buttons.microsoftLogin })
        .click();

    if (useAnotherAccount) {
        await page
            .getByRole('button', { name: UI_TEXT.buttons.useAnotherAccount })
            .click();
    }

    await page.getByRole('textbox', { name: UI_TEXT.fields.username }).click();
    await page.getByRole('textbox', { name: UI_TEXT.fields.username }).fill(username);
    await page.getByRole('button', { name: UI_TEXT.buttons.next }).click();

    await page.getByRole('textbox', { name: UI_TEXT.fields.password }).click();
    await page.locator(SELECTORS.passwordInput).fill(password);
    await page.getByRole('button', { name: UI_TEXT.buttons.signIn }).click();

    if (!useAnotherAccount) {
        await page.getByRole('button', { name: UI_TEXT.buttons.staySignedIn }).click();
    }

    await expect(page.getByText(UI_TEXT.portalTitle)).toBeVisible();
}

export async function signOut(page: Page) {
    await page.getByText(UI_TEXT.menu.signOut).click();
    await page.getByRole('button', { name: UI_TEXT.buttons.signOut }).click();
    await expect(page).toHaveURL(URLS.loginPattern);
    await expect(
        page.getByRole('button', { name: UI_TEXT.buttons.microsoftLogin })
    ).toBeVisible();
}
