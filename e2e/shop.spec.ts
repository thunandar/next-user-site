import { test, expect } from '@playwright/test'

test('homepage loads with hero section', async ({ page }) => {
  await page.goto('/shop')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /shop the edit/i })).toBeVisible()
})

test('homepage shows features row', async ({ page }) => {
  await page.goto('/shop')
  await expect(page.getByText(/free shipping over \$80/i).first()).toBeVisible()
  await expect(page.getByText(/secure checkout/i).first()).toBeVisible()
})

test('Shop Now link navigates to products', async ({ page }) => {
  await page.goto('/shop')
  await page.getByRole('link', { name: /shop the edit/i }).click()
  await expect(page).toHaveURL(/products/)
})

test('products page loads with grid', async ({ page }) => {
  await page.goto('/shop/products')
  await page.waitForLoadState('networkidle')
  await expect(page.getByPlaceholder(/search/i)).toBeVisible()
})

test('can search products', async ({ page }) => {
  await page.goto('/shop/products')
  const searchInput = page.getByPlaceholder(/search/i).first()
  await searchInput.fill('test')
  await searchInput.press('Enter')
  await page.waitForURL(/search=test/, { timeout: 8_000 })
  await expect(page.getByPlaceholder(/search/i).first()).toHaveValue('test')
})

test('can sort products', async ({ page }) => {
  await page.goto('/shop/products')
  await page.waitForLoadState('networkidle')
  const sortSelect = page.getByRole('combobox').last()
  await sortSelect.selectOption('price_asc')
  await page.waitForLoadState('networkidle')
  await sortSelect.selectOption('price_desc')
  await page.waitForLoadState('networkidle')
})

test('can filter by category pills', async ({ page }) => {
  await page.goto('/shop/products')
  await page.waitForLoadState('networkidle')
  // Click first non-All pill if visible
  const pills = page.locator('button').filter({ hasText: /^(?!All$).+/ })
  const count = await pills.count()
  if (count > 0) {
    await pills.first().click()
    await page.waitForLoadState('networkidle')
    // Click All to reset
    await page.getByRole('button', { name: 'All' }).click()
    await page.waitForLoadState('networkidle')
  }
})

test('clicking a product card navigates to detail page', async ({ page }) => {
  await page.goto('/shop/products')
  await page.waitForLoadState('networkidle')
  const firstCard = page.getByRole('link').filter({ has: page.locator('img') }).first()
  if (await firstCard.isVisible()) {
    await firstCard.click()
    await expect(page).toHaveURL(/products\/\d+/)
  }
})

test('product detail page shows correct sections', async ({ page }) => {
  await page.goto('/shop/products')
  await page.waitForLoadState('networkidle')
  const firstCard = page.getByRole('link').filter({ has: page.locator('img') }).first()
  if (await firstCard.isVisible()) {
    await firstCard.click()
    await expect(page.getByText(/add to cart/i)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText(/customer reviews/i)).toBeVisible()
  }
})
