# Animation & Micro-interactions

## Motion Principles

**Purposeful Motion:** Every animation serves a functional purpose - indicating state changes, providing feedback, or guiding attention. No decorative animations that could distract from critical financial data.

**Performance First:** All animations optimized for 60fps performance with CSS transforms and opacity changes. GPU acceleration for smooth interactions even during heavy RPC data loading.

**Respectful of Preferences:** Honor user's reduced motion preferences with `prefers-reduced-motion` media queries, providing immediate state changes instead of animated transitions.

**Financial Context Awareness:** Animations reflect the serious nature of financial operations - subtle, professional, and confidence-inspiring rather than playful.

## Key Animations

- **Portfolio Health Score Update:** Smooth number counter animation (Duration: 800ms, Easing: ease-out) when health score changes, with progress bar filling animation
- **Dashboard Section Loading:** Skeleton screen animation (Duration: continuous pulse, Easing: ease-in-out) for portfolio data sections during RPC calls
- **Workflow Progress Indicator:** Step completion animation (Duration: 400ms, Easing: ease-in-out) with checkmark appearance and progress line extension
- **Context-Aware Action Buttons:** Hover elevation (Duration: 200ms, Easing: ease-out) with subtle shadow increase and slight scale transform
- **Transaction Status Updates:** Success checkmark animation (Duration: 600ms, Easing: ease-out) with scaling and color transition for completed transactions
- **Chart Data Updates:** Smooth line chart transitions (Duration: 1000ms, Easing: ease-in-out) when portfolio composition changes
- **Modal/Drawer Transitions:** Slide-in animations (Duration: 300ms, Easing: ease-out) for workflow wizards and detailed views
- **Error State Animations:** Subtle shake animation (Duration: 400ms, Easing: ease-out) for failed form validations or transaction errors
