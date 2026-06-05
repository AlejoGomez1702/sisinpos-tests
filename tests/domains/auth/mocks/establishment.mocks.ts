import { type Page } from '@playwright/test';

import {
  buildEstablishmentResponse,
  type EstablishmentResponseOverride,
} from '../../../shared/factories/establishment.factory';

const ESTABLISHMENT_URL = '**/api/onboarding/establishment';

export async function mockEstablishmentSuccess(
  page: Page,
  override: EstablishmentResponseOverride = {}
) {
  await page.route(ESTABLISHMENT_URL, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(buildEstablishmentResponse(override)),
    });
  });
}

export async function mockEstablishmentStatus(page: Page, status: number, message: string) {
  await page.route(ESTABLISHMENT_URL, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message }),
    });
  });
}

export async function mockEstablishmentCapturePayload(page: Page) {
  let payload: Record<string, unknown> | undefined;

  await page.route(ESTABLISHMENT_URL, async (route) => {
    payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(buildEstablishmentResponse()),
    });
  });

  return () => payload;
}
