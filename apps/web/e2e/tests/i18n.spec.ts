import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('Internationalization', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('defaults to Portuguese (ptBR)', async () => {
    await expect(homePage.heroTitle).toContainText('Relate um problema');
    await expect(homePage.submitButton).toContainText('Enviar relato');
  });

  test('switches to English when selected', async () => {
    await homePage.switchLanguage('enUS');

    await expect(homePage.heroTitle).toContainText('Report an issue');
    await expect(homePage.submitButton).toContainText('Submit report');
  });

  test('switches back to Portuguese', async () => {
    await homePage.switchLanguage('enUS');
    await expect(homePage.heroTitle).toContainText('Report an issue');

    await homePage.switchLanguage('ptBR');
    await expect(homePage.heroTitle).toContainText('Relate um problema');
  });

  test('persists language choice after page reload', async ({ page }) => {
    await homePage.switchLanguage('enUS');
    await expect(homePage.heroTitle).toContainText('Report an issue');

    await page.reload();

    await expect(page.locator('h2').first()).toContainText('Report an issue');
  });
});
