import { expect, type Page, test } from '@playwright/test';

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
