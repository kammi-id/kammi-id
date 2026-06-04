import { test, expect } from '@playwright/test'

test.describe('Dashboard Access Control', () => {
  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user cannot access nested dashboard routes', async ({ page }) => {
    await page.goto('/dashboard/kader')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page has correct welcome heading', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Selamat Datang di KAMMI.id')).toBeVisible()
  })
})
