import { type Page } from '@playwright/test';

import { RegisterPage } from '../pages/register.page';

export type RegisterFormData = {
  name: string;
  email: string;
  username?: string;
  cellphone: string;
  password: string;
  repeatPassword: string;
};

export async function fillRegisterForm(page: Page, data: RegisterFormData) {
  const registerPage = new RegisterPage(page);
  await registerPage.fillAll(data);
}

export async function submitRegisterForm(
  page: Page,
  data: RegisterFormData,
  options?: { goto?: boolean }
) {
  const registerPage = new RegisterPage(page);
  if (options?.goto) {
    await registerPage.goto();
  }
  await registerPage.fillAll(data);
  await registerPage.submit();
}
