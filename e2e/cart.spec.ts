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

test.describe('Cart empty state', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('1. Authenticated user with empty cart sees guidance text and Browse products button', async ({ page }) => {
    await page.goto('/user/cart')

    // Wait for the Bag heading to confirm we are on the cart page
    await expect(page.getByRole('heading', { name: 'Bag' })).toBeVisible({ timeout: 10000 })

    // Wait for loading to complete (Loading... should disappear)
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

    // Assert empty cart guidance text is visible
    await expect(
      page.getByText('There are no products in your bag. Add someone and return.'),
    ).toBeVisible({ timeout: 10000 })

    // Assert "Browse products" button is visible
    await expect(page.getByRole('button', { name: 'Browse products' })).toBeVisible()
  })
})
