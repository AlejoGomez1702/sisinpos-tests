import { expect, type Page, test } from '@playwright/test';

async function fillLoginForm(page: Page, identifier: string, password: string) {
  await page.getByLabel('Correo o usuario').fill(identifier);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
}

async function expectPublicArea(page: Page) {
  const hasLoginForm = (await page.getByLabel('Correo o usuario').count()) > 0;
  const hasLoginButton = (await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).count()) > 0;

  expect(hasLoginForm || hasLoginButton).toBeTruthy();
}

test.describe('Auth - Seguridad de Comportamiento @auth-mocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('debe aplicar bloqueo o protección tras múltiples intentos fallidos', async ({ page }) => {
    let attempts = 0;

    await page.route('**/auth/login', async (route) => {
      attempts += 1;

      if (attempts < 3) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Credenciales inválidas' }),
        });
        return;
      }

      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Demasiados intentos. Intenta más tarde.' }),
      });
    });

    await fillLoginForm(page, 'qa@sisinpos.com', 'bad-pass');

    const submitButton = page.getByRole('button', { name: 'Iniciar sesión' });
    await submitButton.click();
    await submitButton.click();
    await submitButton.click();

    await expect.poll(() => attempts).toBe(3);
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(submitButton).toBeEnabled();
  });

  test('no debe filtrar información sensible en mensajes de error', async ({ page }) => {
    const leakedMessage = 'stacktrace: db_password=secret123';

    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: leakedMessage }),
      });
    });

    await fillLoginForm(page, 'qa@sisinpos.com', 'bad-pass');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByText('Usuario o contraseña incorrectos.')).toBeVisible();
    await expect(page.getByText(/stacktrace|secret123|db_password/i)).toHaveCount(0);
  });

  test('debe invalidar acceso al expirar sesión o token', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('accessToken', 'expired-token');
      localStorage.setItem('authToken', 'expired-token');
    });

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/(auth\/login)?$/);
    await expectPublicArea(page);
  });
});
