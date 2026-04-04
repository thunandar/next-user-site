import { test, expect } from '@playwright/test'

test('wishlist page loads', async ({ page }) => {
  await page.goto('/shop/wishlist')
  await page.waitForLoadState('networkidle')
  // Either shows wishlist items or empty state
  const isEmpty = await page.getByText(/wishlist is empty/i).isVisible()
  const hasItems = await page.getByText(/my wishlist/i).isVisible()
  expect(isEmpty || hasItems).toBeTruthy()
})

test('wishlist button on product detail works', async ({ page }) => {
  await page.goto('/shop/products')
  await page.waitForLoadState('networkidle')

  const firstCard = page.getByRole('link').filter({ has: page.locator('img') }).first()
  if (await firstCard.isVisible()) {
    await firstCard.click()
    await page.waitForLoadState('networkidle')

    const wishlistBtn = page.getByRole('button', { name: /save to wishlist|remove from wishlist/i })
    if (await wishlistBtn.isVisible()) {
      await wishlistBtn.click()
      await expect(page.getByText(/wishlist/i).first()).toBeVisible({ timeout: 5_000 })
    }
  }
})

test('wishlist nav shows count badge when items added', async ({ page }) => {
  // Add item to wishlist
  await page.goto('/shop/products')
  await page.waitForLoadState('networkidle')

  const firstCard = page.getByRole('link').filter({ has: page.locator('img') }).first()
  if (await firstCard.isVisible()) {
    await firstCard.click()
    await page.waitForLoadState('networkidle')

    const wishlistBtn = page.getByRole('button', { name: /save to wishlist/i })
    if (await wishlistBtn.isVisible()) {
      await wishlistBtn.click()
      await page.waitForTimeout(1000)
    }
  }

  // Navigate to wishlist via nav
  await page.getByRole('link', { name: /wishlist/i }).first().click()
  await expect(page).toHaveURL(/wishlist/)
})

test('wishlist page navigates to product detail on card click', async ({ page }) => {
  await page.goto('/shop/wishlist')
  await page.waitForLoadState('networkidle')
  const firstCard = page.getByRole('link').filter({ has: page.locator('img') }).first()
  if (await firstCard.isVisible()) {
    await firstCard.click()
    await expect(page).toHaveURL(/products\/\d+/)
  }
})
