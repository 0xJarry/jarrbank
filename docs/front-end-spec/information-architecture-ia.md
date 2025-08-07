# Information Architecture (IA)

## Site Map / Screen Inventory

```mermaid
graph TD
    A[Landing/Connect] --> B[Main Portfolio Dashboard]
    B --> C[Cross-LP Compounding Wizard]
    B --> D[Portfolio Health Analysis]
    B --> E[Individual LP Position Detail]
    B --> F[Workflow History & Status]
    B --> G[Dashboard Customization]
    
    C --> C1[Step 1: Select Positions]
    C --> C2[Step 2: Claim Emissions]
    C --> C3[Step 3: Calculate Ratios]
    C --> C4[Step 4: Execute Swaps]
    C --> C5[Step 5: Compound LP]
    
    D --> D1[Composition Analysis]
    D --> D2[Risk Assessment]
    D --> D3[Recommendations]
    
    E --> E1[Position Performance]
    E --> E2[Fee History]
    E --> E3[Underlying Assets]
    
    F --> F1[Transaction History]
    F --> F2[Success Metrics]
    F --> F3[Failed Operations]
    
    G --> G1[Layout Designer]
    G --> G2[KPI Configuration]
    G --> G3[Alert Settings]
```

## Navigation Structure

**Primary Navigation:** Single-level horizontal navigation with dashboard as the hub. No traditional multi-level navigation - instead, contextual panels and modals branch from the main dashboard to maintain focus and reduce cognitive load.

**Secondary Navigation:** Context-sensitive action panels that appear within dashboard sections. For example, LP positions show inline actions like "View Details," "Compound," or "Claim Rewards" without leaving the main view.

**Breadcrumb Strategy:** Minimal breadcrumb usage due to dashboard-centric model. Only used within multi-step workflows (Cross-LP Compounding Wizard) to show progress: "Dashboard > Compounding > Step 2: Claim Emissions"
