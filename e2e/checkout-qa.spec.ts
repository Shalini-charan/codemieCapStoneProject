import { expect, test } from '@playwright/test'

const USER_EMAIL = 'user@nukeapp.com'
const USER_PASSWORD = '37fVgE'
const PRODUCT_WITH_STOCK_URL = '/product/2'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input[name="email"]', { timeout: 10000 })
  await page.locator('input[name="email"]').fill(USER_EMAIL)
  await page.locator('input[name="password"]').fill(USER_PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 })
  await page.waitForFunction(
    () => {
      try {
        const raw = localStorage.getItem('@@remember-session')
        if (!raw) return false
        return JSON.parse(raw).isAuthorized === true
      }
      catch { return false }
    },
    { timeout: 10000 },
  )
}

async function addProductAndGoToCart(page: import('@playwright/test').Page) {
  await page.goto(PRODUCT_WITH_STOCK_URL)
  await page.waitForSelector('[data-fsd="page/product/ProductDetails"]', { timeout: 10000 })
  const addButton = page.locator('[data-fsd="page/product/ProductDetails"] button').last()
  await expect(addButton).toBeVisible({ timeout: 10000 })
  await addButton.click()
  const viewBagButton = page.getByRole('button', { name: /view bag/i })
  await expect(viewBagButton).toBeVisible({ timeout: 5000 })
  await viewBagButton.click()
  await expect(page.getByRole('heading', { name: 'Bag' })).toBeVisible({ timeout: 10000 })
}

test.describe('EPMCDMETST-67098: Checkout button state and navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('AC1: Checkout button is not rendered when cart is empty', async ({ page }) => {
    await page.goto('/user/cart')
    await expect(page.getByRole('heading', { name: 'Bag' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })
    const hasCartSummary = await page.locator('[data-fsd="page/cart/CartSummary"]').isVisible().catch(() => false)
    if (!hasCartSummary) {
      await expect(page.getByRole('button', { name: /browse products/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /checkout/i })).not.toBeVisible()
    }
    else {
      await expect(page.getByRole('button', { name: /checkout/i })).toBeEnabled()
    }
  })

  test('AC2: Checkout button is enabled when cart has items', async ({ page }) => {
    await addProductAndGoToCart(page)
    const checkoutButton = page.getByRole('button', { name: /checkout/i })
    await expect(checkoutButton).toBeVisible({ timeout: 10000 })
    await expect(checkoutButton).toBeEnabled()
  })

  test('AC3: Clicking enabled Checkout navigates to checkout entry and shows Order Total', async ({ page }) => {
    await addProductAndGoToCart(page)
    const checkoutButton = page.getByRole('button', { name: /checkout/i })
    await expect(checkoutButton).toBeEnabled({ timeout: 10000 })
    await checkoutButton.click()
    await expect(page).toHaveURL('/user/checkout')
    await expect(page.getByText(/order total/i)).toBeVisible({ timeout: 5000 })
  })

  test('EXT1: Checkout page shows Place Order and Continue Shopping buttons', async ({ page }) => {
    await addProductAndGoToCart(page)
    const checkoutButton = page.getByRole('button', { name: /checkout/i })
    await expect(checkoutButton).toBeEnabled({ timeout: 10000 })
    await checkoutButton.click()
    await expect(page).toHaveURL('/user/checkout')
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /place order/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue shopping/i })).toBeVisible()
  })

  test('EXT2: Clicking Place Order shows order confirmation state', async ({ page }) => {
    await addProductAndGoToCart(page)
    const checkoutButton = page.getByRole('button', { name: /checkout/i })
    await expect(checkoutButton).toBeEnabled({ timeout: 10000 })
    await checkoutButton.click()
    await expect(page).toHaveURL('/user/checkout')
    const placeOrderButton = page.getByRole('button', { name: /place order/i })
    await expect(placeOrderButton).toBeVisible({ timeout: 5000 })
    await placeOrderButton.click()
    await expect(page.getByText(/order (confirmed|placed)/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /place order/i })).not.toBeVisible()
  })

  test('EXT3: Continue Shopping from checkout page navigates to home', async ({ page }) => {
    await addProductAndGoToCart(page)
    const checkoutButton = page.getByRole('button', { name: /checkout/i })
    await expect(checkoutButton).toBeEnabled({ timeout: 10000 })
    await checkoutButton.click()
    await expect(page).toHaveURL('/user/checkout')
    const continueShoppingButton = page.getByRole('button', { name: /continue shopping/i })
    await expect(continueShoppingButton).toBeVisible({ timeout: 5000 })
    await continueShoppingButton.click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('EPMCDMETST-67098: Authentication guard for checkout route', () => {
  test('GUARD: Unauthenticated user accessing checkout is redirected to login', async ({ page }) => {
    await page.goto('/user/checkout')
    await expect(page).toHaveURL('/login', { timeout: 10000 })
  })
})
