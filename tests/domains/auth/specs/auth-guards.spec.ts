import { expect, test } from '../../../shared/fixtures/base.fixture';
import { expectPublicArea } from '../../../shared/utils/auth.assertions';
import {
  interceptCheckStatus,
  mockCheckStatusNetworkError,
  mockCheckStatusSuccess,
  mockCheckStatusUnauthorized,
  mockLoginSuccess,
} from '../mocks/auth.mocks';
import { submitLoginForm } from '../flows/login.flow';
import { authUsers } from '../data/users';

test.describe('Auth Guard - Rutas Protegidas @mocked @auth-mocked', () => {
  /**
   * Escenario 1: sin token en storage
   * getAuthToken() retorna null → el guard redirige inmediatamente, sin llamar a /auth/me
   */
  test.describe('sin token en storage', () => {
    test('debe redirigir a login sin llamar al servidor', async ({ page }) => {
      const wasCheckStatusCalled = await interceptCheckStatus(page);

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/(auth\/login)?$/);
      await expectPublicArea(page);
      expect(wasCheckStatusCalled()).toBe(false);
    });
  });

  /**
   * Escenario 2: token en storage, estado "checking"
   * Primera carga / recarga de página con token → el guard llama checkStatus (GET /auth/me)
   */
  test.describe('con token en storage — estado checking', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('token', 'stored-token');
        localStorage.setItem('accessToken', 'stored-token');
        localStorage.setItem('authToken', 'stored-token');
      });
    });

    test('debe permitir acceso cuando checkStatus confirma el token', async ({ page }) => {
      await mockCheckStatusSuccess(page);

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('debe redirigir a login cuando checkStatus rechaza el token (401)', async ({ page }) => {
      await mockCheckStatusUnauthorized(page);

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/(auth\/login)?$/);
      await expectPublicArea(page);
    });

    test('debe redirigir a login cuando checkStatus falla por error de red', async ({ page }) => {
      await mockCheckStatusNetworkError(page);

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/(auth\/login)?$/);
      await expectPublicArea(page);
    });
  });

  /**
   * Escenario 3: autenticado en memoria — mismo session post-login
   * authStatus() === 'authenticated' → el guard permite sin llamar checkStatus
   */
  test.describe('autenticado en memoria — post-login', () => {
    test('debe acceder al dashboard sin llamar checkStatus después del login', async ({ page }) => {
      const wasCheckStatusCalled = await interceptCheckStatus(page);

      await mockLoginSuccess(page);
      await submitLoginForm(page, authUsers.validAdmin.identifier, authUsers.validAdmin.password, {
        goto: true,
      });

      await expect(page).toHaveURL(/\/dashboard/);
      expect(wasCheckStatusCalled()).toBe(false);
    });
  });
});
