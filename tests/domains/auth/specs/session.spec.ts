import { expect, test } from '../fixtures/auth.fixture';
import { clickFirstVisible } from '../../../shared/utils/page.utils';

test.describe('Auth - Sesión @mocked @auth-mocked', () => {
  test('debe limpiar sesión al cerrar sesión', async ({ loggedInPage: page }) => {
    await expect(page).toHaveURL(/\/dashboard/);

    await clickFirstVisible([
      page.getByRole('button', { name: /qa\s*▼/i }),
      page.getByRole('button', { name: /qa/i }),
      page.getByRole('button', { name: /perfil|cuenta|usuario|menu|menú/i }),
      page.getByRole('button', { name: /qa user/i }),
    ]);

    const logoutClicked = await clickFirstVisible([
      page.getByRole('button', { name: /cerrar sesi[oó]n|salir|logout/i }),
      page.getByRole('menuitem', { name: /cerrar sesi[oó]n|salir|logout/i }),
      page.getByRole('link', { name: /cerrar sesi[oó]n|salir|logout/i }),
      page.getByText(/cerrar sesi[oó]n|salir|logout/i),
    ]);

    expect(logoutClicked).toBeTruthy();
    await expect(page).toHaveURL(/\/(auth\/login)?$/);
    await expect(page.getByRole('button', { name: /iniciar sesi[oó]n/i })).toBeVisible();
  });
});
