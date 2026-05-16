import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

const EMAIL = process.env.USER_EMAIL
const PASSWORD = process.env.USER_PASSWORD
if (!EMAIL || !PASSWORD) throw new Error('USER_EMAIL and USER_PASSWORD env vars must be set before running e2e tests')

test('login page loads correctly', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Welcome back')).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
})

test('shows validation error for empty fields', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText(/required/i)).toBeVisible()
})

test('shows error for invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill('wrong@wrong.com')
  await page.locator('input[type="password"]').fill('wrongpassword')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible({ timeout: 8_000 })
})

test('login with valid credentials redirects to shop', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/shop/, { timeout: 15_000 })
})

test('register page loads correctly', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByText(/create|register|sign up/i)).toBeVisible()
})
