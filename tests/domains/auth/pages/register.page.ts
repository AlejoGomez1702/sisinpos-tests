import { type Locator, type Page } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly usernameInput: Locator;
  readonly cellphoneInput: Locator;
  readonly passwordInput: Locator;
  readonly repeatPasswordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // getByRole resuelve a un único elemento aunque varios labels contengan "Nombre"
    this.nameInput = page.getByRole('textbox', { name: 'Nombre completo' });
    this.emailInput = page.getByLabel('Correo');
    this.usernameInput = page.getByRole('textbox', { name: 'Nombre de usuario' });
    this.cellphoneInput = page.getByLabel('Celular');
    // exact: true evita que 'Contraseña' haga substring match con 'Confirmar contraseña'
    this.passwordInput = page.getByLabel('Contraseña', { exact: true });
    this.repeatPasswordInput = page.getByLabel('Confirmar contraseña', { exact: true });
    this.termsCheckbox = page.getByRole('checkbox', { name: /términos/i });
    this.submitButton = page.getByRole('button', { name: 'Crear cuenta' });
  }

  async goto() {
    await this.page.goto('/auth/register');
  }

  async fillName(value: string) {
    await this.nameInput.fill(value);
  }

  async fillEmail(value: string) {
    await this.emailInput.fill(value);
  }

  async fillUsername(value: string) {
    await this.usernameInput.fill(value);
  }

  async fillCellphone(value: string) {
    await this.cellphoneInput.fill(value);
  }

  async fillPassword(value: string) {
    await this.passwordInput.fill(value);
  }

  async fillRepeatPassword(value: string) {
    await this.repeatPasswordInput.fill(value);
  }

  async acceptTerms() {
    await this.termsCheckbox.check();
  }

  async submit() {
    await this.submitButton.click();
  }

  async fillAll(data: {
    name: string;
    email: string;
    username?: string;
    cellphone: string;
    password: string;
    repeatPassword: string;
  }) {
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    if (data.username !== undefined) {
      await this.fillUsername(data.username);
    }
    await this.fillCellphone(data.cellphone);
    await this.fillPassword(data.password);
    await this.fillRepeatPassword(data.repeatPassword);
    await this.acceptTerms();
  }
}
