import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-no-sw',
      use: {
        ...devices['Desktop Chrome'],
        // Block service workers so page.route() can intercept all API calls.
        // Used by comprehensive QA tests that need predictable wishlist state.
        serviceWorkers: 'block',
      },
    },
  ],
  webServer: {
    // Use vite directly to skip the prestart env validation script
    // (validateEnv.sh uses bash-only sed syntax that fails on Windows)
    command: 'node_modules/.bin/vite',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
