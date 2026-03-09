import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('defaults to dark theme', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('toggles to light theme', async ({ page }) => {
    const themeButton = page.locator('button', { hasText: /Claro|Light/i });
    await themeButton.click();

    const html = page.locator('html');
    await expect(html).toHaveClass(/light/);
  });

  test('toggles back to dark theme', async ({ page }) => {
    // Switch to light
    const toLightButton = page.locator('button', { hasText: /Claro|Light/i });
    await toLightButton.click();
    await expect(page.locator('html')).toHaveClass(/light/);

    // Switch back to dark
    const toDarkButton = page.locator('button', { hasText: /Escuro|Dark/i });
    await toDarkButton.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('persists theme choice after page reload', async ({ page }) => {
    const themeButton = page.locator('button', { hasText: /Claro|Light/i });
    await themeButton.click();
    await expect(page.locator('html')).toHaveClass(/light/);

    await page.reload();

    await expect(page.locator('html')).toHaveClass(/light/);
  });
});
