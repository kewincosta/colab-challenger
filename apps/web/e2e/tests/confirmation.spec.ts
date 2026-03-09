import { test, expect } from '@playwright/test';
import { ConfirmationPage } from '../pages/confirmation.page';

test.describe('Confirmation Page', () => {
  test('shows "no data" message when navigating directly without state', async ({ page }) => {
    const confirmationPage = new ConfirmationPage(page);
    await confirmationPage.goto();

    await expect(confirmationPage.noDataMessage).toBeVisible();
    await expect(confirmationPage.backButton).toBeVisible();
  });

  test('navigates back to home when clicking the back button', async ({ page }) => {
    const confirmationPage = new ConfirmationPage(page);
    await confirmationPage.goto();

    await confirmationPage.backButton.click();

    await expect(page).toHaveURL('/');
  });
});
