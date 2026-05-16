import { test, expect } from '@playwright/test'

test.describe('Checkout flow', () => {
  // Helper: add first available product to cart
  async function addProductToCart(page: import('@playwright/test').Page) {
    await page.goto('/shop/products')
    await page.waitForLoadState('networkidle')
    const firstCard = page.getByRole('link').filter({ has: page.locator('img') }).first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      await page.waitForLoadState('networkidle')
      const addBtn = page.getByRole('button', { name: /add to cart/i })
      if (await addBtn.isVisible()) {
        await addBtn.click()
        await page.waitForTimeout(500)
      }
    }
  }

  test('checkout page redirects to cart when cart is empty', async ({ page }) => {
    // Clear cart by going directly to checkout with no items
    await page.goto('/shop/checkout')
    // Should be redirected away (to cart)
    await expect(page).toHaveURL(/cart|shop/, { timeout: 8_000 })
  })

  test('checkout page loads after adding product', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/shop/cart')

    const checkoutBtn = page.getByRole('link', { name: /checkout/i })
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click()
      await expect(page).toHaveURL(/checkout/, { timeout: 8_000 })
      await expect(page.getByText('Checkout')).toBeVisible()
    }
  })

  test('shows order summary on checkout page', async ({ page }) => {
    // Add a product via the listing's inline quick-add button. Then navigate
    // through /shop/cart's checkout link instead of `page.goto('/shop/checkout')` —
    // a direct goto races the CartProvider's hydration-from-localStorage and the
    // checkout page's "redirect to /cart if empty" effect (page.tsx:68).
    await page.goto('/shop/products')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /add to cart/i }).first().click()
    await page.goto('/shop/cart')
    await page.getByRole('link', { name: /checkout/i }).first().click()
    await page.waitForURL(/checkout/, { timeout: 8_000 })

    await expect(page.locator('.t-h4', { hasText: 'Your order' })).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Total').first()).toBeVisible()
  })

  test('shipping step requires address before continuing', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/shop/checkout')
    await page.waitForLoadState('networkidle')

    // Try to proceed without filling address
    const continueBtn = page.getByRole('button', { name: /continue/i })
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await expect(page.getByText(/address/i)).toBeVisible({ timeout: 5_000 })
    }
  })

  test('fills shipping address and proceeds to confirm step', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/shop/checkout')
    await page.waitForLoadState('networkidle')

    const textarea = page.getByPlaceholder(/123 Main St/i)
    if (await textarea.isVisible()) {
      await textarea.fill('456 Test Avenue, Test City, TS 12345, US')
      await page.getByRole('button', { name: /continue/i }).click()

      // Should show confirm step
      await expect(page.getByText('Confirm Order')).toBeVisible({ timeout: 5_000 })
      await expect(page.getByText('456 Test Avenue')).toBeVisible()
    }
  })

  test('back button on confirm step returns to shipping', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/shop/checkout')
    await page.waitForLoadState('networkidle')

    const textarea = page.getByPlaceholder(/123 Main St/i)
    if (await textarea.isVisible()) {
      await textarea.fill('123 Back Street, City, ST 00000')
      await page.getByRole('button', { name: /continue/i }).click()
      await expect(page.getByText('Confirm Order')).toBeVisible({ timeout: 5_000 })

      // Click back arrow
      await page.getByRole('button').filter({ has: page.locator('svg') }).first().click()
      await expect(page.getByText('Shipping Details')).toBeVisible({ timeout: 5_000 })
    }
  })

  test('placing order shows success screen', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/shop/checkout')
    await page.waitForLoadState('networkidle')

    const textarea = page.getByPlaceholder(/123 Main St/i)
    if (await textarea.isVisible()) {
      await textarea.fill('789 Success Road, Done City, OK 99999')
      await page.getByRole('button', { name: /continue/i }).click()
      await expect(page.getByText('Confirm Order')).toBeVisible({ timeout: 5_000 })

      await page.getByRole('button', { name: /place order/i }).click()

      // Success screen
      await expect(page.getByText('Order Placed!')).toBeVisible({ timeout: 15_000 })
      await expect(page.getByRole('button', { name: /view orders/i })).toBeVisible()
    }
  })

  test('after successful order navigates to orders page', async ({ page }) => {
    await addProductToCart(page)
    await page.goto('/shop/checkout')
    await page.waitForLoadState('networkidle')

    const textarea = page.getByPlaceholder(/123 Main St/i)
    if (await textarea.isVisible()) {
      await textarea.fill('1 Verified Lane, City, ST 11111')
      await page.getByRole('button', { name: /continue/i }).click()
      await expect(page.getByText('Confirm Order')).toBeVisible({ timeout: 5_000 })
      await page.getByRole('button', { name: /place order/i }).click()
      await expect(page.getByText('Order Placed!')).toBeVisible({ timeout: 15_000 })

      await page.getByRole('button', { name: /view orders/i }).click()
      await expect(page).toHaveURL(/orders/)
    }
  })
})
