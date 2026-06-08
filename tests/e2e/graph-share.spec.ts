import { test, expect } from '@playwright/test'

// Helpers
async function loginAndLoadGraph(page: Parameters<typeof test>[1] extends (args: { page: infer P }) => unknown ? P : never) {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'e2e-share@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(search|graph|import)/)
  await page.goto('/graph')
  await page.waitForLoadState('networkidle')
}

test.describe('Graph sharing — golden path', () => {
  let shareUrl: string

  test('owner can generate a share link', async ({ page }) => {
    await loginAndLoadGraph(page)
    const generateBtn = page.getByRole('button', { name: /generate link/i })
    await generateBtn.waitFor({ timeout: 5000 })
    await generateBtn.click()
    const copyBtn = page.getByRole('button', { name: /copy link/i })
    await copyBtn.waitFor({ timeout: 5000 })
    expect(copyBtn).toBeVisible()
  })

  test('visitor sees shared graph with banner and no navigation on node click', async ({ browser }) => {
    // Get token via API (logged-in context)
    const ownerCtx = await browser.newContext()
    const ownerPage = await ownerCtx.newPage()
    await loginAndLoadGraph(ownerPage)

    // Ensure a token exists
    const res = await ownerPage.request.post('http://localhost:3000/api/share')
    const { token } = await res.json() as { token: string }
    shareUrl = `http://localhost:3000/shared/${token}`
    await ownerCtx.close()

    // Open share URL in a fresh context (no auth cookies)
    const visitorCtx = await browser.newContext()
    const visitorPage = await visitorCtx.newPage()
    await visitorPage.goto(shareUrl)
    await visitorPage.waitForLoadState('networkidle')

    // Banner visible
    await expect(visitorPage.getByText(/shared network/i)).toBeVisible()

    // Node click does not navigate away
    const canvas = visitorPage.locator('canvas')
    await canvas.waitFor()
    const box = await canvas.boundingBox()
    if (box) {
      await visitorPage.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      await visitorPage.waitForTimeout(500)
      expect(visitorPage.url()).toBe(shareUrl)
    }

    await visitorCtx.close()
  })

  test('revoked link shows inactive message', async ({ page, browser }) => {
    await loginAndLoadGraph(page)

    // Ensure we have a token
    const postRes = await page.request.post('http://localhost:3000/api/share')
    const { token } = await postRes.json() as { token: string }
    const url = `http://localhost:3000/shared/${token}`

    // Revoke
    await page.request.delete('http://localhost:3000/api/share')

    // Visit revoked link
    const visitorCtx = await browser.newContext()
    const visitorPage = await visitorCtx.newPage()
    await visitorPage.goto(url)
    await visitorPage.waitForLoadState('networkidle')
    await expect(visitorPage.getByText(/no longer active/i)).toBeVisible()
    await visitorCtx.close()
  })
})
