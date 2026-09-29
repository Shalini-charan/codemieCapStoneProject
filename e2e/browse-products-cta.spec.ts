/**
 * Playwright e2e tests for EPMCDMETST-67004
 * Browse products CTA on empty Cart and Wishlist pages
 *
 *   AC1 - Authenticated empty Cart shows CTA and navigates to '/'
 *   AC2 - Authenticated empty Wishlist shows CTA and navigates to '/'
 *   AC3 - Unauthorized state: login redirect behavior unchanged
 *
 * QA FINDING - unreachable component-level unauthorized state:
 *   Both /user/cart and /user/wishlist are wrapped by GuestGuard in
 *   appRouter.tsx. The components have an internal if (!isAuthorized) branch
 *   rendering Login + Browse products, but GuestGuard redirects before the
 *   component mounts so that branch is dead code. AC3 tests verify the
 *   observable GuestGuard redirect behavior (unchanged).
 *
 * NOTE ON NAVIGATION STRATEGY:
 *   Hard page.goto("/user/cart") after login can race with redux-remember
 *   rehydration on hard reload, causing GuestGuard to redirect back to /login.
 *   Authenticated tests use SPA navigation (clicking header links) to avoid
 *   this race, following the pattern from test/EPMCDMETST-66326-wishlist-empty-state.
 */
import { expect, test } from '@playwright/test'

const PRIMARY_USER_EMAIL = 'user@nukeapp.com'
const PRIMARY_USER_PASSWORD = '37fVgE'
const SECONDARY_USER_EMAIL = 'test@ya.ru'
const SECONDARY_USER_PASSWORD = '123456'

/**
 * Log in via the login form.
 * Uses input[type] selectors because LoginForm labels are not associated
 * to their inputs via htmlFor/id -- getByLabel() is unreliable here.
 * After login, the user lands on the main page (/).
 */
async function login(
  page: import('@playwright/test').Page,
  email: string = PRIMARY_USER_EMAIL,
  password: string = PRIMARY_USER_PASSWORD,
) {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
}

/**
 * Navigate to the Cart page via the header link (SPA navigation).
 * Avoids hard reload so redux-remember rehydration does not race with GuestGuard.
 */
async function goToCartViaSpa(page: import('@playwright/test').Page) {
  await expect(page.locator('[data-fsd="page/main/Page"]')).toBeVisible({ timeout: 10000 })
  const cartLink = page.locator('a[href="/user/cart"]').first()
  await expect(cartLink).toBeVisible({ timeout: 5000 })
  await cartLink.click()
  await expect(page.getByRole('heading', { name: 'Bag' })).toBeVisible({ timeout: 10000 })
}

/**
 * Navigate to the Wishlist page via the header link (SPA navigation).
 */
async function goToWishlistViaSpa(page: import('@playwright/test').Page) {
  await expect(page.locator('[data-fsd="page/main/Page"]')).toBeVisible({ timeout: 10000 })
  const wishlistLink = page.locator('a[href="/user/wishlist"]').first()
  await expect(wishlistLink).toBeVisible({ timeout: 5000 })
  await wishlistLink.click()
  await expect(page.locator('[data-fsd="page/wishlist/Page"]')).toBeVisible({ timeout: 10000 })
}

// ---------------------------------------------------------------------------
// AC1 - Empty Cart page: Browse products CTA
// ---------------------------------------------------------------------------

test.describe('AC1 - Empty Cart: Browse products CTA', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('AC1.1 - empty cart shows Bag heading, guidance text, and Browse products button', async ({ page }) => {
    await goToCartViaSpa(page)
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })
    await expect(
      page.getByText('There are no products in your bag. Add someone and return.'),
    ).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Browse products' })).toBeVisible()
  })

  test('AC1.2 - clicking Browse products on empty cart navigates to root', async ({ page }) => {
    await goToCartViaSpa(page)
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })
    const browseBtn = page.getByRole('button', { name: 'Browse products' })
    await expect(browseBtn).toBeVisible({ timeout: 10000 })
    await browseBtn.click()
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.locator('[data-fsd="page/main/Page"]')).toBeVisible({ timeout: 10000 })
  })

  test('AC1.3 - authenticated user on cart does not see login message', async ({ page }) => {
    await goToCartViaSpa(page)
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Login to see your cart.')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// AC2 - Empty Wishlist page: Browse products CTA
// ---------------------------------------------------------------------------

test.describe('AC2 - Empty Wishlist: Browse products CTA', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('AC2.1 - empty wishlist shows heading, corrected text, and Browse products button', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Wishlist' })).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByText('There are no products in your wishlist. Add some by clicking the heart icon.'),
    ).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Browse products' })).toBeVisible()
  })

  test('AC2.2 - empty wishlist text does not contain old typo Add someone', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Add someone/i)).not.toBeVisible()
    await expect(page.getByText(/Add some by clicking the heart icon/i)).toBeVisible()
  })

  test('AC2.3 - clicking Browse products on empty wishlist navigates to root', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    const browseBtn = page.getByRole('button', { name: 'Browse products' })
    await expect(browseBtn).toBeVisible({ timeout: 10000 })
    await browseBtn.click()
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.locator('[data-fsd="page/main/Page"]')).toBeVisible({ timeout: 10000 })
  })

  test('AC2.4 - authenticated user on wishlist does not see login message', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Login to see your wishlist.')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// AC3 - Unauthorized state: existing login behavior unchanged
//
// GuestGuard in appRouter.tsx redirects unauthenticated requests for
// /user/cart and /user/wishlist to /login before page components render.
// Component-level unauthorized branches are dead code - cannot be reached
// via normal navigation. Tests verify the observable GuestGuard behavior.
// ---------------------------------------------------------------------------

test.describe('AC3 - Unauthorized state: login redirect behavior unchanged', () => {
  test('AC3.1 - unauthenticated access to /user/cart is redirected to /login', async ({ page }) => {
    await page.goto('/user/cart')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 10000 })
  })

  test('AC3.2 - unauthenticated access to /user/wishlist is redirected to /login', async ({ page }) => {
    await page.goto('/user/wishlist')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 10000 })
  })

  test('AC3.3 - /login page itself does not show a Browse products button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Browse products' })).not.toBeVisible()
  })

  test('AC3.4 - successful login from /user/cart redirect lands user outside /login', async ({ page }) => {
    await page.goto('/user/cart')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await page.locator('input[type="email"]').fill(PRIMARY_USER_EMAIL)
    await page.locator('input[type="password"]').fill(PRIMARY_USER_PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
    expect(page.url()).not.toMatch(/\/login/)
  })
})

// ---------------------------------------------------------------------------
// Regression - non-empty wishlist must NOT show Browse products CTA
// ---------------------------------------------------------------------------

test.describe('Regression - non-empty wishlist does not show Browse products CTA', () => {
  test('REG.1 - user with non-empty wishlist sees products, no Browse products CTA', async ({ page }) => {
    await login(page, SECONDARY_USER_EMAIL, SECONDARY_USER_PASSWORD)
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Browse products' })).not.toBeVisible()
    await expect(page.getByText('There are no products in your wishlist.')).not.toBeVisible()
  })
})
