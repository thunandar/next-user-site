import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/shop/profile')
})

test('profile page loads', async ({ page }) => {
  await expect(page.locator('.t-h2', { hasText: 'Profile' })).toBeVisible()
})

test('form fields are pre-filled with current user', async ({ page }) => {
  // First page-content input is "Full name"; the header has a search box we skip with `main`.
  await expect(page.locator('main input').first()).toHaveValue(/.+/, { timeout: 8_000 })
})

test('security section is visible', async ({ page }) => {
  await expect(page.getByText('Security')).toBeVisible()
  await expect(page.getByText('Password').first()).toBeVisible()
  await expect(page.getByText(/login alerts/i)).toBeVisible()
})

test('change password form expands and collapses', async ({ page }) => {
  await page.getByRole('button', { name: 'Change', exact: true }).click()
  await expect(page.getByText('Current')).toBeVisible()
  await expect(page.getByText(/new password/i)).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByText('Current')).toBeHidden()
})

test('sidebar account nav links are visible', async ({ page }) => {
  await expect(page.getByRole('link', { name: /orders/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /wishlist/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /addresses/i }).first()).toBeVisible()
})

test('orders link from profile navigates to orders', async ({ page }) => {
  await page.getByRole('link', { name: 'Orders' }).first().click()
  await expect(page).toHaveURL(/orders/)
})
