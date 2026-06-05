import { expect, test } from '../fixtures/auth.fixture';
import { RegisterEstablishmentPage } from '../pages/register-establishment.page';
import { submitEstablishmentForm } from '../flows/register-establishment.flow';
import { submitRegisterForm } from '../flows/register.flow';
import { mockEstablishmentStatus, mockEstablishmentSuccess } from '../mocks/establishment.mocks';
import {
  interceptCheckStatus,
  mockCheckStatusSuccess,
  mockCheckStatusSuperAdmin,
  mockCheckStatusWithoutEstablishment,
  mockRegisterSuccess,
} from '../mocks/auth.mocks';
import { establishmentData } from '../data/establishment.data';
import { registerUsers } from '../data/register.data';

test.describe('Onboarding de Establecimiento @mocked @auth-mocked', () => {
  // ── Formulario de onboarding ───────────────────────────────────────────────
  // Los tests de esta sección usan el fixture `registeredPage`:
  // usuario ADMIN_ROLE autenticado, sin establecimiento, en /auth/register-establishment.

  test.describe('formulario de onboarding', () => {
    test('debe ser accesible para un usuario autenticado sin establecimiento', async ({
      registeredPage: page,
    }) => {
      await expect(page).toHaveURL(/\/auth\/register-establishment/);
      const regEstPage = new RegisterEstablishmentPage(page);
      await expect(regEstPage.submitButton).toBeVisible();
    });

    test('debe mantener el botón deshabilitado hasta que los campos requeridos estén completos', async ({
      registeredPage: page,
    }) => {
      const regEstPage = new RegisterEstablishmentPage(page);

      await expect(regEstPage.submitButton).toBeDisabled();

      await regEstPage.selectType(establishmentData.valid.type);
      await regEstPage.fillName(establishmentData.valid.name);
      await expect(regEstPage.submitButton).toBeDisabled();

      await regEstPage.acceptTerms();
      await expect(regEstPage.submitButton).toBeEnabled();
    });

    test('debe mostrar errores al tocar los campos requeridos y dejarlos vacíos', async ({
      registeredPage: page,
    }) => {
      const regEstPage = new RegisterEstablishmentPage(page);

      await regEstPage.nameInput.click();
      await regEstPage.nameInput.press('Tab');

      await expect(regEstPage.submitButton).toBeDisabled();
      await expect(page.getByText(/requerido|obligatorio/i).first()).toBeVisible();
    });

    test('debe redirigir a /dashboard y actualizar localStorage sin llamar a /auth/me', async ({
      registeredPage: page,
    }) => {
      // Spy registrado DESPUÉS de la carga inicial: detecta llamadas solo durante el submit
      let checkStatusCalledAfterLoad = false;
      await page.route('**/auth/me', async (route) => {
        checkStatusCalledAfterLoad = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { token: 'x', user: {} } }),
        });
      });

      await mockEstablishmentSuccess(page, { token: 'new-fake-jwt-token' });
      await submitEstablishmentForm(page, establishmentData.valid);

      await expect(page).toHaveURL(/\/dashboard/);
      expect(checkStatusCalledAfterLoad).toBe(false);

      const token = await page.evaluate(() => localStorage.getItem('x-token'));
      expect(token).toBe('new-fake-jwt-token');

      const rawEstData = await page.evaluate(() => localStorage.getItem('establishment_data'));
      expect(rawEstData).toBeTruthy();
      const estData = JSON.parse(rawEstData!);
      expect(estData.name).toBeTruthy();
    });

    test('debe mostrar error y no redirigir cuando el servidor rechaza el onboarding', async ({
      registeredPage: page,
    }) => {
      await mockEstablishmentStatus(page, 400, 'El nombre del establecimiento ya existe');

      await submitEstablishmentForm(page, establishmentData.valid);

      await expect(page).toHaveURL(/\/auth\/register-establishment/);
      await expect(page.getByText(/nombre|establecimiento|existe|registrado/i)).toBeVisible();
    });
  });

  // ── Guard de establecimiento ───────────────────────────────────────────────
  // Protege /dashboard. Verifica redirección según rol y estado de establecimiento.

  test.describe('guard de establecimiento', () => {
    test('debe redirigir a register-establishment cuando ADMIN no tiene establecimiento', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        localStorage.setItem('x-token', 'fake-token');
        localStorage.setItem(
          'user_data',
          JSON.stringify({ id: 'u1', rol: 'ADMIN_ROLE', establishment: null })
        );
      });
      await mockCheckStatusWithoutEstablishment(page);

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/auth\/register-establishment/);
    });

    test('debe permitir acceso a /dashboard cuando ADMIN tiene establecimiento', async ({
      page,
    }) => {
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
      // mockCheckStatusSuccess devuelve un usuario con establecimiento
      await mockCheckStatusSuccess(page);

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('debe permitir acceso a SUPER_ADMIN aunque no tenga establecimiento', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('x-token', 'fake-token');
        localStorage.setItem(
          'user_data',
          JSON.stringify({ id: 'u-super', rol: 'SUPER_ADMIN_ROLE', establishment: null })
        );
      });
      await mockCheckStatusSuperAdmin(page);

      await page.goto('/dashboard');

      await expect(page).not.toHaveURL(/\/auth\/register-establishment/);
    });
  });

  // ── Flujo completo (funnel de dos pasos) ──────────────────────────────────

  test.describe('funnel completo registro → onboarding', () => {
    test('debe completar ambos formularios en secuencia y llegar al dashboard', async ({ page }) => {
      const wasCheckStatusCalled = await interceptCheckStatus(page);
      await mockRegisterSuccess(page, { token: 'register-token' });
      await mockEstablishmentSuccess(page, { token: 'establishment-token' });

      // Paso 1: Registro
      await submitRegisterForm(page, registerUsers.valid, { goto: true });
      await expect(page).toHaveURL(/\/auth\/register-establishment/);
      expect(wasCheckStatusCalled()).toBe(false);

      // Paso 2: Onboarding
      await submitEstablishmentForm(page, establishmentData.valid);
      await expect(page).toHaveURL(/\/dashboard/);

      // Estado final de localStorage
      expect(await page.evaluate(() => localStorage.getItem('x-token'))).toBe('establishment-token');

      const rawUserData = await page.evaluate(() => localStorage.getItem('user_data'));
      expect(rawUserData).toBeTruthy();
      const userData = JSON.parse(rawUserData!);
      expect(userData.establishment).toBeTruthy();

      const rawEstData = await page.evaluate(() => localStorage.getItem('establishment_data'));
      expect(rawEstData).toBeTruthy();

      // /auth/me no fue llamado en ningún momento del funnel
      expect(wasCheckStatusCalled()).toBe(false);
    });
  });
});
