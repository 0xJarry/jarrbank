# Testing Strategy

## Testing Pyramid

```text
                  E2E Tests
                 /        \
            Integration Tests
               /            \
          Frontend Unit  Backend Unit
```

## Test Organization

### Frontend Tests
```text
tests/
├── components/     # Component unit tests
├── hooks/         # Custom hook tests  
├── pages/         # Page integration tests
└── e2e/          # End-to-end workflow tests
```

### Backend Tests
```text
tests/
├── unit/          # Service unit tests
├── integration/   # API integration tests
└── fixtures/      # Test data and mocks
```

### E2E Tests
```text
tests/e2e/
├── portfolio/     # Portfolio management flows
├── workflows/     # Compounding automation tests
└── auth/         # Wallet connection tests
```

## Test Examples

### Frontend Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { PortfolioOverview } from '@/components/portfolio/PortfolioOverview';

describe('PortfolioOverview', () => {
  it('displays total portfolio value', () => {
    render(<PortfolioOverview userId="test" />);
    expect(screen.getByText(/Total Value/)).toBeInTheDocument();
  });
});
```

### Backend API Test
```typescript
import { describe, it, expect } from 'vitest';
import { createCaller } from '../src/router';

describe('Portfolio API', () => {
  it('returns user portfolio data', async () => {
    const caller = createCaller(mockContext);
    const result = await caller.portfolio.getPortfolio({
      userId: 'test-user',
      chains: [1, 42161]
    });
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('complete compounding workflow', async ({ page }) => {
  // Connect wallet
  await page.goto('/connect');
  await page.click('[data-testid="connect-metamask"]');
  
  // Navigate to compounding
  await page.goto('/workflows/compound');
  await page.click('[data-testid="start-compound"]');
  
  // Verify workflow completion
  await expect(page.getByText('Workflow completed')).toBeVisible();
});
```
