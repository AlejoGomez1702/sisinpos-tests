import { expect, test } from '../../../shared/fixtures/base.fixture';
import { expectPublicArea } from '../../../shared/utils/auth.assertions';

test.describe('Auth - Guards y Rutas Protegidas @mocked @auth-mocked', () => {
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
