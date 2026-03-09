import type { Locator, Page } from '@playwright/test';

export class ConfirmationPage {
  readonly page: Page;
  readonly header: Locator;
  readonly successIcon: Locator;
  readonly title: Locator;
  readonly message: Locator;
  readonly summaryCard: Locator;
  readonly ctaButton: Locator;
  readonly noDataMessage: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.successIcon = page
      .locator('[data-slot="alert"] svg, .text-green-600, .text-green-400')
      .first();
    this.title = page.locator('h1');
    this.message = page.locator('h1 + p');
    this.summaryCard = page.locator('[data-slot="card"]');
    this.ctaButton = page.locator('button', { hasText: /Registrar outro|Submit another/i });
    this.noDataMessage = page.getByText(/Nenhum dado|No confirmation data/i);
    this.backButton = page.locator('button', { hasText: /Voltar|Back/i });
  }

  async goto() {
    await this.page.goto('/confirmation');
  }
}
