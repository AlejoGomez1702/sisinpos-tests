import { expect, test } from '../../../shared/fixtures/base.fixture';
import { loginWithCredentials, submitLoginForm } from '../flows/login.flow';
import { LoginPage } from '../pages/login.page';

const identifier = process.env.AUTH_REAL_IDENTIFIER;
const password = process.env.AUTH_REAL_PASSWORD;

const skipIfNoCredentials = (t: typeof test) =>
  t.skip(
    !identifier || !password,
    'Define AUTH_REAL_IDENTIFIER y AUTH_REAL_PASSWORD para ejecutar la suite real.'
  );

test.describe('Auth Domain - Login Real @real @auth-real', () => {
  test('debe autenticar contra backend real y redirigir al dashboard', async ({ page }) => {
    skipIfNoCredentials(test);
    await loginWithCredentials(page, identifier!, password!);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('debe rechazar credenciales inválidas y mantener el formulario listo para reintentar', async ({
    page,
  }) => {
    skipIfNoCredentials(test);
    const loginPage = new LoginPage(page);

    await submitLoginForm(page, 'invalido@sisinpos.com', 'clave-incorrecta', { goto: true });

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('debe almacenar sesión en storage tras autenticación exitosa', async ({ page }) => {
    skipIfNoCredentials(test);
    await loginWithCredentials(page, identifier!, password!);
    await expect(page).not.toHaveURL(/\/auth\/login/);

    const tokenFound = await page.evaluate(() =>
      [...Array(localStorage.length)].some((_, i) => {
        const key = localStorage.key(i) ?? '';
        const val = localStorage.getItem(key) ?? '';
        return val.length > 20;
      })
    );

    expect(tokenFound).toBeTruthy();
  });

  test('debe mantener la sesión al recargar la página', async ({ page }) => {
    skipIfNoCredentials(test);
    await loginWithCredentials(page, identifier!, password!);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.reload();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('debe redirigir a login cuando el token es eliminado manualmente', async ({ page }) => {
    skipIfNoCredentials(test);
    await loginWithCredentials(page, identifier!, password!);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.reload();

    await expect(page).toHaveURL(/\/(auth\/login)?$/);
  });
});
