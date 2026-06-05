import { type Page } from '@playwright/test';

import {
  buildLoginResponse,
  type LoginResponseOverride,
} from '../../../shared/factories/auth.factory';

export type LoginRequestPayload = {
  identifier: string;
  password: string;
  remember: boolean;
};

export async function mockLoginSuccess(page: Page, override: LoginResponseOverride = {}) {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildLoginResponse(override)),
    });
  });
}

export async function mockLoginStatus(page: Page, status: number, message: string) {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message }),
    });
  });
}

export async function mockLoginCapturePayload(page: Page) {
  let payload: LoginRequestPayload | undefined;

  await page.route('**/auth/login', async (route) => {
    payload = route.request().postDataJSON() as LoginRequestPayload;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildLoginResponse()),
    });
  });

  return () => payload;
}

export async function mockLoginWithRateLimit(
  page: Page,
  { failBefore = 3 }: { failBefore?: number } = {}
) {
  let attempts = 0;

  await page.route('**/auth/login', async (route) => {
    attempts += 1;

    if (attempts < failBefore) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Credenciales inválidas' }),
      });
    } else {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Demasiados intentos. Intenta más tarde.' }),
      });
    }
  });

  return () => attempts;
}

export async function mockNetworkError(page: Page) {
  await page.route('**/auth/login', async (route) => {
    await route.abort('failed');
  });
}

// --- check-status (GET /auth/me) ---

export async function mockCheckStatusSuccess(page: Page) {
  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildLoginResponse()),
    });
  });
}

export async function mockCheckStatusUnauthorized(page: Page) {
  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Token inválido o expirado' }),
    });
  });
}

export async function mockCheckStatusNetworkError(page: Page) {
  await page.route('**/auth/me', async (route) => {
    await route.abort('failed');
  });
}

export async function interceptCheckStatus(page: Page) {
  let called = false;
  await page.route('**/auth/me', async (route) => {
    called = true;
    await route.continue();
  });
  return () => called;
}
