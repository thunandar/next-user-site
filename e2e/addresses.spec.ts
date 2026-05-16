import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/shop/addresses')
})

test('addresses page loads', async ({ page }) => {
  await expect(page.locator('.t-h2', { hasText: 'Addresses' })).toBeVisible()
  await expect(page.getByRole('button', { name: /add address/i })).toBeVisible()
})

test('clicking add opens the new-address form', async ({ page }) => {
  await page.getByRole('button', { name: /add address/i }).first().click()
  await expect(page.getByText(/new address/i)).toBeVisible()
  await expect(page.getByText(/full name/i)).toBeVisible()
  await expect(page.getByText(/street address/i)).toBeVisible()
})

test('cancel closes the new-address form', async ({ page }) => {
  await page.getByRole('button', { name: /add address/i }).first().click()
  await expect(page.getByText(/new address/i)).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByText(/new address/i)).toBeHidden()
})

test('saves a new address then removes it', async ({ page }) => {
  await page.getByRole('button', { name: /add address/i }).first().click()

  const name = `E2E Tester ${Date.now()}`
  // Form has Name → Street → Line2 → City → Region → Postal → Country in order
  const allInputs = page.locator('div[class*="grid"] input').filter({ hasNot: page.locator('[type="checkbox"]') })
  await allInputs.nth(0).fill(name)
  await allInputs.nth(1).fill('123 Test Lane')
  await allInputs.nth(3).fill('Testville')
  await allInputs.nth(4).fill('TS')
  await allInputs.nth(5).fill('99999')

  await page.getByRole('button', { name: /save address/i }).click()
  await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })

  // Cleanup: remove the address we just created (trash icon)
  const card = page.locator('div').filter({ hasText: name }).first()
  const trashBtn = card.locator('button').last()
  if (await trashBtn.isVisible()) {
    await trashBtn.click()
    await page.waitForTimeout(500)
  }
})
