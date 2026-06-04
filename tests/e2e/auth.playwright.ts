import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('home page loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/KAMMI/)
  })

  test('unauthenticated user is redirected from /dashboard to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders the form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Username').fill('non-existent-user')
    await page.getByLabel('Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expect(page.getByText('Username atau password salah')).toBeVisible({ timeout: 10000 })
  })
})
