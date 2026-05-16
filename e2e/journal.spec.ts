import { test, expect } from '@playwright/test'

test('journal index page loads', async ({ page }) => {
  await page.goto('/shop/journal')
  await expect(page.getByText('The Journal')).toBeVisible()
  await expect(page.getByRole('heading', { name: /notes from the studio/i })).toBeVisible()
})

test('journal page shows hero or empty state', async ({ page }) => {
  await page.goto('/shop/journal')
  await page.waitForLoadState('networkidle')
  const hasPosts = await page.getByText(/read the post/i).first().isVisible()
  const hasEmpty = await page.getByText(/no journal posts yet/i).isVisible()
  expect(hasPosts || hasEmpty).toBeTruthy()
})

test('clicking the hero post navigates to detail by slug', async ({ page }) => {
  await page.goto('/shop/journal')
  await page.waitForLoadState('networkidle')
  const firstPostLink = page.getByRole('link').filter({ has: page.locator('img, [class*="aspect"]') }).first()
  if (await firstPostLink.isVisible()) {
    await firstPostLink.click()
    await expect(page).toHaveURL(/\/shop\/journal\/[^/]+$/)
  }
})

test('journal nav link from shop works', async ({ page }) => {
  await page.goto('/shop')
  const journalLink = page.getByRole('link', { name: /journal/i }).first()
  if (await journalLink.isVisible()) {
    await journalLink.click()
    await expect(page).toHaveURL(/journal/)
  }
})
