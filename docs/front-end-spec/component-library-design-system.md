# Component Library / Design System

**Design System Approach:** Building a custom design system optimized for DeFi data density and financial UI patterns, with influence from shadcn/ui component library (as specified in the technical stack). Focus on components that handle complex financial data, multi-chain information, and guided workflow patterns.

## Core Components

### Portfolio Health Score

**Purpose:** Display numerical health score (0-100) with visual indicators and contextual explanations

**Variants:**
- Compact (dashboard widget)
- Detailed (health analysis page)
- Inline (list item context)

**States:**
- Excellent (90-100): Green with full progress indicators
- Good (70-89): Blue with mostly filled indicators  
- Fair (50-69): Yellow with moderate indicators
- Poor (0-49): Red with minimal indicators
- Loading: Skeleton animation
- Error: Grey with retry option

**Usage Guidelines:** Always pair score with actionable context. Use color coding consistently across all health-related UI elements. Ensure accessibility with both color and iconography.

### Cross-Chain Asset Display

**Purpose:** Show asset information with chain context, protocol identification, and value formatting

**Variants:**
- Token display (icon + name + chain badge)
- LP position display (paired tokens + protocol + chain)
- Summary display (aggregated across chains)

**States:**
- Active: Full color with current data
- Stale: Dimmed with timestamp
- Loading: Skeleton with pulsing animation
- Error: Error state with refresh option
- Offline: Cached data indicator

**Usage Guidelines:** Chain badges should be consistently positioned. Protocol logos require fallback text. USD values formatted with appropriate decimal precision.

### Workflow Progress Indicator

**Purpose:** Guide users through multi-step processes with clear progress visualization

**Variants:**
- Horizontal stepper (desktop wizard)
- Vertical stepper (mobile/sidebar)
- Compact progress (modal header)

**States:**
- Pending: Outlined circle with step number
- Active: Filled circle with step number
- Complete: Checkmark in filled circle
- Error: X mark in red circle
- Disabled: Greyed out

**Usage Guidelines:** Always show total steps and current position. Include step labels for clarity. Support both linear and non-linear navigation where appropriate.

### Context-Aware Action Button

**Purpose:** Display actions that change based on portfolio state and position status

**Variants:**
- Primary action (Compound, Claim)
- Secondary action (View Details, Export)
- Destructive action (Remove, Disconnect)
- Disabled action (Insufficient balance, Wrong network)

**States:**
- Default: Standard button styling
- Hover: Elevated with subtle animation
- Active: Pressed state
- Loading: Spinner with disabled interaction
- Success: Brief checkmark animation
- Error: Error styling with retry option

**Usage Guidelines:** Action text should be specific and value-oriented ("Claim $89" vs "Claim"). Group related actions logically. Provide clear feedback for state changes.

### Financial Data Table

**Purpose:** Display portfolio data with sortable columns, filtering, and contextual actions

**Variants:**
- Portfolio overview (tokens + LP positions)
- LP positions detailed view
- Transaction history
- Workflow history

**States:**
- Default: Standard row styling
- Hover: Highlighted row
- Selected: Selected state for batch operations
- Loading: Skeleton rows
- Empty: Empty state with guidance
- Error: Error message with retry

**Usage Guidelines:** Sort by value/importance by default. Provide clear column headers with sorting indicators. Support both desktop and mobile responsive layouts.

### Multi-Chain Network Selector

**Purpose:** Allow users to switch between networks and view network-specific data

**Variants:**
- Dropdown selector
- Tab-based selector
- Filter-based selector

**States:**
- Active network: Highlighted with connection indicator
- Available network: Standard styling
- Unavailable: Disabled with explanation
- Connecting: Loading indicator
- Error: Error state with retry

**Usage Guidelines:** Show connection status clearly. Provide network icons and names. Handle network switching with appropriate loading states.
