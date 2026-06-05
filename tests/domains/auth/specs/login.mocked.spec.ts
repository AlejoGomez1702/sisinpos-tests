import { expect, test } from '../../../shared/fixtures/base.fixture';
import { submitLoginForm } from '../flows/login.flow';
import { LoginPage } from '../pages/login.page';
import { mockLoginCapturePayload, mockLoginStatus, mockLoginSuccess, mockNetworkError } from '../mocks/auth.mocks';
import { authUsers } from '../data/users';

test.describe('Auth Domain - Login Mocked @mocked @auth-mocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('debe iniciar sesion exitosamente con credenciales validas', async ({ page }) => {
    await mockLoginSuccess(page);

    await submitLoginForm(page, 'qa@sisinpos.com', '123456');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('button', { name: /qa/i })).toBeVisible();
  });

  test('debe redirigir al dashboard cuando el usuario tiene establecimiento', async ({ page }) => {
    await mockLoginSuccess(page, {
      establishment: {
        id: 'est-2',
        name: 'Sede Norte',
        type: 'STORE',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    });

    await submitLoginForm(page, 'qa@sisinpos.com', '123456');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Sede Norte')).toBeVisible();
  });

  test('debe mantener sesion segun configuracion esperada del producto', async ({ page }) => {
    await mockLoginSuccess(page);

    await submitLoginForm(page, 'qa@sisinpos.com', '123456');
    await expect(page).toHaveURL(/\/dashboard/);

    const storedValues = await page.evaluate(() => {
      const values: string[] = [];

      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key) {
          values.push(localStorage.getItem(key) ?? '');
        }
      }

      for (let i = 0; i < sessionStorage.length; i += 1) {
        const key = sessionStorage.key(i);
        if (key) {
          values.push(sessionStorage.getItem(key) ?? '');
        }
      }

      return values;
    });

    expect(storedValues.some((value) => value.includes('fake-jwt-token'))).toBeTruthy();
  });

  test('debe mantener el boton deshabilitado si el formulario es invalido', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await expect(loginPage.submitButton).toBeDisabled();

    await loginPage.identifierInput.fill('qa@sisinpos.com');
    await expect(loginPage.submitButton).toBeDisabled();

    await loginPage.passwordInput.fill('123');
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('debe validar campos requeridos', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await expect(loginPage.identifierInput).toHaveAttribute('aria-required', 'true');
    await expect(loginPage.passwordInput).toHaveAttribute('aria-required', 'true');

    await loginPage.fillCredentials('qa@sisinpos.com', '123456');
    await expect(loginPage.submitButton).toBeEnabled();

    await loginPage.identifierInput.clear();
    await expect(loginPage.submitButton).toBeDisabled();

    await loginPage.identifierInput.fill('qa@sisinpos.com');
    await loginPage.passwordInput.clear();
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('debe validar formato de correo o usuario segun reglas del negocio', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.passwordInput.fill('123456');

    await loginPage.identifierInput.fill('qa@sisinpos.com');
    await expect(loginPage.submitButton).toBeEnabled();

    await loginPage.identifierInput.fill('qa.user');
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('debe mostrar mensaje cuando las credenciales son invalidas (401)', async ({ page }) => {
    await mockLoginStatus(page, 401, 'Credenciales inválidas');

    await submitLoginForm(page, 'bad.user', 'bad-pass');

    await expect(page.getByText('Usuario o contraseña incorrectos.')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('debe manejar limite de intentos o rate limit (429)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await mockLoginStatus(page, 429, 'Demasiados intentos. Intenta más tarde.');

    await submitLoginForm(page, 'qa@sisinpos.com', '123456');

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('debe manejar errores temporales del servidor (5xx)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await mockLoginStatus(page, 500, 'Error temporal del servidor');

    await submitLoginForm(page, 'qa@sisinpos.com', '123456');

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('debe enviar remember=true cuando se marca recordar sesion', async ({ page }) => {
    const getPayload = await mockLoginCapturePayload(page);

    await submitLoginForm(page, 'qa@sisinpos.com', '123456', { remember: true });

    await expect.poll(() => getPayload()?.remember).toBe(true);
  });

  test('debe enviar remember=false cuando no se marca recordar sesion', async ({ page }) => {
    const getPayload = await mockLoginCapturePayload(page);

    await submitLoginForm(page, 'qa@sisinpos.com', '123456', { remember: false });

    await expect.poll(() => getPayload()?.remember).toBe(false);
  });

  test('debe enviar identifier y password correctos en el payload', async ({ page }) => {
    const getPayload = await mockLoginCapturePayload(page);

    await submitLoginForm(page, authUsers.validAdmin.identifier, authUsers.validAdmin.password);

    await expect.poll(() => getPayload()?.identifier).toBe(authUsers.validAdmin.identifier);
    await expect.poll(() => getPayload()?.password).toBe(authUsers.validAdmin.password);
  });

  test('debe manejar error de red de forma controlada', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await mockNetworkError(page);

    await submitLoginForm(page, authUsers.validAdmin.identifier, authUsers.validAdmin.password);

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('debe permitir reintentar tras un intento fallido', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await mockLoginStatus(page, 401, 'Credenciales inválidas');
    await submitLoginForm(page, authUsers.invalidUser.identifier, authUsers.invalidUser.password);
    await expect(page.getByText('Usuario o contraseña incorrectos.')).toBeVisible();
    await expect(loginPage.submitButton).toBeEnabled();

    // El mock registrado de último tiene precedencia — el siguiente intento tendrá éxito
    await mockLoginSuccess(page);
    await loginPage.fillCredentials(authUsers.validAdmin.identifier, authUsers.validAdmin.password);
    await loginPage.submit();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
