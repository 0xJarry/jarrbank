# Core Workflows

I'll illustrate the key system workflows using sequence diagrams to show component interactions, including both high-level user journeys and detailed technical flows with error handling paths.

## Portfolio Overview and Health Assessment Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Dashboard UI
    participant API as tRPC API
    participant Portfolio as Portfolio Aggregator
    participant RPC as RPC Batch Manager
    participant Price as Price Service
    participant Health as Health Calculator
    participant Cache as Redis Cache

    User->>Frontend: Open Dashboard
    Frontend->>API: portfolio.getPortfolio(userId, chains)
    
    API->>Portfolio: aggregatePortfolio(userId, chains)
    Portfolio->>Cache: getCachedPortfolio(userId)
    
    alt Cache Miss or Stale
        Portfolio->>RPC: batchCall([getBalance, getLPPositions])
        RPC->>Cache: getCachedRPCData()
        
        alt RPC Cache Miss
            RPC->>External: Alchemy/Infura RPC calls
            External-->>RPC: Blockchain data
            RPC->>Cache: cacheRPCData(data, 30s)
        end
        
        RPC-->>Portfolio: Token balances + LP positions
        
        Portfolio->>Price: getCurrentPrices(tokenAddresses)
        Price->>Cache: getCachedPrices()
        
        alt Price Cache Miss
            Price->>External: Moralis/DefiLlama API
            External-->>Price: Current prices
            Price->>Cache: cachePrices(data, 30s)
        end
        
        Price-->>Portfolio: USD valuations
        
        Portfolio->>Health: calculateHealthScore(portfolio)
        Health-->>Portfolio: Health analysis + recommendations
        
        Portfolio->>Cache: cachePortfolio(portfolio, 60s)
    end
    
    Portfolio-->>API: Complete portfolio with health data
    API-->>Frontend: Portfolio data
    Frontend->>User: Display dashboard (< 3 seconds)
    
    Note over Frontend,Cache: Error Handling
    alt RPC Provider Failure
        RPC->>External: Failover to Infura
        External-->>RPC: Backup data
    end
    
    alt Price Provider Failure
        Price->>External: Fallback to DefiLlama
        External-->>Price: Backup prices
    end
    
    alt Complete Failure
        Portfolio->>Cache: getStaleData(userId)
        Cache-->>Portfolio: Stale portfolio data
        Portfolio-->>Frontend: Cached data + staleness warning
    end
```

## Cross-LP Compounding Workflow (Core Differentiator)

```mermaid
sequenceDiagram
    participant User
    participant Wizard as Compounding Wizard
    participant API as tRPC API
    participant Workflow as Workflow Engine
    participant LP as LP Position Tracker
    participant DEX as DEX Protocol Adapters
    participant Simulator as Transaction Simulator
    participant Wallet

    User->>Wizard: Click "Compound Available" badge
    Wizard->>API: workflow.planCompounding(sourcePositions, target)
    
    API->>Workflow: planWorkflow(params)
    Workflow->>LP: getClaimableRewards(positionIds)
    LP-->>Workflow: Reward amounts and contracts
    
    Workflow->>DEX: calculateOptimalSwapRatios(rewards, targetLP)
    DEX-->>Workflow: Swap paths and amounts
    
    Workflow->>Simulator: simulateWorkflow(steps)
    Simulator->>External: Fork mainnet state
    Simulator->>External: Execute transactions on fork
    External-->>Simulator: Gas costs + expected outputs
    Simulator-->>Workflow: Simulation results
    
    Workflow-->>API: WorkflowPlan with steps + simulation
    API-->>Wizard: Display plan with costs/outcomes
    
    Wizard->>User: Show workflow preview
    User->>Wizard: Approve execution
    
    Wizard->>API: workflow.executeWorkflow(workflowId)
    API->>Workflow: executeWorkflow(workflowId)
    
    loop For Each Step
        Workflow->>DEX: buildTransaction(stepParams)
        DEX-->>Workflow: Transaction data
        
        Workflow-->>API: Transaction ready for signature
        API-->>Wizard: Transaction data
        
        Wizard->>Wallet: Request transaction signature
        Wallet-->>User: Confirm transaction
        User-->>Wallet: Approve
        Wallet-->>Wizard: Signed transaction
        
        Wizard->>API: workflow.updateStepStatus(stepId, txHash)
        
        alt Transaction Success
            API->>Workflow: updateStepStatus(completed)
            Workflow->>Workflow: Proceed to next step
        else Transaction Failed
            API->>Workflow: updateStepStatus(failed, error)
            Workflow->>User: Offer retry or abort options
        end
    end
    
    Workflow->>Portfolio: refreshPortfolio(userId)
    Portfolio-->>Workflow: Updated portfolio data
    
    Workflow-->>API: Workflow completed successfully
    API-->>Wizard: Success summary + portfolio changes
    Wizard->>User: Show success with before/after comparison
```
