import { expect, type Page, test } from '@playwright/test';

import { buildLoginResponse } from './helpers';

async function fillLoginForm(page: Page, identifier: string, password: string) {
  await page.getByLabel('Correo o usuario').fill(identifier);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
}

async function expectPublicArea(page: Page) {
  const hasLoginForm = (await page.getByLabel('Correo o usuario').count()) > 0;
  const hasLoginButton = (await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).count()) > 0;

  expect(hasLoginForm || hasLoginButton).toBeTruthy();
}

test.describe('Auth - Guards y Rutas Protegidas @auth-mocked', () => {
  test('debe redirigir a login cuando se intenta acceder a ruta protegida sin sesión', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/(auth\/login)?$/);
    await expectPublicArea(page);
  });

  test('debe permitir acceso a ruta protegida con sesión válida', async ({ page }) => {
    await page.goto('/auth/login');

    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildLoginResponse()),
      });
    });

    await fillLoginForm(page, 'qa@sisinpos.com', '123456');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('debe bloquear ruta protegida cuando la sesión ya no es válida', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'invalid-token');
      localStorage.setItem('accessToken', 'invalid-token');
      localStorage.setItem('authToken', 'invalid-token');
    });

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/(auth\/login)?$/);
    await expectPublicArea(page);
  });
});
