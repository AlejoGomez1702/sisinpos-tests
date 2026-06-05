import { expect, test } from '../../../shared/fixtures/base.fixture';
import { RegisterPage } from '../pages/register.page';
import { submitRegisterForm } from '../flows/register.flow';
import {
  mockRegisterCapturePayload,
  mockRegisterStatus,
  mockRegisterSuccess,
} from '../mocks/register.mocks';
import { registerUsers } from '../data/register.data';

test.describe('Auth - Registro @mocked @auth-mocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  // ── Renderizado inicial ─────────────────────────────────────────────────────

  test('debe mostrar el formulario con todos los campos vacíos y el botón deshabilitado', async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);

    await expect(registerPage.nameInput).toBeEmpty();
    await expect(registerPage.emailInput).toBeEmpty();
    await expect(registerPage.usernameInput).toBeEmpty();
    await expect(registerPage.cellphoneInput).toBeEmpty();
    await expect(registerPage.passwordInput).toBeEmpty();
    await expect(registerPage.repeatPasswordInput).toBeEmpty();
    await expect(registerPage.termsCheckbox).not.toBeChecked();
    await expect(registerPage.submitButton).toBeDisabled();
  });

  // ── Auto-fill del username desde el email ──────────────────────────────────

  test('debe rellenar el username automáticamente con la parte local del email', async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.fillEmail('qa.usuario@sisinpos.com');

    await expect(registerPage.usernameInput).toHaveValue('qa.usuario');
  });

  test('debe sanitizar el username auto-rellenado eliminando caracteres no permitidos', async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);

    // El carácter '+' no pertenece al conjunto [a-z0-9._-]
    await registerPage.fillEmail('user+filter@sisinpos.com');

    await expect(registerPage.usernameInput).not.toHaveValue(/\+/);
  });

  test('debe dejar de auto-rellenar el username cuando el usuario lo edita manualmente', async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.fillEmail('original@sisinpos.com');
    await expect(registerPage.usernameInput).toHaveValue('original');

    // El usuario edita el username manualmente
    await registerPage.fillUsername('mi-usuario-personalizado');

    // Cambiar el email no debe sobreescribir el username editado
    await registerPage.fillEmail('otro@sisinpos.com');

    await expect(registerPage.usernameInput).toHaveValue('mi-usuario-personalizado');
  });

  test('debe reactivar el auto-fill del username cuando el usuario lo vacía', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.fillEmail('qa@sisinpos.com');
    await registerPage.fillUsername('usuario-manual');
    await registerPage.fillEmail('nuevo@sisinpos.com');
    await expect(registerPage.usernameInput).toHaveValue('usuario-manual');

    // Vaciar el username reactiva el auto-fill
    await registerPage.usernameInput.clear();

    await expect(registerPage.usernameInput).toHaveValue('nuevo');
  });

  // ── Validaciones del formulario ────────────────────────────────────────────

  test('debe mantener el botón deshabilitado hasta que todos los campos requeridos estén completos', async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);

    // Campos completos sin términos
    await registerPage.fillName(registerUsers.valid.name);
    await registerPage.fillEmail(registerUsers.valid.email);
    await registerPage.fillCellphone(registerUsers.valid.cellphone);
    await registerPage.fillPassword(registerUsers.valid.password);
    await registerPage.fillRepeatPassword(registerUsers.valid.repeatPassword);

    await expect(registerPage.submitButton).toBeDisabled();

    // Acepta términos → habilita el botón
    await registerPage.acceptTerms();

    await expect(registerPage.submitButton).toBeEnabled();
  });

  test('debe mostrar error cuando las contraseñas no coinciden', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await registerPage.fillPassword('Password123');
    await registerPage.fillRepeatPassword('OtraClave456');
    await registerPage.repeatPasswordInput.press('Tab');

    await expect(page.getByText(/no coinciden|contraseñas/i)).toBeVisible();
  });

  test('debe mostrar errores de validación al tocar los campos requeridos y dejarlos vacíos', async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);

    // Tocar y salir de cada campo sin escribir
    await registerPage.nameInput.click();
    await registerPage.emailInput.click();
    await registerPage.cellphoneInput.click();
    await registerPage.passwordInput.click();
    await registerPage.repeatPasswordInput.click();
    await registerPage.nameInput.click(); // mueve el foco fuera de repeatPassword

    await expect(registerPage.submitButton).toBeDisabled();
    await expect(page.getByText(/requerido|obligatorio/i).first()).toBeVisible();
  });

  // ── Registro exitoso ───────────────────────────────────────────────────────

  test('debe redirigir a register-establishment tras un registro exitoso', async ({ page }) => {
    await mockRegisterSuccess(page);

    await submitRegisterForm(page, registerUsers.valid);

    await expect(page).toHaveURL(/\/auth\/register-establishment/);
  });

  test('debe almacenar el token en localStorage bajo la clave x-token', async ({ page }) => {
    await mockRegisterSuccess(page, { token: 'fake-jwt-token' });

    await submitRegisterForm(page, registerUsers.valid);

    await expect(page).toHaveURL(/\/auth\/register-establishment/);
    const token = await page.evaluate(() => localStorage.getItem('x-token'));
    expect(token).toBeTruthy();
    expect(token).toBe('fake-jwt-token');
  });

  test('debe enviar el payload correcto al backend sin incluir repeatPassword ni términos', async ({
    page,
  }) => {
    const getPayload = await mockRegisterCapturePayload(page);

    await submitRegisterForm(page, registerUsers.valid);

    await expect.poll(() => getPayload()).toBeTruthy();
    const payload = getPayload()!;

    expect(payload.name).toBe(registerUsers.valid.name);
    expect(payload.email).toBe(registerUsers.valid.email);
    expect(payload.username).toBe(registerUsers.valid.username);
    expect(payload.cellphone).toBe(registerUsers.valid.cellphone);
    expect(payload.password).toBe(registerUsers.valid.password);
    expect(payload).not.toHaveProperty('repeatPassword');
    expect(payload).not.toHaveProperty('termsAndConditions');
  });

  // ── Errores del servidor ───────────────────────────────────────────────────

  test('debe mostrar error y no redirigir cuando el email ya está registrado (400)', async ({
    page,
  }) => {
    await mockRegisterStatus(page, 400, 'El correo ya está registrado');

    await submitRegisterForm(page, registerUsers.valid);

    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.getByText(/correo|email|ya está|registrado/i)).toBeVisible();
  });

  test('debe mostrar error y no redirigir cuando el username ya está en uso (400)', async ({
    page,
  }) => {
    await mockRegisterStatus(page, 400, 'El nombre de usuario ya está en uso');

    await submitRegisterForm(page, registerUsers.valid);

    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.getByText(/usuario|ya está|en uso/i)).toBeVisible();
  });

  test('debe mantener el formulario funcional tras un error del servidor', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await mockRegisterStatus(page, 400, 'El correo ya está registrado');
    await submitRegisterForm(page, registerUsers.valid);
    await expect(page).toHaveURL(/\/auth\/register/);

    // El mock registrado de último tiene precedencia — el siguiente intento tendrá éxito
    await mockRegisterSuccess(page);
    await registerPage.fillEmail('otro.usuario@sisinpos.com');
    await registerPage.submit();

    await expect(page).toHaveURL(/\/auth\/register-establishment/);
  });
});
