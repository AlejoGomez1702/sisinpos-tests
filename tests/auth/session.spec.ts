import { expect, type Locator, type Page, test } from '@playwright/test';

import { buildLoginResponse } from './helpers';

async function fillLoginForm(page: Page, identifier: string, password: string) {
  await page.getByLabel('Correo o usuario').fill(identifier);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
}

async function clickFirstVisible(page: Page, locators: Locator[]) {
  for (const locator of locators) {
    if ((await locator.count()) > 0) {
      await locator.first().click();
      return true;
    }
  }

  return false;
}

test.describe('Auth - Sesión @auth-mocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('debe enviar remember=true cuando se marca recordar sesión', async ({ page }) => {
    let payload: { identifier: string; password: string; remember: boolean } | undefined;

    await page.route('**/auth/login', async (route) => {
      payload = route.request().postDataJSON() as {
        identifier: string;
        password: string;
        remember: boolean;
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildLoginResponse()),
      });
    });

    await fillLoginForm(page, 'qa@sisinpos.com', '123456');
    await page.getByRole('checkbox', { name: 'Recordar sesión' }).check();
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect.poll(() => payload?.remember).toBe(true);
  });

  test('debe enviar remember=false cuando no se marca recordar sesión', async ({ page }) => {
    let payload: { identifier: string; password: string; remember: boolean } | undefined;

    await page.route('**/auth/login', async (route) => {
      payload = route.request().postDataJSON() as {
        identifier: string;
        password: string;
        remember: boolean;
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildLoginResponse()),
      });
    });

    await fillLoginForm(page, 'qa@sisinpos.com', '123456');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect.poll(() => payload?.remember).toBe(false);
  });

  test('debe limpiar sesión al cerrar sesión', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildLoginResponse()),
      });
    });

    await fillLoginForm(page, 'qa@sisinpos.com', '123456');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await clickFirstVisible(page, [
      page.getByRole('button', { name: /qa\s*▼/i }),
      page.getByRole('button', { name: /qa/i }),
      page.getByRole('button', { name: /perfil|cuenta|usuario|menu|menú/i }),
      page.getByRole('button', { name: /qa user/i }),
    ]);

    const logoutClicked = await clickFirstVisible(page, [
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
