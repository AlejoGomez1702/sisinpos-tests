import { expect, type Page } from '@playwright/test';

export async function expectPublicArea(page: Page) {
  const hasLoginForm = (await page.getByLabel('Correo o usuario').count()) > 0;
  const hasLoginButton = (await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).count()) > 0;

  expect(hasLoginForm || hasLoginButton).toBeTruthy();
}
