# Wireframes & Mockups

**Primary Design Files:** Design files will be created in Figma for detailed visual design and prototyping. Link to be provided after wireframe approval.

## Key Screen Layouts

### Main Portfolio Dashboard

**Purpose:** Central hub providing immediate portfolio visibility, health insights, and quick access to optimization actions

**Key Elements:**
- Portfolio health score prominently displayed in top section with color-coded status
- Customizable dashboard sections with drag-and-drop layout capability
- Asset composition chart showing category breakdown (blue chips, DeFi tokens, stablecoins, etc.)
- LP positions table with context-aware action buttons ("Compound Available", "Claim Rewards")
- Multi-chain portfolio totals with individual chain breakdowns
- Quick access toolbar for wallet connection, network switching, and refresh
- Contextual recommendation cards based on portfolio analysis

**Interaction Notes:** Dashboard sections can be rearranged via drag-and-drop. Action buttons appear contextually based on position status. Mobile version uses vertical stacking with collapsible sections.

**Design File Reference:** [To be created in Figma - Main Dashboard wireframes]

### Cross-LP Compounding Wizard

**Purpose:** Guide users through multi-step automation workflow with clear progress indication and validation

**Key Elements:**
- Progress indicator showing 5 steps: Select → Claim → Calculate → Swap → Compound
- Current step highlighted with detailed instructions and context
- Source positions selection with multi-select checkboxes and estimated rewards
- Target position dropdown with optimization recommendations
- Transaction simulation panel showing expected outcomes and gas costs
- Approval/confirmation interface with clear risk disclosures
- Real-time status updates during execution with detailed transaction logs

**Interaction Notes:** Users can navigate back to previous steps before execution begins. Each step includes validation and the ability to modify parameters. Mobile version uses full-screen step progression.

**Design File Reference:** [To be created in Figma - Compounding Wizard flow]

### Portfolio Health Analysis View

**Purpose:** Detailed breakdown of portfolio composition, risk assessment, and actionable recommendations

**Key Elements:**
- Health score breakdown showing contributing factors (diversification, concentration, risk exposure)
- Interactive composition charts with drill-down capability by category, chain, or protocol
- Risk assessment section highlighting impermanent loss exposure and protocol risks
- Prioritized recommendations list with impact estimates and implementation guidance
- Historical health tracking with trend visualization
- Comparison tools showing portfolio vs. common DeFi strategies

**Interaction Notes:** Charts are interactive with hover details and click-to-filter capability. Recommendations can be dismissed or marked as "remind later". Mobile version prioritizes key metrics with expandable detail sections.

**Design File Reference:** [To be created in Figma - Health Analysis screens]

### Individual LP Position Detail

**Purpose:** Comprehensive view of specific liquidity positions with performance analytics and management options

**Key Elements:**
- Position overview with current value, underlying asset breakdown, and performance metrics
- Fee earnings history with accumulated and claimable amounts
- Impermanent loss calculation with clear explanations
- Position-specific actions (claim, compound, remove liquidity, view on protocol)
- Historical performance chart with APR/APY tracking
- Protocol-specific information and documentation links
- Risk indicators specific to the position and protocol

**Interaction Notes:** Actions are contextually enabled based on position status. Charts show multiple time periods. Mobile version uses tabbed interface for different data sections.

**Design File Reference:** [To be created in Figma - LP Position Detail views]
