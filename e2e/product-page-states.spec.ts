/**
 * E2E tests for EPMCDMETST-66352
 * Product page loading + error/empty states consistency
 *
 * Acceptance Criteria:
 * AC1: Show loading state on first load while product details are being fetched
 * AC2: Show distinct error state when product details request fails
 * AC3: Show not-found state when product does not exist
 */

import { expect, test } from '@playwright/test'

// A product ID to use for interception tests
const PRODUCT_ID = 1

// Service-worker-free project is needed so page.route() intercepts API calls
test.use({ serviceWorkers: 'block' })

test.describe('Product page states', () => {
  test('AC1: Show loading state on first load while product details are being fetched', async ({ page }) => {
    let resolveDelay: () => void
    const delayPromise = new Promise<void>((resolve) => {
      resolveDelay = resolve
    })

    // Intercept the product details request and hold it until we have checked the loading state
    await page.route(`**/products/${PRODUCT_ID}`, async (route) => {
      await delayPromise
      await route.continue()
    })

    // Navigate without awaiting to catch the in-flight state
    const navigationPromise = page.goto(`/product/${PRODUCT_ID}`)

    // Assert that the loading state is visible before the response arrives
    await expect(page.getByTestId('product-page-loading')).toBeVisible({ timeout: 5000 })

    // Assert that "Product not found" is NOT shown during loading
    await expect(page.getByTestId('product-page-not-found')).not.toBeVisible()

    // Release the delayed request and wait for navigation to complete
    resolveDelay!()
    await navigationPromise
  })

  test('AC2: Show distinct error state when product details request fails', async ({ page }) => {
    // Intercept and return a server error
    await page.route(`**/products/${PRODUCT_ID}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      })
    })

    await page.goto(`/product/${PRODUCT_ID}`)

    // Assert error state is shown
    const errorContainer = page.getByTestId('product-page-error')
    await expect(errorContainer).toBeVisible({ timeout: 10000 })

    // Assert error message text is visible
    await expect(page.getByText('Failed to load product. Please try again.')).toBeVisible()

    // Assert error message is distinct from "Product not found"
    await expect(page.getByTestId('product-page-not-found')).not.toBeVisible()
    await expect(page.getByText('Product not found')).not.toBeVisible()
  })

  test('AC3: Show not-found state when product does not exist', async ({ page }) => {
    // Intercept and return a successful empty response (no product data)
    await page.route(`**/products/${PRODUCT_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'null',
      })
    })

    await page.goto(`/product/${PRODUCT_ID}`)

    // Assert "Product not found" state is shown
    const notFoundContainer = page.getByTestId('product-page-not-found')
    await expect(notFoundContainer).toBeVisible({ timeout: 10000 })

    // Assert "Product not found" text is visible
    await expect(page.getByText('Product not found')).toBeVisible()

    // Assert a link to the main page is available
    const mainPageLink = notFoundContainer.getByRole('link', { name: 'main page' })
    await expect(mainPageLink).toBeVisible()
    await expect(mainPageLink).toHaveAttribute('href', '/')

    // Assert error state is NOT shown
    await expect(page.getByTestId('product-page-error')).not.toBeVisible()
  })
})
