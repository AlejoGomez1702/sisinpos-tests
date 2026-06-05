import { type Page } from '@playwright/test';
import { test as base, expect } from '../../../shared/fixtures/base.fixture';
import { mockLoginSuccess } from '../mocks/auth.mocks';
import { submitLoginForm } from '../flows/login.flow';
import { authUsers } from '../data/users';

type AuthFixtures = {
  loggedInPage: Page;
};

export const test = base.extend<AuthFixtures>({
  loggedInPage: async ({ page }, use) => {
    await mockLoginSuccess(page);
    await submitLoginForm(page, authUsers.validAdmin.identifier, authUsers.validAdmin.password, {
      goto: true,
    });
    await page.waitForURL(/\/dashboard/);
    await use(page);
  },
});

export { expect };
