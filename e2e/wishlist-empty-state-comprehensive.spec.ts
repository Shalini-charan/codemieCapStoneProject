/**
 * Comprehensive QA tests for EPMCDMETST-66326
 */

import { expect, test } from '@playwright/test'

const USER_EMAIL = 'user@nukeapp.com'
const USER_PASSWORD = '37fVgE'
const EMPTY_STATE_COPY = 'There are no products in your wishlist. Add some by clicking the heart icon.'
const OLD_COPY_TYPO = 'Add someone'
const KNOWN_PRODUCT_NAME = 'Nike Air Max 90'

async function login(page) {
  await page.goto('/login')
  const form = page.locator('[data-fsd=\'page/login/LoginForm\']')
  await form.locator('input[type=\'email\']').fill(USER_EMAIL)
  await form.locator('input[type=\'password\']').fill(USER_PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
}

async function setupWishlistState(page, items) {
  let capturedToken = ''
  const handler = async (response) => {
    if (response.url().includes('/login') && response.request().method() === 'POST') {
      try {
        const data = await response.json()
        if (data.accessToken)
          capturedToken = data.accessToken
      }
      catch { /* ignore */ }
    }
  }
  page.on('response', handler)
  await login(page)
  await page.waitForTimeout(300)
  page.off('response', handler)
  if (!capturedToken)
    throw new Error('setupWishlistState: could not capture JWT')
  const apiBase = 'http://localhost:3000'
  const token = capturedToken
  await page.evaluate(
    async ({ base, tok, wishlistItems }) => {
      const res = await fetch(`${base}/wishlist/products`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
        body: JSON.stringify(wishlistItems),
      })
      if (!res.ok)
        throw new Error(`PATCH /wishlist/products failed: ${res.status}`)
    },
    { base: apiBase, tok: token, wishlistItems: items },
  )
  // Reload at / to flush the RTK Query cache.
  // LayoutHeaderIcons runs useGetWishlistProductsQuery on the main page, populating the
  // cache with stale data. Our raw fetch PATCH does not invalidate the RTK Query cache.
  // After page.reload() the cache is empty; the next fetch will get fresh data from MSW.
  await page.reload()
}

async function goToWishlistViaSpa(page) {
  await expect(page.locator('[data-fsd=\'page/main/Page\']')).toBeVisible({ timeout: 10000 })
  const wishlistLink = page.locator('a[href=\'/user/wishlist\']').first()
  await expect(wishlistLink).toBeVisible({ timeout: 5000 })
  await wishlistLink.click()
  await expect(page.locator('[data-fsd=\'page/wishlist/Page\']')).toBeVisible({ timeout: 10000 })
}

test.describe('AC1 + AC2 -- Authenticated user with empty wishlist', () => {
  test.beforeEach(async ({ page }) => {
    await setupWishlistState(page, [])
  })

  test('AC1: shows corrected empty-state copy exactly', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(EMPTY_STATE_COPY, { exact: true })).toBeVisible()
  })

  test('AC1 regression: does NOT contain the old typo Add someone', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(OLD_COPY_TYPO)).not.toBeVisible()
  })

  test('AC2: Browse products button is visible in empty state', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Browse products' })).toBeVisible()
  })

  test('Wishlist title shows Wishlist without count suffix when empty', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wishlist')
  })

  test('Fetching is NOT visible after loading completes', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
  })
})

test.describe('AC3 -- Browse products CTA navigates to main catalog page', () => {
  test.beforeEach(async ({ page }) => {
    await setupWishlistState(page, [])
  })

  test('AC3: clicking Browse products sets URL to /', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Browse products' }).click()
    await expect(page).toHaveURL('/')
  })

  test('AC3: main catalog page is visible after Browse products click', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Browse products' }).click()
    await expect(page.locator('[data-fsd=\'page/main/Page\']')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Unchanged behaviour -- Unauthenticated user', () => {
  test('visiting /user/wishlist without auth redirects to /login', async ({ page }) => {
    await page.goto('/user/wishlist')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('login form is visible after unauthenticated redirect', async ({ page }) => {
    await page.goto('/user/wishlist')
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await expect(page.locator('input[type=\'email\']')).toBeVisible()
    await expect(page.locator('input[type=\'password\']')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })
})

test.describe('Unchanged behaviour -- Authenticated user with non-empty wishlist', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('products grid shown and empty-state copy is absent', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(KNOWN_PRODUCT_NAME)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(EMPTY_STATE_COPY)).not.toBeVisible()
  })

  test('Browse products button is NOT shown when wishlist has items', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Browse products' })).not.toBeVisible()
  })

  test('Wishlist title includes item count in parentheses', async ({ page }) => {
    await goToWishlistViaSpa(page)
    await expect(page.getByText('Fetching...')).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Wishlist \(\d+\)/)
  })
})
