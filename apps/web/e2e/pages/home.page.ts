import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly header: Locator;
  readonly heroTitle: Locator;
  readonly benefitsSection: Locator;
  readonly formSection: Locator;

  // Form fields
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly cepInput: Locator;
  readonly streetInput: Locator;
  readonly numberInput: Locator;
  readonly complementInput: Locator;
  readonly neighborhoodInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly submitButton: Locator;

  // Header controls
  readonly languageSelect: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.heroTitle = page.locator('h2').first();
    this.benefitsSection = page.locator('h3').first();
    this.formSection = page.locator('form');

    this.titleInput = page.locator('#title');
    this.descriptionInput = page.locator('#description');
    this.cepInput = page.locator('#cep');
    this.streetInput = page.locator('#street');
    this.numberInput = page.locator('#number');
    this.complementInput = page.locator('#complement');
    this.neighborhoodInput = page.locator('#neighborhood');
    this.cityInput = page.locator('#city');
    this.stateInput = page.locator('#state');
    this.submitButton = page.locator('button[type="submit"]');

    this.languageSelect = page.locator(
      '[aria-label="Selecionar idioma"], [aria-label="Select language"]',
    );
    this.themeToggle = page.locator('[aria-label*="theme"], [aria-label*="tema"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async fillReport(data: {
    title: string;
    description: string;
    number?: string;
    complement?: string;
  }) {
    await this.titleInput.fill(data.title);
    await this.descriptionInput.fill(data.description);
    if (data.number) await this.numberInput.fill(data.number);
    if (data.complement) await this.complementInput.fill(data.complement);
  }

  async fillAddress(data: { street: string; neighborhood: string; city: string; state: string }) {
    await this.streetInput.fill(data.street);
    await this.neighborhoodInput.fill(data.neighborhood);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
  }

  async fillCep(cep: string) {
    await this.cepInput.fill(cep);
  }

  async submit() {
    await this.submitButton.click();
  }

  async getFieldError(fieldId: string): Promise<string | null> {
    const field = this.page.locator(`#${fieldId}`);
    const container = field.locator('..');
    const error = container.locator('.text-destructive');
    if (await error.isVisible()) {
      return error.textContent();
    }
    return null;
  }

  async switchLanguage(lang: 'ptBR' | 'enUS') {
    await this.languageSelect.click();
    const option = lang === 'ptBR' ? 'Português (Brasil)' : 'English (US)';
    await this.page.getByText(option, { exact: true }).click();
  }
}
