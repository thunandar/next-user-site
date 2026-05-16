import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/shop/profile')
})

test('profile page loads', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Profile', exact: true })).toBeVisible()
})

test('form fields are pre-filled with current user', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  const nameVal = await page.locator('input').nth(0).inputValue()
  expect(nameVal.length).toBeGreaterThan(0)
})

test('security section is visible', async ({ page }) => {
  await expect(page.getByText('Security')).toBeVisible()
  await expect(page.getByText('Password').first()).toBeVisible()
  await expect(page.getByText(/login alerts/i)).toBeVisible()
})

test('change password form expands and collapses', async ({ page }) => {
  await page.getByRole('button', { name: 'Change' }).click()
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
