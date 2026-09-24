import { expect, test } from '@playwright/test'

const USER_EMAIL = 'user@nukeapp.com'
const USER_PASSWORD = '37fVgE'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(USER_EMAIL)
  await page.getByLabel('Password').fill(USER_PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  // After login, the AuthGuard redirects away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'))
}

test.describe('Wishlist empty state', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('1. Authenticated user with empty wishlist sees corrected guidance text and Browse products button', async ({ page }) => {
    await page.goto('/user/wishlist')

    const wishlistRoot = page.locator('[data-fsd="page/wishlist/Page"]')
    await expect(wishlistRoot).toBeVisible({ timeout: 10000 })

    // Wait for loading to complete (Fetching... should disappear)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })

    // Assert corrected guidance text is visible
    await expect(
      page.getByText('There are no products in your wishlist. Add some by clicking the heart icon.'),
    ).toBeVisible({ timeout: 10000 })

    // Assert "Browse products" button is visible
    await expect(page.getByRole('button', { name: 'Browse products' })).toBeVisible()
  })

  test('2. Clicking Browse products navigates to the main catalog page', async ({ page }) => {
    await page.goto('/user/wishlist')

    const wishlistRoot = page.locator('[data-fsd="page/wishlist/Page"]')
    await expect(wishlistRoot).toBeVisible({ timeout: 10000 })

    // Wait for loading to complete
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })

    // Click the "Browse products" button
    const browseButton = page.getByRole('button', { name: 'Browse products' })
    await expect(browseButton).toBeVisible({ timeout: 10000 })
    await browseButton.click()

    // Assert navigation to main/catalog page
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-fsd="page/main/Page"]')).toBeVisible({ timeout: 10000 })
  })
})
