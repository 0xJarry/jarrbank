# User Flows

## Portfolio Overview Flow

**User Goal:** Quickly assess portfolio health and identify optimization opportunities

**Entry Points:** 
- Direct dashboard access after wallet connection
- Refresh button for updated data
- Mobile app launch

**Success Criteria:** 
- Portfolio health visible within 10 seconds
- Actionable opportunities clearly highlighted
- Context-aware recommendations displayed

### Flow Diagram

```mermaid
graph TD
    A[Connect Wallet] --> B[Load Portfolio Data]
    B --> C{Data Load Success?}
    C -->|Yes| D[Display Dashboard]
    C -->|No| E[Show Error State]
    E --> F[Retry Options]
    F --> B
    
    D --> G[Show Portfolio Health Score]
    D --> H[Display Asset Composition]
    D --> I[Highlight Available Actions]
    
    I --> J{Actions Available?}
    J -->|Claimable Rewards| K[Show Compound Badge]
    J -->|Health Issues| L[Show Health Alert]
    J -->|None| M[Show Optimization Tips]
    
    K --> N[Compound Workflow Entry]
    L --> O[Health Analysis View]
    M --> P[Educational Content]
```

### Edge Cases & Error Handling:
- RPC connection failures → Graceful fallback with retry mechanisms
- Partial data loading → Progressive display with loading skeletons
- Zero balances → "Get Started" guidance instead of empty state
- Network switching → Automatic refresh with loading indicator
- Wallet disconnection → Secure session cleanup with reconnect prompt

**Notes:** This flow prioritizes immediate value display over comprehensive data loading, aligning with the "glanceable intelligence" principle.

## Cross-LP Compounding Workflow Flow

**User Goal:** Automate claiming, swapping, and compounding across multiple LP positions to maximize yield

**Entry Points:**
- "Compound Available" badge from dashboard
- Scheduled automation trigger
- Manual workflow initiation

**Success Criteria:**
- Multi-step process completed with 85% success rate (per NFR5)
- Clear progress indication at each step
- Transaction simulation before execution

### Flow Diagram

```mermaid
graph TD
    A[Initiate Compounding] --> B[Select Source Positions]
    B --> C[Select Target Position]
    C --> D[Simulate Workflow]
    D --> E{User Approves?}
    E -->|No| F[Modify Parameters]
    F --> D
    E -->|Yes| G[Start Execution]
    
    G --> H[Claim Emissions]
    H --> I{Claim Success?}
    I -->|No| J[Handle Failure]
    I -->|Yes| K[Calculate Swap Ratios]
    
    K --> L[Execute Swaps]
    L --> M{Swap Success?}
    M -->|No| N[Retry/Alternative Route]
    M -->|Yes| O[Add to LP Position]
    
    O --> P{LP Addition Success?}
    P -->|No| Q[Error Recovery]
    P -->|Yes| R[Update Portfolio]
    R --> S[Show Success Summary]
    
    J --> T[Workflow Status: Failed]
    N --> T
    Q --> T
```

### Edge Cases & Error Handling:
- Gas price spikes during execution → Dynamic gas adjustment with user approval
- Slippage exceeding tolerance → Transaction rejection with ratio recalculation
- Protocol maintenance/downtime → Alternative protocol routing suggestions
- Partial workflow completion → Resume from failed step capability
- Network congestion → Queue management with estimated completion times

**Notes:** The workflow includes comprehensive simulation and validation steps to achieve the 85% success rate requirement while maintaining user control at critical decision points.
