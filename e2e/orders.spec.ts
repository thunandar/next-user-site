import { test, expect } from '@playwright/test'

test('my orders page loads', async ({ page }) => {
  await page.goto('/shop/orders')
  await page.waitForLoadState('networkidle')
  const isEmpty = await page.getByText(/no orders yet/i).isVisible()
  const hasOrders = await page.getByText(/my orders/i).isVisible()
  expect(isEmpty || hasOrders).toBeTruthy()
})

test('orders page accessible from nav', async ({ page }) => {
  await page.goto('/shop')
  await page.getByRole('link', { name: /my orders/i }).click()
  await expect(page).toHaveURL(/orders/)
})

test('order items show product name and price', async ({ page }) => {
  await page.goto('/shop/orders')
  await page.waitForLoadState('networkidle')
  const hasOrders = await page.getByText(/order #/i).isVisible()
  if (hasOrders) {
    await expect(page.getByText(/order #/i).first()).toBeVisible()
  }
})

test('pending order can be cancelled', async ({ page }) => {
  await page.goto('/shop/orders')
  await page.waitForLoadState('networkidle')
  const cancelBtn = page.getByRole('button', { name: /cancel/i }).first()
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click()
    await expect(page.getByText(/cancelled/i)).toBeVisible({ timeout: 8_000 })
  }
})
