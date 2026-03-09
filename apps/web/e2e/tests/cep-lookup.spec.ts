import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { VALID_CEP, VIACEP_SUCCESS_RESPONSE } from '../fixtures/test-data';
import { mockViaCep, mockViaCepNotFound } from '../fixtures/mock-routes';

test.describe('CEP Lookup', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    await mockViaCep(page);
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('applies CEP mask while typing', async () => {
    await homePage.cepInput.fill('01001000');

    const value = await homePage.cepInput.inputValue();
    expect(value).toBe('01001-000');
  });

  test('auto-fills address fields after valid CEP lookup', async () => {
    // Act
    await homePage.fillCep(VALID_CEP);

    // Assert — values match the mock fixture exactly
    await expect(homePage.streetInput).toHaveValue(VIACEP_SUCCESS_RESPONSE.logradouro, {
      timeout: 5000,
    });
    await expect(homePage.neighborhoodInput).toHaveValue(VIACEP_SUCCESS_RESPONSE.bairro);
    await expect(homePage.cityInput).toHaveValue(VIACEP_SUCCESS_RESPONSE.localidade);
    await expect(homePage.stateInput).toHaveValue(VIACEP_SUCCESS_RESPONSE.uf);
  });

  test('shows warning toast when CEP is not found', async ({ page }) => {
    // Arrange — override mock to return "not found"
    await mockViaCepNotFound(page);

    // Act
    await homePage.fillCep('99999-999');

    // Assert
    const toast = page.locator('[data-state="open"]', { hasText: /não encontr|not found/i });
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});
