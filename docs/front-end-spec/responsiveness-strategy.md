# Responsiveness Strategy

## Breakpoints

| Breakpoint | Min Width | Max Width | Target Devices |
|------------|-----------|-----------|----------------|
| Mobile | 320px | 767px | Smartphones, mobile browsers |
| Tablet | 768px | 1023px | iPads, Android tablets, small laptops |
| Desktop | 1024px | 1439px | Standard desktops, laptops |
| Wide | 1440px | - | Large monitors, ultrawide displays |

## Adaptation Patterns

**Layout Changes:** 
- Mobile: Single-column vertical stacking with collapsible sections for portfolio data
- Tablet: Two-column hybrid with priority content in primary column
- Desktop: Multi-column dashboard with customizable section arrangement
- Wide: Extended dashboard with additional data columns and expanded charts

**Navigation Changes:**
- Mobile: Hamburger menu with slide-out navigation, bottom tab bar for primary actions
- Tablet: Horizontal navigation with icon+label combinations
- Desktop: Full horizontal navigation with dropdown menus for secondary actions
- Wide: Extended navigation with additional quick-access tools

**Content Priority:**
- Mobile: Health score → Portfolio value → Key opportunities → Detailed data (progressive disclosure)
- Tablet: Health score + Portfolio value side-by-side → Opportunities → Asset breakdown
- Desktop: Full dashboard view with customizable section priorities
- Wide: All sections visible simultaneously with expanded detail levels

**Interaction Changes:**
- Mobile: Touch-first interactions, swipe gestures, larger touch targets (48px minimum)
- Tablet: Hybrid touch/cursor interactions, context menus on long press
- Desktop: Hover states, keyboard shortcuts, drag-and-drop dashboard customization
- Wide: Enhanced hover details, multiple simultaneous workflows, picture-in-picture modals
