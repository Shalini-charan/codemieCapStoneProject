/**
 * E2E tests for EPMCDMETST-66352
 * Product page loading + error/empty states consistency
 *
 * Acceptance Criteria:
 * AC1: Show loading state on first load while product details are being fetched
 * AC2: Show distinct error state when product details request fails
 * AC3: Show not-found state when product does not exist
 *
 * Gherkin feature: e2e/features/product-page-states.feature
 *
 * Architecture note:
 * The app uses MSW (Mock Service Worker). Service worker registration requests
 * are at the BrowserContext level so page.route() cannot intercept them.
 * beforeEach uses context.route() to replace the real MSW SW with a passthrough
 * version that satisfies the MSW startup handshake but does not intercept fetch
 * events. This allows each test to control API responses via page.route().
 */

import { expect, test } from '@playwright/test'

const PRODUCT_ID = 1

// Minimal SW that satisfies MSW startup without intercepting fetch events.
const PASSTHROUGH_SW_SCRIPT = [
  'const PACKAGE_VERSION = \'2.15.0\';',
  'const INTEGRITY_CHECKSUM = \'03cb67ac84128e63d7cd722a6e5b7f1e\';',
  '',
  'self.addEventListener(\'install\', () => self.skipWaiting());',
  'self.addEventListener(\'activate\', event => event.waitUntil(self.clients.claim()));',
  '',
  'self.addEventListener(\'message\', async function(event) {',
  '  const clientId = Reflect.get(event.source || {}, \'id\');',
  '  if (!clientId || !self.clients) return;',
  '  const client = await self.clients.get(clientId);',
  '  if (!client) return;',
  '  switch (event.data) {',
  '    case \'KEEPALIVE_REQUEST\':',
  '      client.postMessage({ type: \'KEEPALIVE_RESPONSE\' });',
  '      break;',
  '    case \'INTEGRITY_CHECK_REQUEST\':',
  '      client.postMessage({',
  '        type: \'INTEGRITY_CHECK_RESPONSE\',',
  '        payload: { packageVersion: PACKAGE_VERSION, checksum: INTEGRITY_CHECKSUM },',
  '      });',
  '      break;',
  '    case \'MOCK_ACTIVATE\':',
  '      client.postMessage({',
  '        type: \'MOCKING_ENABLED\',',
  '        payload: { client: { id: client.id, frameType: client.frameType } },',
  '      });',
  '      break;',
  '    case \'CLIENT_CLOSED\':',
  '      break;',
  '    default:',
  '      break;',
  '  }',
  '});',
  '// No fetch event listener: requests flow through to network.',
].join('\n')

test.describe('Product page states', () => {
  test.beforeEach(async ({ context }) => {
    await context.route('**/mockServiceWorker.js', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript; charset=utf-8',
        body: PASSTHROUGH_SW_SCRIPT,
      }))
  })

  /**
   * AC1: Loading state while product details request is in-flight.
   * Gherkin: Scenario "Show loading state on first load while product details are being fetched"
   */
  test('AC1: Show loading state on first load while product details are being fetched', async ({ page }) => {
    let resolveDelay: () => void
    const delayPromise = new Promise<void>((resolve) => {
      resolveDelay = resolve
    })

    // Hold the product API response to keep the component in loading state.
    await page.route(`**/products/${PRODUCT_ID}`, async (route) => {
      await delayPromise
      await route.continue()
    })

    // Navigate without awaiting so the loading state is still visible.
    const navigationPromise = page.goto(`/product/${PRODUCT_ID}`)

    await expect(page.getByTestId('product-page-loading')).toBeVisible({ timeout: 8000 })
    await expect(page.getByTestId('product-page-not-found')).not.toBeVisible()
    await expect(page.getByTestId('product-page-error')).not.toBeVisible()

    resolveDelay!()
    await navigationPromise
  })

  /**
   * AC2: Distinct error state when the product details request fails.
   * Gherkin: Scenario "Show distinct error state when product details request fails"
   */
  test('AC2: Show distinct error state when product details request fails', async ({ page }) => {
    await page.route(`**/products/${PRODUCT_ID}`, route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      }))

    await page.goto(`/product/${PRODUCT_ID}`)

    const errorContainer = page.getByTestId('product-page-error')
    await expect(errorContainer).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Failed to load product. Please try again.')).toBeVisible()

    const backLink = errorContainer.getByRole('link', { name: 'Back to main page' })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/')

    await expect(page.getByTestId('product-page-not-found')).not.toBeVisible()
    await expect(page.getByText('Product not found')).not.toBeVisible()
    await expect(page.getByTestId('product-page-loading')).not.toBeVisible()
  })

  /**
   * AC3: Not-found state when the product does not exist.
   * Gherkin: Scenario "Show not-found state when product does not exist"
   */
  test('AC3: Show not-found state when product does not exist', async ({ page }) => {
    await page.route(`**/products/${PRODUCT_ID}`, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'null',
      }))

    await page.goto(`/product/${PRODUCT_ID}`)

    const notFoundContainer = page.getByTestId('product-page-not-found')
    await expect(notFoundContainer).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Product not found')).toBeVisible()

    const mainPageLink = notFoundContainer.getByRole('link', { name: 'main page' })
    await expect(mainPageLink).toBeVisible()
    await expect(mainPageLink).toHaveAttribute('href', '/')

    await expect(page.getByTestId('product-page-error')).not.toBeVisible()
    await expect(page.getByTestId('product-page-loading')).not.toBeVisible()
  })

  /**
   * Additional: HTTP 4xx responses map to isError=true (not to the not-found state).
   * RTK Query treats any non-2xx as an error.
   */
  test('Additional: Show error state when product request returns 404', async ({ page }) => {
    await page.route(`**/products/${PRODUCT_ID}`, route =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not Found' }),
      }))

    await page.goto(`/product/${PRODUCT_ID}`)

    const errorContainer = page.getByTestId('product-page-error')
    await expect(errorContainer).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('product-page-not-found')).not.toBeVisible()
    await expect(page.getByTestId('product-page-loading')).not.toBeVisible()
  })
})
