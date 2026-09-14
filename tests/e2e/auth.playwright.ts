import { test, expect } from '@playwright/test'

test('should load the home page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/KAMMI.id/)
})
