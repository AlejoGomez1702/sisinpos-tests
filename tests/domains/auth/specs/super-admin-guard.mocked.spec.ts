import { expect, test } from '../../../shared/fixtures/base.fixture';
import {
  mockCheckStatusSuccess,
  mockCheckStatusSuperAdmin,
  mockCheckStatusWithoutEstablishment,
} from '../mocks/auth.mocks';

// superAdminGuard protege /super-dashboard.
// Lógica: SUPER_ADMIN → permite | cualquier otro rol → resolvePostLoginRoute(user):
//   con establecimiento → /dashboard | sin establecimiento → /auth/register-establishment
// authGuard se evalúa primero: sin token → /auth/login

test.describe('Super Admin Guard - /super-dashboard @mocked @auth-mocked', () => {
  /**
   * Escenario 1: SUPER_ADMIN — el guard permite acceso
   */
  test.describe('SUPER_ADMIN', () => {
    test('debe permitir acceso a /super-dashboard', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('x-token', 'fake-token');
        localStorage.setItem(
          'user_data',
          JSON.stringify({ id: 'u-super', rol: 'SUPER_ADMIN_ROLE', establishment: null })
        );
      });
      await mockCheckStatusSuperAdmin(page);

      await page.goto('/super-dashboard');

      await expect(page).toHaveURL(/\/super-dashboard/);
    });
  });

  /**
   * Escenario 2: ADMIN con establecimiento
   * superAdminGuard: rol distinto de SUPER_ADMIN → resolvePostLoginRoute → /dashboard
   */
  test.describe('ADMIN con establecimiento', () => {
    test('debe redirigir a /dashboard', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('x-token', 'fake-token');
        localStorage.setItem(
          'user_data',
          JSON.stringify({
            id: 'u1',
            rol: 'ADMIN_ROLE',
            establishment: { id: 'est-1', name: 'Mi Negocio', type: 'TIENDA' },
          })
        );
      });
      await mockCheckStatusSuccess(page);

      await page.goto('/super-dashboard');

      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  /**
   * Escenario 3: ADMIN sin establecimiento
   * superAdminGuard: rol distinto de SUPER_ADMIN → resolvePostLoginRoute → /auth/register-establishment
   */
  test.describe('ADMIN sin establecimiento', () => {
    test('debe redirigir a /auth/register-establishment', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('x-token', 'fake-token');
        localStorage.setItem(
          'user_data',
          JSON.stringify({ id: 'u1', rol: 'ADMIN_ROLE', establishment: null })
        );
      });
      await mockCheckStatusWithoutEstablishment(page);

      await page.goto('/super-dashboard');

      await expect(page).toHaveURL(/\/auth\/register-establishment/);
    });
  });

  /**
   * Escenario 4: sin sesión
   * authGuard actúa primero: sin token → /auth/login (sin llegar al superAdminGuard)
   */
  test.describe('sin sesión', () => {
    test('debe redirigir a /auth/login por acción del authGuard', async ({ page }) => {
      await page.goto('/super-dashboard');

      await expect(page).toHaveURL(/\/(auth\/login)?$/);
    });
  });
});
