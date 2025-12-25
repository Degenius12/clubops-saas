# ClubFlow Premium Design System

**Version 2.0** - Stripe-Inspired, Zero Gradients, Maximum Polish

## Philosophy

ClubFlow's design system is inspired by industry leaders like Stripe, Airbnb, and Linear. We prioritize:

1. **Clarity over decoration** - Every element serves a purpose
2. **Consistency over variety** - Predictable patterns build trust
3. **Accessibility first** - WCAG AA minimum, AAA preferred
4. **Performance** - Smooth 60fps animations, optimized for low-end devices
5. **Dark-first design** - Optimized for nightclub environments

## Core Principles

### NO GRADIENTS
We use **solid colors only**. Depth is created through:
- Subtle borders (1px, low opacity)
- Refined shadows
- Opacity variations
- Layering

### 8px Grid System
All spacing follows multiples of 8:
- **4px** - Micro spacing
- **8px** - Tight spacing
- **16px** - Default spacing
- **24px** - Comfortable spacing
- **32px** - Generous spacing
- **48px** - Section spacing

### Typography Hierarchy
```
Display: 48px / 3rem - Hero numbers, major KPIs
Heading 1: 36px / 2.25rem - Page titles
Heading 2: 24px / 1.5rem - Section headings
Heading 3: 20px / 1.25rem - Card titles
Body: 16px / 1rem - Main text
Small: 14px / 0.875rem - Secondary text
Tiny: 12px / 0.75rem - Labels, captions
```

---

## Color System

### Background Colors (Midnight Theme)
```css
--bg-darkest: #000000      /* Pure black - OLED optimized */
--bg-primary: #0A0A0B      /* Main background */
--bg-secondary: #111113    /* Card backgrounds */
--bg-tertiary: #18181B     /* Elevated elements */
--bg-elevated: #1F1F23     /* Hover backgrounds */
--bg-hover: #27272A        /* Active states */
```

### Accent Colors (Brand)
```css
/* Gold - Primary Accent */
--accent-gold: #D4AF37
--accent-gold-hover: #E5BE50
--accent-gold-pressed: #B8960C

/* Purple - Secondary Accent */
--accent-purple: #8B5CF6
--accent-purple-hover: #A78BFA

/* Cyan - Tertiary Accent */
--accent-cyan: #06B6D4
--accent-cyan-hover: #22D3EE
```

### Status Colors
```css
--status-success: #10B981   /* Emerald green */
--status-warning: #F59E0B   /* Amber */
--status-danger: #EF4444    /* Rose red */
--status-info: #3B82F6      /* Blue */
```

### Text Colors
```css
--text-primary: #FAFAFA     /* 95% white - Main text */
--text-secondary: #A1A1AA   /* 60% - Secondary text */
--text-tertiary: #71717A    /* 45% - Placeholders */
--text-muted: #52525B       /* 32% - Subtle labels */
```

### Border & Dividers
```css
--border-subtle: rgba(255, 255, 255, 0.04)
--border-default: rgba(255, 255, 255, 0.08)
--border-strong: rgba(255, 255, 255, 0.12)
--border-focus: rgba(212, 175, 55, 0.5)   /* Gold on focus */
```

---

## Component Library

### Buttons

#### Primary Button (Gold)
```tsx
<button className="btn-primary">
  Sign In
</button>
```
- **Use for**: Main CTAs, primary actions
- **Color**: Solid gold (#D4AF37)
- **States**: Hover lifts by 1px with deeper shadow

#### Secondary Button
```tsx
<button className="btn-secondary">
  Cancel
</button>
```
- **Use for**: Secondary actions
- **Style**: Transparent with border
- **Hover**: Subtle background fill

#### Ghost Button
```tsx
<button className="btn-ghost">
  View Details
</button>
```
- **Use for**: Tertiary actions, inline links
- **Style**: No border, transparent
- **Hover**: Subtle background

#### Icon Button
```tsx
<button className="btn-icon">
  <Icon className="h-5 w-5" />
</button>
```
- **Size**: 40x40px minimum (touch-friendly)
- **Use for**: Toolbar actions

### Cards

#### Premium Card
```tsx
<div className="card-premium p-6">
  {/* Content */}
</div>
```
- **Background**: Solid midnight-800
- **Border**: 1px white/6%
- **Shadow**: Subtle on rest, elevated on hover
- **Border radius**: 16px (2xl)
- **Padding**: 24-32px (generous)

#### Glass Card
```tsx
<div className="card-glass p-6">
  {/* Content */}
</div>
```
- **Use for**: Overlays, modals
- **Effect**: Backdrop blur
- **Transparency**: 80% background

### Inputs

#### Text Input
```tsx
<input
  type="text"
  className="input-premium"
  placeholder="Enter value..."
/>
```
- **Height**: 48px minimum (touch-friendly)
- **Border**: 1px subtle on rest
- **Focus**: Gold border with ring
- **Hover**: Border becomes more visible

#### Search Input
```tsx
<div className="relative">
  <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-text-tertiary" />
  <input type="search" className="search-input" />
</div>
```
- **Style**: Includes left padding for icon
- **Background**: Slightly darker than regular input

### Badges

```tsx
<span className="badge-success">Active</span>
<span className="badge-warning">Pending</span>
<span className="badge-danger">Error</span>
<span className="badge-info">Info</span>
<span className="badge-gold">VIP</span>
```
- **Shape**: Pill (fully rounded)
- **Size**: Compact padding
- **Colors**: 10% opacity background, solid text, 20% opacity border

### Stats Display

```tsx
<div className="space-y-2">
  <span className="stat-label">Today's Revenue</span>
  <div className="stat-value-lg">$12,456</div>
  <span className="stat-change-positive">
    +18% from yesterday
  </span>
</div>
```
- **Numbers**: JetBrains Mono font
- **Feature**: `tabular-nums` for alignment
- **Size**: Large (5xl) for hero KPIs

---

## Spacing Examples

### Card Padding
```tsx
/* Standard card */
<div className="card-premium p-6">  /* 24px */

/* Dense card */
<div className="card-premium p-4">  /* 16px */

/* Generous card */
<div className="card-premium p-8">  /* 32px */
```

### Section Gaps
```tsx
/* Tight sections */
<div className="space-y-4">  /* 16px */

/* Default sections */
<div className="space-y-6">  /* 24px */

/* Generous sections */
<div className="space-y-8">  /* 32px */
```

### Grid Gaps
```tsx
/* Dense grid */
<div className="grid gap-3">  /* 12px */

/* Default grid */
<div className="grid gap-4">  /* 16px */

/* Comfortable grid */
<div className="grid gap-5">  /* 20px */
```

---

## Animations & Transitions

### Standard Durations
```css
--transition-fast: 150ms    /* Micro-interactions */
--transition-base: 200ms    /* Standard transitions */
--transition-slow: 300ms    /* Complex transitions */
```

### Easing Function
All transitions use: `cubic-bezier(0.4, 0, 0.2, 1)`

This creates smooth, natural movement.

### Common Animations

#### Fade In
```tsx
<div className="animate-fade-in">
  Content appears smoothly
</div>
```

#### Fade In Up
```tsx
<div className="animate-fade-in-up">
  Content appears from below
</div>
```

#### Hover Elevation
```tsx
<div className="elevate-on-hover">
  Lifts on hover with shadow
</div>
```

---

## Accessibility

### Focus States
All interactive elements have visible focus rings:
```css
focus-visible:ring-2 ring-gold-500/40 ring-offset-2 ring-offset-midnight-900
```

### Touch Targets
Minimum 44x44px for all clickable elements:
```tsx
<button className="touch-target">
  Touch-friendly
</button>
```

### Color Contrast
- **Text on dark**: Minimum 7:1 ratio (AAA)
- **Interactive elements**: Minimum 4.5:1 ratio (AA)
- **Status colors**: Tested for color-blind accessibility

### Screen Reader Support
- All icons have `aria-label` or companion text
- Form inputs have associated labels
- Navigation is keyboard-accessible

---

## Best Practices

### DO ✓

1. **Use the 8px grid** - All spacing in multiples of 8
2. **Apply generous padding** - Cards should breathe (24-32px)
3. **Limit nesting** - Max 3 levels of card nesting
4. **Use semantic HTML** - `<button>` for actions, `<a>` for links
5. **Apply tabular-nums** - For all numeric data
6. **Test on mobile** - Touch targets, readability
7. **Use solid colors** - No gradients

### DON'T ✗

1. **Don't use gradients** - Stick to solid colors
2. **Don't mix font weights** - Use 400, 500, 600, 700 only
3. **Don't go below 14px** - Minimum font size
4. **Don't use arbitrary spacing** - Always use the 8px grid
5. **Don't stack shadows** - One shadow per element
6. **Don't exceed 4 accent colors** - Keep it simple
7. **Don't use pure white** - Use #FAFAFA for text

---

## Implementation Examples

### Dashboard KPI Card
```tsx
<Link to="/revenue" className="card-premium p-6 group">
  <div className="flex items-start justify-between mb-5">
    <div className="p-3 rounded-xl bg-gold-500/10 border border-white/[0.06]">
      <Icon className="h-6 w-6 text-gold-500" />
    </div>
    <span className="badge-success">+18%</span>
  </div>

  <div className="space-y-1">
    <div className="stat-value-lg tabular-nums">
      $12,456
    </div>
    <p className="stat-label">
      Today's Revenue
    </p>
  </div>
</Link>
```

### Form with Validation
```tsx
<form className="space-y-5">
  <div>
    <label className="block text-sm font-medium text-text-secondary mb-2">
      Email Address
    </label>
    <input
      type="email"
      className="input-premium"
      placeholder="you@example.com"
    />
  </div>

  <button type="submit" className="btn-primary w-full">
    Sign In
  </button>
</form>
```

### Data Table
```tsx
<table className="table-premium">
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
      <th>Revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr className="row-highlight">
      <td>Sarah M.</td>
      <td><span className="badge-success">Active</span></td>
      <td className="tabular-nums">$1,234</td>
    </tr>
  </tbody>
</table>
```

---

## Migration Guide

### From Old System to New

#### Buttons
```tsx
/* OLD */
<button className="btn-primary">
  /* Had gradient background */
</button>

/* NEW */
<button className="btn-primary">
  /* Now solid gold background */
</button>
```

#### Cards
```tsx
/* OLD */
<div className="card-premium">
  /* Had gradient background */
</div>

/* NEW */
<div className="card-premium">
  /* Now solid midnight-800 background */
</div>
```

#### Icons
```tsx
/* OLD */
<div className="bg-gradient-to-br from-gold-500 to-gold-600">
  <Icon />
</div>

/* NEW */
<div className="bg-gold-500/10 border border-white/[0.06]">
  <Icon />
</div>
```

---

## Resources

### Fonts
- **Sans**: Inter (400, 500, 600, 700)
- **Mono**: JetBrains Mono (for numbers)
- **Display**: Cal Sans (for branding)

### Icons
- **Library**: Heroicons v2 (outline for UI, solid for emphasis)
- **Size**: 16px (sm), 20px (md), 24px (lg)

### Design Tools
- **Figma**: Component library available
- **Storybook**: Interactive component demos
- **Tailwind**: Full utility class system

---

## Support

For questions or contributions:
- **GitHub**: Open an issue
- **Slack**: #design-system channel
- **Email**: design@clubflow.com

---

**Last Updated**: December 2025
**Maintainer**: ClubFlow Design Team
