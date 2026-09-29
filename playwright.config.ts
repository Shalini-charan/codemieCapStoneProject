import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for E2E tests.
 * EPMCDMETST-67098 — Enable Checkout button when cart has items
 *
 * The app uses MSW (Mock Service Worker) as the mock API backend,
 * so no separate server process is required — the Vite dev server handles all requests.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Timeout for each action */
    actionTimeout: 15000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      VITE_API_ENDPOINT: 'http://localhost:3000',
      VITE_API_DELAY: '0',
      VITE_API_STORAGE_MODE: 'session',
      VITE_API_USER_EMAIL: 'user@nukeapp.com',
      VITE_API_USER_PASSWORD: '37fVgE',
      VITE_JWT_SECRET: 'cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2',
    },
  },
})
