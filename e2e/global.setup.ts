import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const authFile = 'e2e/.auth/user.json'

const EMAIL = process.env.USER_EMAIL || 'user@example.com'
const PASSWORD = process.env.USER_PASSWORD || 'password123'

setup('authenticate as user', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(EMAIL)
  await page.getByPlaceholder('••••••••').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.waitForURL(/shop/, { timeout: 15_000 })
  await expect(page).toHaveURL(/shop/)

  await page.context().storageState({ path: authFile })
})
