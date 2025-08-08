import { test as base, Page } from '@playwright/test'

export const test = base.extend<{
  connectedPage: Page
  disconnectedPage: Page  
  avalancheConnectedPage: Page
}>({
  // Standard connected wallet (Mainnet, default address)
  connectedPage: async ({ page }: { page: Page }, use: (page: Page) => Promise<void>) => {
    // Navigate with test=true to trigger test environment detection
    await page.goto('/?test=true')
    await page.waitForLoadState('networkidle')
    
    // Wait for React to hydrate and wagmi mock connector to initialize
    await page.waitForTimeout(1000)
    
    // The mock connector should auto-connect, but trigger connection if needed
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' })
    if (await connectButton.isVisible()) {
      await connectButton.click()
      // Click Mock connector (should appear as first option)
      const mockButton = page.locator('button').first()
      if (await mockButton.isVisible()) {
        await mockButton.click()
        await page.waitForTimeout(500)
      }
    }
    
    await use(page)
  },

  // Disconnected state (no wallet) - uses production config
  disconnectedPage: async ({ page }: { page: Page }, use: (page: Page) => Promise<void>) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await use(page)
  },

  // Connected to Avalanche network
  avalancheConnectedPage: async ({ page }: { page: Page }, use: (page: Page) => Promise<void>) => {
    // Set up Avalanche test environment
    await page.addInitScript(() => {
      // Set global flag for Avalanche test config
      (window as any).__TEST_NETWORK__ = 'avalanche'
    })
    
    await page.goto('/?test=true')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Auto-connect with Avalanche mock
    const connectButton = page.getByRole('button', { name: 'Connect Wallet' })
    if (await connectButton.isVisible()) {
      await connectButton.click()
      const mockButton = page.locator('button').first()
      if (await mockButton.isVisible()) {
        await mockButton.click()
        await page.waitForTimeout(500)
      }
    }
    
    await use(page)
  }
})

export { expect } from '@playwright/test'