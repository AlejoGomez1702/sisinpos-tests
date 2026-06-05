import { type Page } from '@playwright/test';

import {
  buildRegisterResponse,
  type RegisterRequestPayload,
  type RegisterResponseOverride,
} from '../../../shared/factories/register.factory';

const REGISTER_URL = '**/api/auth/register';

export async function mockRegisterSuccess(page: Page, override: RegisterResponseOverride = {}) {
  await page.route(REGISTER_URL, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(buildRegisterResponse(override)),
    });
  });
}

export async function mockRegisterStatus(page: Page, status: number, message: string) {
  await page.route(REGISTER_URL, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message }),
    });
  });
}

export async function mockRegisterCapturePayload(page: Page) {
  let payload: RegisterRequestPayload | undefined;

  await page.route(REGISTER_URL, async (route) => {
    payload = route.request().postDataJSON() as RegisterRequestPayload;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(buildRegisterResponse()),
    });
  });

  return () => payload;
}
