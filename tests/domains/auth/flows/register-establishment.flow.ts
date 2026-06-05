import { type Page } from '@playwright/test';

import { RegisterEstablishmentPage } from '../pages/register-establishment.page';

export type EstablishmentFormData = {
  type: string;
  name: string;
  nit?: string;
  cellphone?: string;
  email?: string;
  isNocturnal?: boolean;
};

export async function submitEstablishmentForm(
  page: Page,
  data: EstablishmentFormData,
  options?: { goto?: boolean }
) {
  const regEstPage = new RegisterEstablishmentPage(page);

  if (options?.goto) {
    await regEstPage.goto();
  }

  await regEstPage.selectType(data.type);
  await regEstPage.fillName(data.name);

  if (data.nit) await regEstPage.fillNit(data.nit);
  if (data.cellphone) await regEstPage.fillCellphone(data.cellphone);
  if (data.email) await regEstPage.fillEmail(data.email);
  if (data.isNocturnal) await regEstPage.toggleNocturnal();

  await regEstPage.acceptTerms();
  await regEstPage.submit();
}
