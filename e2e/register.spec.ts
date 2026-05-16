import { test, expect } from '@playwright/test'

// Register tests run unauthenticated
test.use({ storageState: { cookies: [], origins: [] } })

test('register page loads with form fields', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
  await expect(page.getByText('Full name')).toBeVisible()
  await expect(page.getByText('Email')).toBeVisible()
  await expect(page.getByText('Password')).toBeVisible()
})

test('shows error when name is missing', async ({ page }) => {
  await page.goto('/register')
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page.getByText(/name is required/i)).toBeVisible({ timeout: 5_000 })
})

test('shows error when password is too short', async ({ page }) => {
  await page.goto('/register')
  // Fill name + email but use a short password
  const nameInput = page.locator('input').nth(0)
  const emailInput = page.locator('input[type="email"]')
  const pwInput = page.locator('input[type="password"]')
  await nameInput.fill('Test User')
  await emailInput.fill(`test+${Date.now()}@example.com`)
  await pwInput.fill('short')
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page.getByText(/at least 8 characters/i)).toBeVisible({ timeout: 5_000 })
})

test('has google sign up button and link back to login', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByText(/sign up with google/i)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
})

test('clicking sign in link routes to login', async ({ page }) => {
  await page.goto('/register')
  await page.getByRole('link', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/login/)
})
