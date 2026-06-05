import { type Page } from '@playwright/test';
import { test as base, expect } from '../../../shared/fixtures/base.fixture';
import { mockLoginSuccess, mockCheckStatusWithoutEstablishment } from '../mocks/auth.mocks';
import { mockRegisterSuccess } from '../mocks/register.mocks';
import { submitLoginForm } from '../flows/login.flow';
import { submitRegisterForm } from '../flows/register.flow';
import { authUsers } from '../data/users';
import { registerUsers } from '../data/register.data';

type AuthFixtures = {
  loggedInPage: Page;
  registeredPage: Page;
};

export const test = base.extend<AuthFixtures>({
  loggedInPage: async ({ page }, use) => {
    await mockLoginSuccess(page);
    await submitLoginForm(page, authUsers.validAdmin.identifier, authUsers.validAdmin.password, {
      goto: true,
    });
    await page.waitForURL(/\/dashboard/);
    await use(page);
  },

  registeredPage: async ({ page }, use) => {
    // Pre-carga el estado de un usuario recién registrado: token válido, sin establecimiento.
    // Simula el estado post-register sin tener que pasar por el formulario completo.
    await page.addInitScript(() => {
      localStorage.setItem('x-token', 'fake-jwt-token');
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          id: 'user-reg-1',
          name: 'QA Registro',
          username: 'qa.registro',
          email: 'qa.registro@sisinpos.com',
          cellphone: '3100000000',
          rol: 'ADMIN_ROLE',
          permissions: [],
          establishment: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        })
      );
    });
    // El authGuard llama a checkStatus al cargar la página (estado 'checking')
    await mockCheckStatusWithoutEstablishment(page);
    await page.goto('/auth/register-establishment');
    await use(page);
  },
});

export { expect };
