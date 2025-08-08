# UI Design Analysis Prompt Templates

## Overview
This document contains structured prompt templates for AI-powered visual analysis of the JarrBank wallet connection interface using Claude Code CLI with Playwright MCP.

## Core Analysis Template

### Main Analysis Prompt
```
Analyze this wallet connection interface screenshot for JarrBank DeFi platform. Provide detailed feedback on:

**Visual Design Assessment:**
1. Layout & Composition
   - Visual hierarchy effectiveness
   - Spacing and alignment consistency
   - Component positioning and balance
   - Responsive design indicators

2. Typography Analysis
   - Font choice appropriateness for financial platform
   - Text size hierarchy and readability
   - Information density and clarity
   - Call-to-action text effectiveness

3. Color & Contrast
   - Brand consistency with JarrBank identity
   - Accessibility compliance (WCAG AA)
   - Visual feedback for interactive elements
   - Error/success state color usage

4. Interactive Elements
   - Button design and visual affordance
   - Hover/focus state indicators
   - Loading states and feedback
   - Connection status clarity

**UX Evaluation:**
1. User Journey Flow
   - Connection process clarity
   - Error handling visibility
   - Progress indication effectiveness
   - Recovery path availability

2. Trust & Security Indicators
   - Security messaging presence
   - Brand credibility elements
   - Wallet integration trust signals
   - Professional appearance rating

**Technical Assessment:**
1. Component Quality
   - shadcn/ui component usage
   - Visual consistency with design system
   - Mobile responsiveness indicators
   - Cross-browser compatibility signs

Provide specific, actionable recommendations with priority levels (High/Medium/Low).
```

## State-Specific Analysis Prompts

### Disconnected State Analysis
```
Analyze this disconnected wallet interface state focusing on:

1. **First Impression Impact**: Does the interface immediately communicate its purpose?
2. **Wallet Option Presentation**: Are the wallet choices clear and trustworthy?
3. **Call-to-Action Effectiveness**: How compelling is the connection prompt?
4. **Progressive Enhancement**: Is the disabled state handled appropriately?
5. **Information Architecture**: Is the layout guiding users toward the primary action?

Rate each aspect (1-10) and provide improvement suggestions.
```

### Connecting State Analysis
```
Analyze this wallet connection modal/overlay focusing on:

1. **Modal Design Quality**: Overlay design, backdrop, positioning
2. **QR Code Presentation**: Size, clarity, surrounding context
3. **Alternative Options**: Desktop vs mobile connection paths
4. **Loading Indicators**: Progress feedback and user expectations
5. **Cancellation Path**: Exit options and user control
6. **Brand Consistency**: Modal design alignment with main interface

Evaluate loading experience and suggest optimizations.
```

### Error State Analysis
```
Analyze this error state interface focusing on:

1. **Error Communication**: Clarity and user-friendliness of error messages
2. **Visual Error Indicators**: Color usage, iconography, prominence
3. **Recovery Actions**: Available paths to resolve the error
4. **User Guidance**: Help text and next steps clarity
5. **Emotional Design**: Tone and approach to error handling
6. **Technical Details**: Appropriate level of technical information shown

Assess error prevention and recovery mechanisms.
```

## Comparative Analysis Templates

### Cross-Browser Comparison
```
Compare these {browser1} vs {browser2} screenshots of the wallet interface:

1. **Visual Consistency**: Identify rendering differences
2. **Layout Variations**: Note spacing, alignment, or positioning changes  
3. **Font Rendering**: Compare typography appearance
4. **Color Accuracy**: Assess color reproduction consistency
5. **Interactive Elements**: Check button and form element differences
6. **Performance Indicators**: Note any visual performance issues

Priority-rank differences by user impact severity.
```

### Responsive Design Analysis
```
Analyze these {viewport_size} viewport screenshots:

1. **Layout Adaptation**: How well does the design respond to size constraints?
2. **Content Priority**: What content is emphasized or hidden?
3. **Touch Target Size**: Are interactive elements appropriately sized?
4. **Typography Scale**: Is text readable and appropriately sized?
5. **Navigation Changes**: How does the mobile experience differ?
6. **Performance Impact**: Any visual indicators of performance issues?

Evaluate mobile-first design implementation effectiveness.
```

## Accessibility Analysis Template

### WCAG Compliance Assessment
```
Evaluate this interface for accessibility compliance:

1. **Color Contrast**: Check text-background contrast ratios
2. **Focus Indicators**: Assess keyboard navigation visibility
3. **Screen Reader Compatibility**: Evaluate semantic structure
4. **Alternative Text**: Check image and icon descriptions
5. **Form Accessibility**: Assess input labeling and error handling
6. **Motion & Animation**: Evaluate auto-playing content appropriateness

Provide WCAG 2.1 AA compliance score and remediation steps.
```

## Design System Evaluation

### Component Consistency Check
```
Evaluate shadcn/ui component implementation:

1. **Design Token Usage**: Color, spacing, typography consistency
2. **Component Variants**: Proper use of size and style variants
3. **State Management**: Visual feedback for different component states
4. **Customization Quality**: How well are components adapted to brand
5. **Integration Seamless**: Component harmony within the interface
6. **Accessibility Built-in**: Component accessibility features utilization

Rate design system adherence and identify deviations.
```

## Performance & Technical Analysis

### Visual Performance Assessment
```
Analyze visual performance indicators:

1. **Loading States**: Quality of loading feedback and placeholders
2. **Image Optimization**: Screenshot quality and compression artifacts
3. **Layout Stability**: Evidence of layout shifts or reflow
4. **Rendering Quality**: Font smoothing, aliasing, visual artifacts
5. **Animation Smoothness**: Transition and animation quality indicators
6. **Resource Loading**: Visual signs of delayed content loading

Identify performance bottlenecks visible in the interface.
```

## Output Format Templates

### Structured Feedback Report
```
# Visual Analysis Report - {State Name} - {Date}

## Executive Summary
- **Overall Score**: {X/10}
- **Primary Strengths**: {List top 3}
- **Critical Issues**: {List priority issues}

## Detailed Assessment

### Layout & Design ({Score}/10)
{Specific observations and recommendations}

### User Experience ({Score}/10)  
{UX evaluation and suggestions}

### Technical Implementation ({Score}/10)
{Code and component quality assessment}

### Accessibility ({Score}/10)
{WCAG compliance evaluation}

## Action Items
### High Priority
- [ ] {Actionable item 1}
- [ ] {Actionable item 2}

### Medium Priority
- [ ] {Actionable item 3}
- [ ] {Actionable item 4}

### Low Priority
- [ ] {Actionable item 5}

## Browser-Specific Notes
{Cross-browser compatibility observations}

## Mobile Responsiveness
{Responsive design evaluation}

---
*Generated by Claude Code CLI with Playwright MCP*
*JarrBank Visual Testing Framework v1.0*
```

## Usage Instructions

1. **Select appropriate prompt template** based on analysis needs
2. **Customize variables** in {brackets} with actual values
3. **Include screenshot** with the prompt for visual analysis
4. **Review output** against structured format expectations
5. **Archive results** in docs/visual-testing/feedback/ directory

## Quality Assurance Checklist

- [ ] Prompt includes specific context about JarrBank platform
- [ ] Analysis criteria align with DeFi interface requirements
- [ ] Output format supports actionable recommendations
- [ ] Template covers accessibility and usability concerns
- [ ] Results can be tracked and compared over time