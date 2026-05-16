import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const authFile = 'e2e/.auth/user.json'

const EMAIL = process.env.USER_EMAIL
const PASSWORD = process.env.USER_PASSWORD
if (!EMAIL || !PASSWORD) throw new Error('USER_EMAIL and USER_PASSWORD env vars must be set before running e2e tests')

setup('authenticate as user', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  await page.goto('/login')
  await page.locator('input[type="email"]').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.waitForURL(/shop/, { timeout: 15_000 })
  await expect(page).toHaveURL(/shop/)

  await page.context().storageState({ path: authFile })
})
