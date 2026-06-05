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
