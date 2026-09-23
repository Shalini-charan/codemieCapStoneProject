import { expect, test } from '@playwright/test'

const USER_EMAIL = 'user@nukeapp.com'
const USER_PASSWORD = '37fVgE'
// Product ID 2 has stock > 0 in seed data
const PRODUCT_WITH_STOCK_URL = '/product/2'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(USER_EMAIL)
  await page.getByLabel('Password').fill(USER_PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  // After login, the AuthGuard redirects away from /login
  await page.waitForURL(url => !url.pathname.includes('/login'))
}

async function addProductToCart(page: import('@playwright/test').Page) {
  await page.goto(PRODUCT_WITH_STOCK_URL)
  // The AddToCartButton renders an "Add to bag" button when quantity is 0
  const addToBagButton = page.getByRole('button', { name: /add to bag/i })
  await expect(addToBagButton).toBeVisible({ timeout: 10000 })
  await addToBagButton.click()
  // Dismiss the "added to bag" alert modal if it appears
  const alertModal = page.getByRole('button', { name: /view bag/i })
  if (await alertModal.isVisible({ timeout: 2000 }).catch(() => false)) {
    await alertModal.click()
  }
}

test.describe('Checkout flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('1. Checkout button is enabled when cart has items', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/user/cart')

    const checkoutButton = page.getByRole('button', { name: /checkout/i })
    await expect(checkoutButton).toBeVisible({ timeout: 10000 })
    await expect(checkoutButton).toBeEnabled()
  })

  test('2. Clicking Checkout navigates to /user/checkout and displays order total', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/user/cart')

    const checkoutButton = page.getByRole('button', { name: /checkout/i })
    await expect(checkoutButton).toBeEnabled({ timeout: 10000 })
    await checkoutButton.click()

    await expect(page).toHaveURL('/user/checkout')
    // Order total should be visible on the checkout page
    const orderTotalSection = page.getByText(/order total/i)
    await expect(orderTotalSection).toBeVisible()
  })

  test('3. Clicking Place Order shows order confirmation', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/user/checkout')

    const placeOrderButton = page.getByRole('button', { name: /place order/i })
    await expect(placeOrderButton).toBeVisible({ timeout: 10000 })
    await placeOrderButton.click()

    // After placing order, confirmation state should be shown
    await expect(page.getByText(/order (confirmed|placed)/i)).toBeVisible()
  })

  test('4. Continue Shopping navigates back to the home page', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/user/checkout')

    const continueShoppingButton = page.getByRole('button', { name: /continue shopping/i })
    await expect(continueShoppingButton).toBeVisible({ timeout: 10000 })
    await continueShoppingButton.click()

    await expect(page).toHaveURL('/')
  })
})
