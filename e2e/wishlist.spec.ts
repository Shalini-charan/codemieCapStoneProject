import { expect, test } from '@playwright/test'

const USER_EMAIL = 'user@nukeapp.com'
const USER_PASSWORD = '37fVgE'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  // Use input[type] selectors -- LoginForm labels are not associated with inputs
  // via htmlFor/id, so getByLabel() is unreliable here.
  await page.locator('input[type="email"]').fill(USER_EMAIL)
  await page.locator('input[type="password"]').fill(USER_PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  // After login, the AuthGuard redirects away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'))
}

async function goToWishlistViaSpa(page: import('@playwright/test').Page) {
  // Use SPA navigation to avoid redux-remember rehydration race with GuestGuard
  // on hard page.goto() after login
  await expect(page.locator('[data-fsd="page/main/Page"]')).toBeVisible({ timeout: 10000 })
  const wishlistLink = page.locator('a[href="/user/wishlist"]').first()
  await expect(wishlistLink).toBeVisible({ timeout: 5000 })
  await wishlistLink.click()
  await expect(page.locator('[data-fsd="page/wishlist/Page"]')).toBeVisible({ timeout: 10000 })
}

test.describe('Wishlist empty state', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('1. Authenticated user with empty wishlist sees corrected guidance text and Browse products button', async ({ page }) => {
    await goToWishlistViaSpa(page)

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
    await goToWishlistViaSpa(page)

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
