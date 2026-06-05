import { expect, test } from '../../../shared/fixtures/base.fixture';
import {
  mockCheckStatusSuccess,
  mockCheckStatusUnauthorized,
  mockLoginSuccess,
} from '../mocks/auth.mocks';
import { submitLoginForm } from '../flows/login.flow';
import { authUsers } from '../data/users';

test.describe('Not Authenticated Guard - Rutas Públicas @mocked @auth-mocked', () => {
  /**
   * Escenario 1: sin sesión activa
   * authStatus() === 'unauthenticated' → el guard permite acceso a la ruta pública
   */
  test.describe('sin sesión activa', () => {
    test('debe permitir acceso a la página de login', async ({ page }) => {
      await page.goto('/auth/login');

      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.getByRole('button', { name: /iniciar sesi[oó]n/i })).toBeVisible();
    });

    test('debe mostrar el formulario de login completo y funcional', async ({ page }) => {
      await page.goto('/auth/login');

      await expect(page.getByLabel('Correo o usuario')).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Contraseña' })).toBeVisible();
      await expect(page.getByRole('button', { name: /iniciar sesi[oó]n/i })).toBeVisible();
    });
  });

  /**
   * Escenario 2: autenticado en memoria — mismo session post-login
   * authStatus() === 'authenticated' → el guard redirige al dashboard y retorna false
   * Se verifica con navegación de browser back (no recarga la app, Angular mantiene el estado)
   */
  test.describe('autenticado en memoria — post-login', () => {
    test('debe redirigir al dashboard cuando el usuario autenticado intenta volver al login', async ({
      page,
    }) => {
      await mockLoginSuccess(page);
      await submitLoginForm(page, authUsers.validAdmin.identifier, authUsers.validAdmin.password, {
        goto: true,
      });
      await expect(page).toHaveURL(/\/dashboard/);

      // Browser back → Angular Router re-evalúa notAuthenticatedGuard
      // authStatus === 'authenticated' → guard redirige al dashboard y retorna false
      await page.goBack();

      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  /**
   * Escenario 3: token en storage, estado "checking"
   * authStatus() === 'checking' → el guard devuelve true (permite acceso a la ruta pública)
   * El authGuard verificará el token real cuando el usuario intente acceder a una ruta protegida
   */
  test.describe('con token en storage — estado checking', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('token', 'stored-token');
        localStorage.setItem('accessToken', 'stored-token');
        localStorage.setItem('authToken', 'stored-token');
      });
    });

    test('debe permitir acceso al login durante la verificación inicial con token válido', async ({
      page,
    }) => {
      await mockCheckStatusSuccess(page);

      await page.goto('/auth/login');

      // El guard permite acceso durante 'checking'
      // El formulario debe ser visible (aunque la app pueda redirigir después de confirmar auth)
      await expect(page.getByRole('button', { name: /iniciar sesi[oó]n/i })).toBeVisible();
    });

    test('debe permitir acceso al login durante la verificación inicial con token inválido', async ({
      page,
    }) => {
      await mockCheckStatusUnauthorized(page);

      await page.goto('/auth/login');

      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.getByRole('button', { name: /iniciar sesi[oó]n/i })).toBeVisible();
    });
  });
});
