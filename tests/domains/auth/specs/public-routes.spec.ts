import { expect, test } from '../../../shared/fixtures/base.fixture';
import {
  mockCheckStatusSuccess,
  mockCheckStatusSuccessWithDelay,
  mockCheckStatusUnauthorized,
  mockLoginSuccess,
} from '../mocks/auth.mocks';
import { submitLoginForm } from '../flows/login.flow';
import { authUsers } from '../data/users';

test.describe('Not Authenticated Guard - Rutas Públicas @mocked @auth-mocked', () => {
  /**
   * Escenario 1: sin sesión activa
   * authStatus() === 'not-authenticated' → el guard permite acceso a la ruta pública
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
   * authStatus() === 'authenticated' → el guard llama resolvePostLoginRoute(user) y redirige
   * Se verifica con browser back (no recarga, Angular mantiene el estado en memoria)
   */
  test.describe('autenticado en memoria — post-login', () => {
    test('debe redirigir a /dashboard cuando ADMIN con establecimiento intenta volver al login', async ({
      page,
    }) => {
      await mockLoginSuccess(page);
      await submitLoginForm(page, authUsers.validAdmin.identifier, authUsers.validAdmin.password, {
        goto: true,
      });
      await expect(page).toHaveURL(/\/dashboard/);

      await page.goBack();

      // resolvePostLoginRoute(ADMIN con establecimiento) → /dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('debe redirigir a /auth/register-establishment cuando ADMIN sin establecimiento intenta volver al login', async ({
      page,
    }) => {
      await mockLoginSuccess(page, { establishment: null });
      await submitLoginForm(page, authUsers.validAdmin.identifier, authUsers.validAdmin.password, {
        goto: true,
      });
      await expect(page).toHaveURL(/\/auth\/register-establishment/);

      await page.goBack();

      // resolvePostLoginRoute(ADMIN sin establecimiento) → /auth/register-establishment
      await expect(page).toHaveURL(/\/auth\/register-establishment/);
    });

    test('debe redirigir a /super-dashboard cuando SUPER_ADMIN intenta volver al login', async ({
      page,
    }) => {
      await mockLoginSuccess(page, { rol: 'SUPER_ADMIN_ROLE', establishment: null });
      await submitLoginForm(page, authUsers.validAdmin.identifier, authUsers.validAdmin.password, {
        goto: true,
      });
      await expect(page).toHaveURL(/\/super-dashboard/);

      await page.goBack();

      // resolvePostLoginRoute(SUPER_ADMIN) → /super-dashboard
      await expect(page).toHaveURL(/\/super-dashboard/);
    });
  });

  /**
   * Escenario 3: token en storage, estado "checking"
   * authStatus() === 'checking' → el guard espera a que el observable (checkStatus) resuelva
   * antes de decidir si permite o redirige. La página de login no se muestra durante la espera.
   */
  test.describe('con token en storage — estado checking', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('x-token', 'stored-token');
      });
    });

    test('debe redirigir al destino correcto sin mostrar el formulario mientras resuelve checkStatus', async ({
      page,
    }) => {
      // Mock con delay de 500ms — el guard espera en el observable antes de decidir
      await mockCheckStatusSuccessWithDelay(page, 500);

      await page.goto('/auth/login');

      // El formulario de login NO debe aparecer: el router retiene la navegación
      // mientras el guard espera que checkStatus resuelva
      await expect(page.getByRole('button', { name: /iniciar sesi[oó]n/i })).not.toBeVisible();

      // Una vez resuelto con usuario autenticado, redirige al destino
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    });

    test('debe permitir acceso al login cuando checkStatus confirma que el token es inválido', async ({
      page,
    }) => {
      await mockCheckStatusUnauthorized(page);

      await page.goto('/auth/login');

      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.getByRole('button', { name: /iniciar sesi[oó]n/i })).toBeVisible();
    });

    test('debe permitir acceso al login cuando checkStatus falla (token válido pero sin uso)', async ({
      page,
    }) => {
      await mockCheckStatusSuccess(page);

      await page.goto('/auth/login');

      // Durante checking + checkStatus con éxito, el guard redirige al destino del usuario
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    });
  });
});
