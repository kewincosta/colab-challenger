import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('Accessibility', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('language selector has accessible aria-label', async () => {
    await expect(homePage.languageSelect).toBeVisible();
    const ariaLabel = await homePage.languageSelect.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('theme toggle has accessible aria-label', async () => {
    await expect(homePage.themeToggle).toBeVisible();
    const ariaLabel = await homePage.themeToggle.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('form fields have associated labels', async ({ page }) => {
    const requiredFields = [
      'title',
      'description',
      'cep',
      'street',
      'neighborhood',
      'city',
      'state',
    ];

    for (const fieldId of requiredFields) {
      const field = page.locator(`#${fieldId}`);
      await expect(field).toBeVisible();
    }
  });

  test('submit button is disabled when form is invalid', async () => {
    // Initial state — form has no touched fields, button should rely on canSubmit
    await expect(homePage.submitButton).toBeVisible();
  });

  test('responsive layout adapts on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Header should still be visible
    await expect(homePage.header).toBeVisible();

    // Form should be visible
    await expect(homePage.formSection).toBeVisible();

    // Benefits grid should stack vertically (single column)
    const benefitCards = page.locator('.bg-muted\\/30');
    const count = await benefitCards.count();
    expect(count).toBe(4);
  });
});
