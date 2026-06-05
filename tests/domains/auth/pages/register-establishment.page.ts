import { type Locator, type Page } from '@playwright/test';

// NOTA: los textos de label deben verificarse contra el template Angular.
export class RegisterEstablishmentPage {
  readonly page: Page;
  readonly typeSelect: Locator;
  readonly nameInput: Locator;
  readonly nitInput: Locator;
  readonly cellphoneInput: Locator;
  readonly emailInput: Locator;
  readonly nocturnalCheckbox: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.typeSelect = page.getByLabel(/tipo/i);
    this.nameInput = page.getByLabel('Nombre');
    this.nitInput = page.getByLabel(/nit/i);
    this.cellphoneInput = page.getByLabel('Celular');
    this.emailInput = page.getByLabel('Correo');
    this.nocturnalCheckbox = page.getByRole('checkbox', { name: /nocturno/i });
    this.termsCheckbox = page.getByRole('checkbox', { name: /términos/i });
    this.submitButton = page.getByRole('button', { name: 'Crear cuenta' });
  }

  async goto() {
    await this.page.goto('/auth/register-establishment');
  }

  async selectType(optionText: string) {
    await this.typeSelect.click();
    await this.page.getByRole('option', { name: optionText }).click();
  }

  async fillName(value: string) {
    await this.nameInput.fill(value);
  }

  async fillNit(value: string) {
    await this.nitInput.fill(value);
  }

  async fillCellphone(value: string) {
    await this.cellphoneInput.fill(value);
  }

  async fillEmail(value: string) {
    await this.emailInput.fill(value);
  }

  async toggleNocturnal() {
    await this.nocturnalCheckbox.click();
  }

  async acceptTerms() {
    await this.termsCheckbox.check();
  }

  async submit() {
    await this.submitButton.click();
  }
}
