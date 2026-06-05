import { expect, test } from '../../../shared/fixtures/base.fixture';
import { LoginPage } from '../pages/login.page';
import { submitLoginForm } from '../flows/login.flow';
import { mockLoginStatus, mockLoginWithRateLimit } from '../mocks/auth.mocks';
import { expectPublicArea } from '../../../shared/utils/auth.assertions';
import { authUsers } from '../data/users';

test.describe('Auth - Seguridad de Comportamiento @mocked @auth-mocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('debe aplicar bloqueo o protección tras múltiples intentos fallidos', async ({ page }) => {
    const getAttempts = await mockLoginWithRateLimit(page, { failBefore: 3 });
    const loginPage = new LoginPage(page);

    await loginPage.fillCredentials(
      authUsers.invalidUser.identifier,
      authUsers.invalidUser.password
    );

    await loginPage.submit();
    await loginPage.submit();
    await loginPage.submit();

    await expect.poll(() => getAttempts()).toBe(3);
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('no debe filtrar información sensible en mensajes de error', async ({ page }) => {
    await mockLoginStatus(page, 401, 'stacktrace: db_password=secret123');

    await submitLoginForm(
      page,
      authUsers.invalidUser.identifier,
      authUsers.invalidUser.password
    );

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
