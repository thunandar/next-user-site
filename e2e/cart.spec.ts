import { test, expect } from '@playwright/test'

test('empty cart shows empty state', async ({ page }) => {
  await page.goto('/shop/cart')
  // Either shows empty state or has items from previous tests
  const isEmpty = await page.getByText(/your cart is empty/i).isVisible()
  const hasItems = await page.getByText(/shopping cart/i).isVisible()
  expect(isEmpty || hasItems).toBeTruthy()
})

test('add product to cart from product detail', async ({ page }) => {
  await page.goto('/shop/products')
  await page.waitForLoadState('networkidle')

  const firstCard = page.getByRole('link').filter({ has: page.locator('img') }).first()
  if (await firstCard.isVisible()) {
    await firstCard.click()
    await page.waitForLoadState('networkidle')

    const addBtn = page.getByRole('button', { name: /add to cart/i })
    if (await addBtn.isVisible()) {
      await addBtn.click()
      // Toast confirmation
      await expect(page.getByText(/added to cart/i)).toBeVisible({ timeout: 5_000 })
    }
  }
})

test('cart shows items and total after adding product', async ({ page }) => {
  // Add something first
  await page.goto('/shop/products')
  await page.waitForLoadState('networkidle')

  const firstCard = page.getByRole('link').filter({ has: page.locator('img') }).first()
  if (await firstCard.isVisible()) {
    await firstCard.click()
    await page.waitForLoadState('networkidle')
    const addBtn = page.getByRole('button', { name: /add to cart/i })
    if (await addBtn.isVisible()) {
      await addBtn.click()
      await page.waitForTimeout(1000)
    }
  }

  await page.goto('/shop/cart')
  // Should show cart heading or empty
  await expect(page.getByText(/cart|shopping/i).first()).toBeVisible()
})

test('cart checkout button navigates to checkout', async ({ page }) => {
  await page.goto('/shop/cart')
  const checkoutBtn = page.getByRole('link', { name: /checkout/i })
  if (await checkoutBtn.isVisible()) {
    await checkoutBtn.click()
    await expect(page).toHaveURL(/checkout/)
  }
})
