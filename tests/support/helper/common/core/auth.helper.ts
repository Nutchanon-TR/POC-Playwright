import { expect, type Page } from '@playwright/test';
import { CREDENTIALS, SELECTORS, UI_TEXT, URLS } from '../../../constant';

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
        username = CREDENTIALS.creator.username,
        password = CREDENTIALS.creator.password,
        useAnotherAccount = false,
    } = options;

    await page.goto(URLS.login);

    const acceptButton = page.getByRole('button', { name: UI_TEXT.buttons.accept });
    await expect(acceptButton).toBeVisible();
    await acceptButton.click();

    const microsoftLoginButton = page.getByRole('button', { name: UI_TEXT.buttons.microsoftLogin });
    await expect(microsoftLoginButton).toBeVisible();
    await microsoftLoginButton.click();

    if (useAnotherAccount) {
        const useAnotherAccountButton = page.getByRole('button', { name: UI_TEXT.buttons.useAnotherAccount });
        await expect(useAnotherAccountButton).toBeVisible({ timeout: 3000 });
        await useAnotherAccountButton.click();
    }

    await page.waitForLoadState('networkidle', { timeout: 15000 });
    const usernameField = page.getByRole('textbox', { name: UI_TEXT.fields.username });
    await expect(usernameField).toBeVisible({ timeout: 15000 });
    await usernameField.click();
    await usernameField.fill(username);

    const nextButton = page.getByRole('button', { name: UI_TEXT.buttons.next });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await page.getByRole('textbox', { name: UI_TEXT.fields.password }).click();
    await page.locator(SELECTORS.passwordInput).fill(password);
    await page.getByRole('button', { name: UI_TEXT.buttons.signIn }).click();

    if (!useAnotherAccount) {
        await page.getByRole('button', { name: UI_TEXT.buttons.staySignedIn }).click();
    }
}

export async function signOut(page: Page) {
    await page.getByText(UI_TEXT.menu.signOut).click();
    await page.getByRole('button', { name: UI_TEXT.buttons.signOut }).click();
    await expect(page).toHaveURL(URLS.loginPattern);
    await expect(
        page.getByRole('button', { name: UI_TEXT.buttons.microsoftLogin })
    ).toBeVisible();
}
