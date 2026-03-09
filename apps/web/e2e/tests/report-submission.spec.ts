import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { VALID_REPORT, VIACEP_SUCCESS_RESPONSE } from '../fixtures/test-data';
import { mockApiRoutes, mockViaCep, mockReportsApiError } from '../fixtures/mock-routes';

test.describe('Report Submission', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    // Arrange — mock all external calls before navigation
    await mockApiRoutes(page);
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('submits a complete report and redirects to confirmation', async ({ page }) => {
    // Arrange
    await homePage.fillReport({
      title: VALID_REPORT.title,
      description: VALID_REPORT.description,
      number: VALID_REPORT.number,
      complement: VALID_REPORT.complement,
    });

    await homePage.fillCep(VALID_REPORT.cep);
    await expect(homePage.streetInput).toHaveValue(VIACEP_SUCCESS_RESPONSE.logradouro, {
      timeout: 5000,
    });

    await homePage.numberInput.fill(VALID_REPORT.number);

    // Act
    await homePage.submit();

    // Assert
    await expect(page).toHaveURL(/\/confirmation/, { timeout: 5000 });
    await expect(
      page.getByRole('heading', { level: 1, name: /Recebemos|received/i }),
    ).toBeVisible();
  });

  test('shows error toast when API returns server error', async ({ page }) => {
    // Arrange — override reports API to fail (ViaCEP still mocked from beforeEach)
    await mockReportsApiError(page);

    await homePage.fillReport({
      title: VALID_REPORT.title,
      description: VALID_REPORT.description,
    });

    await homePage.fillCep(VALID_REPORT.cep);
    await expect(homePage.streetInput).toHaveValue(VIACEP_SUCCESS_RESPONSE.logradouro, {
      timeout: 5000,
    });
    await homePage.numberInput.fill(VALID_REPORT.number);

    // Act
    await homePage.submit();

    // Assert
    const toast = page.locator('[data-state="open"]', { hasText: /erro|failed/i });
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});
