import { type Page } from '@playwright/test';

import { LoginPage } from '../pages/login.page';

export async function loginWithCredentials(page: Page, identifier: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillCredentials(identifier, password);
  await loginPage.submit();
}

export async function submitLoginForm(
  page: Page,
  identifier: string,
  password: string,
  options?: { goto?: boolean; remember?: boolean }
) {
  const loginPage = new LoginPage(page);

  if (options?.goto) {
    await loginPage.goto();
  }

  await loginPage.fillCredentials(identifier, password);

  if (options?.remember !== undefined) {
    await loginPage.setRemember(options.remember);
  }

  await loginPage.submit();
}
