# Testing Documentation

## Mock Wallet Connection for E2E Testing

This project uses wagmi's built-in mock connector for reliable E2E testing with wallet connections.

### Quick Start

To test the app in a connected wallet state, simply add `?test=true` to any URL:

```
http://localhost:3000?test=true
```

This will:
- Load the app with wagmi mock connectors instead of real wallet connectors
- Show "Mock Connector" as the only wallet option
- Auto-connect with test address `0x742d35Cc6634C0532925a3b8D000B8d8BE6a7871`
- Display full portfolio data and UI in connected state

### Test Environments

#### Connected State (Default Test Mode)
```
http://localhost:3000?test=true
```
- Uses `testConfigConnected` from `wagmi-test.ts`
- Connected to Ethereum Mainnet
- Address: `0x742d35Cc6634C0532925a3b8D000B8d8BE6a7871`

#### Avalanche Network Test
```javascript
// Set this before navigation in Playwright
await page.addInitScript(() => {
  window.__TEST_NETWORK__ = 'avalanche'
})
await page.goto('/?test=true')
```
- Uses `testConfigAvalanche` from `wagmi-test.ts`
- Connected to Avalanche network
- Same test address but on Avalanche chain

#### Disconnected State
```
http://localhost:3000
```
- Regular production config (no `?test=true`)
- No wallet connectors available
- Shows "Connect Wallet" button

### Files Structure

```
tests/
├── README.md                 # This documentation
├── fixtures/
│   └── wallet.ts            # Playwright fixtures for different wallet states
├── helpers/
│   └── wallet-setup.ts      # Legacy helper (deprecated - use wagmi mock instead)
└── e2e/
    └── visual-review.spec.ts # Example tests using the fixtures
```

### Playwright Fixtures

The project provides pre-configured fixtures for common test scenarios:

```typescript
import { test } from '../fixtures/wallet'

test('Connected wallet screenshot', async ({ connectedPage }) => {
  // Page is already connected with mock wallet
  await connectedPage.screenshot({ path: 'connected.png' })
})

test('Disconnected state', async ({ disconnectedPage }) => {
  // Page has no wallet connection
  await disconnectedPage.screenshot({ path: 'disconnected.png' })
})

test('Avalanche network', async ({ avalancheConnectedPage }) => {
  // Page connected to Avalanche network
  await avalancheConnectedPage.screenshot({ path: 'avalanche.png' })
})
```

### Configuration Details

The test mode detection happens in `Web3Provider.tsx`:

```typescript
function isTestEnvironment() {
  return (
    window.location.hostname === 'localhost' &&
    (window.location.search.includes('test=true') || 
     navigator.userAgent.includes('Playwright'))
  )
}
```

Test configurations are defined in `src/lib/wagmi-test.ts`:

- `testConfigConnected` - Ethereum Mainnet with mock wallet
- `testConfigAvalanche` - Avalanche network with mock wallet  
- `testConfigDisconnected` - No connectors (disconnected state)

### Usage Examples

#### Visual Testing
```typescript
test('Portfolio page connected', async ({ page }) => {
  await page.goto('/?test=true')
  await page.waitForLoadState('networkidle')
  
  // Click Mock Connector to connect
  await page.getByRole('button', { name: 'Connect Wallet' }).click()
  await page.getByRole('button', { name: 'Mock Connector' }).click()
  
  // Take screenshot of connected state
  await page.screenshot({ path: 'portfolio-connected.png', fullPage: true })
})
```

#### State Verification
```typescript
test('Verify connection state', async ({ connectedPage }) => {
  // Check UI shows connected state
  const addressDisplay = connectedPage.locator('text=0x742d')
  await expect(addressDisplay).toBeVisible()
  
  // Check connect button is hidden
  const connectButton = connectedPage.getByRole('button', { name: 'Connect Wallet' })
  await expect(connectButton).not.toBeVisible()
})
```

### Troubleshooting

**Mock connector not appearing?**
- Ensure URL includes `?test=true`
- Check browser developer tools for any console errors
- Verify `isTestEnvironment()` function is detecting test mode

**Connection not working?**
- Click "Connect Wallet" button first
- Select "Mock Connector" from the list
- Wait for UI to update (may take 500-1000ms)

**Wrong network?**
- Set `window.__TEST_NETWORK__` before navigation
- Use provided Playwright fixtures for pre-configured environments

### Migration from Old Approach

If you see references to `wallet-setup.ts` or manual `window.ethereum` injection, these are deprecated. Use the wagmi mock connector approach instead:

❌ **Old (deprecated):**
```typescript
await setupConnectedWallet(page)
```

✅ **New (recommended):**
```typescript
await page.goto('/?test=true')
// Use connectedPage fixture or manually click Mock Connector
```

The new approach is more reliable, integrates properly with wagmi, and eliminates timing issues.