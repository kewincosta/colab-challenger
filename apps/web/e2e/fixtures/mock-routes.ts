import type { Page } from '@playwright/test';
import {
  VIACEP_SUCCESS_RESPONSE,
  VIACEP_NOT_FOUND_RESPONSE,
  API_REPORT_SUCCESS_RESPONSE,
} from './test-data';

/**
 * Registers mock routes for all external API calls.
 * - ViaCEP: returns success response by default
 * - Backend API: returns report success response by default
 *
 * Call BEFORE navigating to the page (page.goto).
 */
export async function mockApiRoutes(page: Page) {
  await mockViaCep(page);
  await mockReportsApi(page);
}

/**
 * Mocks the ViaCEP API to return a successful address lookup.
 */
export async function mockViaCep(page: Page, response = VIACEP_SUCCESS_RESPONSE) {
  await page.route('**/viacep.com.br/ws/*/json/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    }),
  );
}

/**
 * Mocks the ViaCEP API to return a "not found" response.
 */
export async function mockViaCepNotFound(page: Page) {
  await mockViaCep(page, VIACEP_NOT_FOUND_RESPONSE);
}

/**
 * Mocks the backend POST /api/reports to return a success response.
 */
export async function mockReportsApi(page: Page, response = API_REPORT_SUCCESS_RESPONSE) {
  await page.route('**/api/reports', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(response),
    }),
  );
}

/**
 * Mocks the backend POST /api/reports to return a server error.
 */
export async function mockReportsApiError(page: Page, status = 500) {
  await page.route('**/api/reports', (route) =>
    route.fulfill({ status, body: 'Internal Server Error' }),
  );
}
