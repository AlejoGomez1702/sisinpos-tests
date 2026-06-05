import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly identifierInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly rememberCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.identifierInput = page.getByLabel('Correo o usuario');
    this.passwordInput = page.getByRole('textbox', { name: 'Contraseña' });
    this.submitButton = page.getByRole('button', { name: 'Iniciar sesión' });
    this.rememberCheckbox = page.getByRole('checkbox', { name: 'Recordar sesión' });
  }

  async goto() {
    await this.page.goto('/auth/login');
  }

  async fillCredentials(identifier: string, password: string) {
    await this.identifierInput.fill(identifier);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async setRemember(enabled: boolean) {
    if (enabled) {
      await this.rememberCheckbox.check();
      return;
    }

    await this.rememberCheckbox.uncheck();
  }
}
