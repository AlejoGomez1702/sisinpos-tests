import { expect, test } from '../../../shared/fixtures/base.fixture';
import { expectPublicArea } from '../../../shared/utils/auth.assertions';
import { loginWithCredentials } from '../flows/login.flow';

const identifier = process.env.AUTH_REAL_IDENTIFIER;
const password = process.env.AUTH_REAL_PASSWORD;

const skipIfNoCredentials = (t: typeof test) =>
  t.skip(
    !identifier || !password,
    'Define AUTH_REAL_IDENTIFIER y AUTH_REAL_PASSWORD para ejecutar la suite real.'
  );

test.describe('Guards - Real @real @auth-real', () => {
  /**
   * Estos tests no requieren credenciales — validan el comportamiento de los guards
   * cuando no hay sesión válida, contra el backend real.
   */
  test.describe('sin sesión válida', () => {
    test('debe redirigir a login al acceder a ruta protegida sin token', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/(auth\/login)?$/);
      await expectPublicArea(page);
    });

    test('debe redirigir a login cuando el token en storage es inválido', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('token', 'token-invalido-xyz');
        localStorage.setItem('accessToken', 'token-invalido-xyz');
        localStorage.setItem('authToken', 'token-invalido-xyz');
      });

      await page.goto('/dashboard');

      // checkStatus real retorna 401 → guard redirige a login
      await expect(page).toHaveURL(/\/(auth\/login)?$/);
      await expectPublicArea(page);
    });
  });

  /**
   * Estos tests requieren credenciales reales válidas.
   */
  test.describe('con sesión válida', () => {
    test('debe permitir acceso al dashboard y mantenerlo al recargar la página', async ({
      page,
    }) => {
      skipIfNoCredentials(test);
      await loginWithCredentials(page, identifier!, password!);
      await expect(page).toHaveURL(/\/dashboard/);

      // Recarga → app inicia en estado 'checking' → authGuard llama checkStatus real → permite
      await page.reload();

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('debe redirigir a login cuando el token es removido y se recarga', async ({ page }) => {
      skipIfNoCredentials(test);
      await loginWithCredentials(page, identifier!, password!);
      await expect(page).toHaveURL(/\/dashboard/);

      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await page.reload();

      // Sin token: authGuard redirige sin llamar checkStatus
      await expect(page).toHaveURL(/\/(auth\/login)?$/);
    });

    test('debe redirigir al dashboard cuando el usuario autenticado intenta ir al login', async ({
      page,
    }) => {
      skipIfNoCredentials(test);
      await loginWithCredentials(page, identifier!, password!);
      await expect(page).toHaveURL(/\/dashboard/);

      // Browser back → notAuthenticatedGuard evalúa → authStatus='authenticated' → redirect
      await page.goBack();

      await expect(page).toHaveURL(/\/dashboard/);
    });
  });
});
