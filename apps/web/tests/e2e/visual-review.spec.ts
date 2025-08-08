import { test, expect } from '../fixtures/wallet'

// Quick connected state screenshot
test('Connected wallet - full page', async ({ connectedPage }) => {
  await connectedPage.screenshot({ 
    path: 'screenshots/connected-full.png', 
    fullPage: true 
  })
})

// Disconnected state for comparison
test('Disconnected wallet - full page', async ({ disconnectedPage }) => {
  await disconnectedPage.screenshot({ 
    path: 'screenshots/disconnected-full.png', 
    fullPage: true 
  })
})

// Header component in connected state
test('Connected wallet - header only', async ({ connectedPage }) => {
  const header = connectedPage.locator('header')
  if (await header.count() > 0) {
    await header.screenshot({ 
      path: 'screenshots/header-connected.png' 
    })
  }
})

// Avalanche network connection
test('Avalanche network - connected state', async ({ avalancheConnectedPage }) => {
  await avalancheConnectedPage.screenshot({ 
    path: 'screenshots/avalanche-connected.png',
    fullPage: true 
  })
})

// Test that wagmi mock connector works
test('Verify wallet connection state', async ({ connectedPage }) => {
  // Wait for wagmi to initialize
  await connectedPage.waitForTimeout(1000)
  
  // Check if wallet connection is shown in UI
  const walletConnected = await connectedPage.locator('text=0x742d').isVisible()
  expect(walletConnected).toBe(true)
  
  // Check that Connect Wallet button is not visible (should be connected)
  const connectButton = connectedPage.getByRole('button', { name: 'Connect Wallet' })
  const isConnectVisible = await connectButton.isVisible()
  expect(isConnectVisible).toBe(false)
})

// Test disconnected state
test('Verify disconnected state', async ({ disconnectedPage }) => {
  // Check that Connect Wallet button IS visible (not connected)
  const connectButton = disconnectedPage.getByRole('button', { name: 'Connect Wallet' })
  const isConnectVisible = await connectButton.isVisible()
  expect(isConnectVisible).toBe(true)
  
  // Check that no wallet address is displayed
  const walletConnected = await disconnectedPage.locator('text=0x742d').isVisible()
  expect(walletConnected).toBe(false)
})