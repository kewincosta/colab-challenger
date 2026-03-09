import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { VALID_REPORT } from '../fixtures/test-data';

test.describe('Form Validation', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('shows error messages for required fields when submitting empty form', async ({ page }) => {
    // Touch and blur each required field to trigger validation
    await homePage.titleInput.click();
    await homePage.descriptionInput.click();
    await homePage.cepInput.click();
    await homePage.streetInput.click();
    await homePage.neighborhoodInput.click();
    await homePage.cityInput.click();
    await homePage.stateInput.click();
    await homePage.titleInput.click(); // blur the last field

    // Check that error messages are visible (p tags, not the * asterisk spans)
    const form = page.locator('form');
    await expect(form.locator('p.text-destructive').first()).toBeVisible();
  });

  test('validates title minimum length', async ({ page }) => {
    await homePage.titleInput.fill('Ab');
    await homePage.titleInput.blur();

    const errorText = page.locator('form p.text-destructive').first();
    await expect(errorText).toBeVisible();
    await expect(errorText).toContainText(/pelo menos 5|at least 5/i);
  });

  test('validates title maximum length', async ({ page }) => {
    const longTitle = 'A'.repeat(256);
    await homePage.titleInput.fill(longTitle);
    await homePage.titleInput.blur();

    const errorText = page.locator('form p.text-destructive').first();
    await expect(errorText).toBeVisible();
    await expect(errorText).toContainText(/máximo 255|at most 255/i);
  });

  test('validates description minimum length', async () => {
    await homePage.descriptionInput.fill('Short');
    await homePage.descriptionInput.blur();

    const container = homePage.descriptionInput.locator('..').locator('p.text-destructive');
    await expect(container).toBeVisible();
    await expect(container).toContainText(/pelo menos 15|at least 15/i);
  });

  test('validates CEP format', async () => {
    await homePage.cepInput.fill('123');
    await homePage.cepInput.blur();

    const container = homePage.cepInput.locator('..').locator('..').locator('p.text-destructive');
    await expect(container).toBeVisible();
  });

  test('validates state format (2 uppercase letters)', async () => {
    await homePage.stateInput.fill('X');
    await homePage.stateInput.blur();

    const container = homePage.stateInput.locator('..').locator('p.text-destructive');
    await expect(container).toBeVisible();
  });

  test('accepts valid form data without errors', async () => {
    await homePage.titleInput.fill(VALID_REPORT.title);
    await homePage.titleInput.blur();

    await homePage.descriptionInput.fill(VALID_REPORT.description);
    await homePage.descriptionInput.blur();

    await homePage.cepInput.fill(VALID_REPORT.cep);
    await homePage.cepInput.blur();

    await homePage.fillAddress({
      street: VALID_REPORT.street,
      neighborhood: VALID_REPORT.neighborhood,
      city: VALID_REPORT.city,
      state: VALID_REPORT.state,
    });
    await homePage.stateInput.blur();

    const errors = homePage.page.locator('form p.text-destructive');
    await expect(errors).toHaveCount(0);
  });
});
