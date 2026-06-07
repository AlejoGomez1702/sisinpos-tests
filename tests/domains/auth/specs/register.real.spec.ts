import { expect, test } from '../../../shared/fixtures/base.fixture';
import { RegisterPage } from '../pages/register.page';
import { submitRegisterForm } from '../flows/register.flow';
import { buildUniqueUser } from '../data/register.data';

// Genera datos únicos por ejecución para evitar colisiones en la base de datos.
// NOTA: esta suite no hace teardown de los usuarios creados. Implementa el cleanup
// según lo que exponga tu backend (ej: DELETE /api/auth/users/:id desde un afterAll).

test.describe('Auth - Registro Real @real @auth-real', () => {
  // ── Registro completo end-to-end ───────────────────────────────────────────

  test('debe registrar un usuario nuevo y redirigir a register-establishment', async ({ page }) => {
    const user = buildUniqueUser();

    await submitRegisterForm(page, user, { goto: true });

    await expect(page).toHaveURL(/\/auth\/register-establishment/);
  });

  test('debe almacenar el token en localStorage bajo la clave x-token tras registro exitoso', async ({
    page,
  }) => {
    const user = buildUniqueUser();

    await submitRegisterForm(page, user, { goto: true });

    await expect(page).toHaveURL(/\/auth\/register-establishment/);
    const token = await page.evaluate(() => localStorage.getItem('x-token'));
    expect(token).toBeTruthy();
  });

  test('debe mantener la sesión al recargar la página después del registro', async ({ page }) => {
    const user = buildUniqueUser();

    await submitRegisterForm(page, user, { goto: true });
    await expect(page).toHaveURL(/\/auth\/register-establishment/);

    await page.reload();

    await expect(page).toHaveURL(/\/auth\/register-establishment/);
  });

  // ── Email duplicado ────────────────────────────────────────────────────────

  test('debe mostrar error al intentar registrar un email ya existente', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = buildUniqueUser();

    // Primer registro — debe ser exitoso
    await submitRegisterForm(page, user, { goto: true });
    await expect(page).toHaveURL(/\/auth\/register-establishment/);

    // Cerrar sesión: sin token el guard no intercepta la navegación a /auth/register
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Segundo intento con el mismo email — debe fallar
    await registerPage.goto();
    await registerPage.fillAll({
      name: `Otro ${user.name}`,
      email: user.email,
      username: `otro${user.username}`.slice(0, 50),
      cellphone: user.cellphone,
      password: user.password,
      repeatPassword: user.repeatPassword,
    });
    await registerPage.submit();

    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.getByText(/correo|email|ya está|registrado|duplicado/i)).toBeVisible();
  });

  // ── Guards post-registro ───────────────────────────────────────────────────
  // Verifica que los guards protegen las rutas después de un registro real.
  // Cada test crea un usuario único para ser independiente.

  test.describe('guards post-registro', () => {
    test('debe redirigir a register-establishment cuando intenta ir a /dashboard', async ({
      page,
    }) => {
      const user = buildUniqueUser();
      await submitRegisterForm(page, user, { goto: true });
      await expect(page).toHaveURL(/\/auth\/register-establishment/);

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/auth\/register-establishment/);
    });

    test('debe redirigir a register-establishment cuando intenta ir a /super-dashboard', async ({
      page,
    }) => {
      const user = buildUniqueUser();
      await submitRegisterForm(page, user, { goto: true });
      await expect(page).toHaveURL(/\/auth\/register-establishment/);

      await page.goto('/super-dashboard');

      await expect(page).toHaveURL(/\/auth\/register-establishment/);
    });

    test('debe redirigir a register-establishment cuando intenta ir a /auth/login', async ({
      page,
    }) => {
      const user = buildUniqueUser();
      await submitRegisterForm(page, user, { goto: true });
      await expect(page).toHaveURL(/\/auth\/register-establishment/);

      await page.goto('/auth/login');

      await expect(page).toHaveURL(/\/auth\/register-establishment/);
    });
  });

  test('debe mostrar error al intentar registrar un username ya existente', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const firstUser = buildUniqueUser();

    // Primer registro — debe ser exitoso
    await submitRegisterForm(page, firstUser, { goto: true });
    await expect(page).toHaveURL(/\/auth\/register-establishment/);

    // Cerrar sesión: sin token el guard no intercepta la navegación a /auth/register
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Segundo intento con mismo username pero email diferente
    const ts = Date.now();
    await registerPage.goto();
    await registerPage.fillAll({
      name: `Otro ${firstUser.name}`,
      email: `otro.${ts}@sisinpos.com`,
      username: firstUser.username,
      cellphone: firstUser.cellphone,
      password: firstUser.password,
      repeatPassword: firstUser.repeatPassword,
    });
    await registerPage.submit();

    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.getByText(/usuario|nombre de usuario|ya está|en uso|duplicado/i)).toBeVisible();
  });
});
