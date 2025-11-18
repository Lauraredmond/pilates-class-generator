# Design System - Extracted from Bassline MVP

This document captures the complete design system from the existing Bassline MVP to be replicated pixel-perfect in the Pilates Class Planner v2.0.

---

## Color Palette

### Primary Brand Colors (HSL Format)

**Burgundy/Maroon Theme:**
```css
--burgundy: 0 100% 12%;           /* Deep burgundy - primary brand color */
--burgundy-light: 0 40% 92%;      /* Light burgundy tint */
--burgundy-dark: 0 100% 8%;       /* Darker burgundy */
--burgundy-accent: 0 80% 20%;     /* Accent burgundy */
--maroon: 351 65% 15%;            /* Rich maroon */
```

**Cream/Neutral Colors:**
```css
--cream: 45 30% 95%;              /* Warm cream - background */
--cream-dark: 45 20% 85%;         /* Darker cream for contrast */
```

### Functional Colors

**Light Mode:**
```css
--background: 45 30% 95%;         /* Cream background */
--foreground: 352 100% 12%;       /* Burgundy text */
--card: 45 20% 92%;               /* Card background */
--card-foreground: 352 100% 12%;  /* Card text */
--primary: 352 100% 12%;          /* Primary actions (burgundy) */
--primary-foreground: 45 30% 95%; /* Text on primary (cream) */
--secondary: 352 50% 20%;         /* Secondary actions */
--secondary-foreground: 45 30% 95%;
--muted: 352 20% 85%;             /* Muted elements */
--muted-foreground: 352 100% 25%;
--accent: 45 40% 88%;             /* Accent highlights */
--accent-foreground: 352 100% 12%;
--destructive: 0 84.2% 60.2%;     /* Error/delete actions */
--destructive-foreground: 45 30% 95%;
--border: 352 30% 75%;            /* Border color */
--input: 352 30% 75%;             /* Input borders */
--ring: 352 100% 12%;             /* Focus rings */
```

**Dark Mode:**
```css
--background: 352 100% 5%;        /* Very dark burgundy */
--foreground: 45 30% 95%;         /* Cream text */
--card: 352 100% 8%;
--card-foreground: 45 30% 95%;
--primary: 45 30% 95%;            /* Inverted - cream primary */
--primary-foreground: 352 100% 12%;
--secondary: 352 60% 15%;
--secondary-foreground: 45 30% 95%;
--muted: 352 40% 18%;
--muted-foreground: 352 20% 65%;
--accent: 352 40% 18%;
--accent-foreground: 45 30% 95%;
--border: 352 40% 18%;
--input: 352 40% 18%;
--ring: 45 30% 85%;
```

---

## Gradients

### Brand Gradients
```css
/* Energy gradient - used for primary buttons and highlights */
--energy-gradient: linear-gradient(
  135deg,
  hsl(352, 100%, 12%),  /* burgundy */
  hsl(352, 80%, 20%),   /* lighter burgundy */
  hsl(45, 60%, 70%)     /* cream-gold */
);

/* Hero gradient - backgrounds and headers */
--hero-gradient: linear-gradient(
  180deg,
  hsl(352, 100%, 12%) 0%,
  hsl(352, 100%, 8%) 100%
);

/* Glow gradient - accents and highlights */
--glow-gradient: linear-gradient(
  135deg,
  hsl(352, 80%, 25%),
  hsl(15, 70%, 35%)
);

/* Premium texture - main background */
--premium-texture:
  radial-gradient(circle at 20% 50%, hsl(352, 100%, 15%) 0%, transparent 50%),
  radial-gradient(circle at 80% 20%, hsl(352, 60%, 18%) 0%, transparent 50%),
  linear-gradient(135deg, hsl(352, 100%, 12%) 0%, hsl(352, 90%, 10%) 100%);

/* Card texture - card backgrounds */
--card-texture: linear-gradient(
  145deg,
  hsl(352, 40%, 92%) 0%,
  hsl(45, 30%, 95%) 50%,
  hsl(352, 30%, 88%) 100%
);
```

---

## Shadows

```css
/* Card shadow - elevates cards */
--card-shadow: 0 10px 40px hsla(352, 100%, 8%, 0.3);

/* Button shadow - makes buttons pop */
--button-shadow: 0 8px 32px hsla(352, 100%, 12%, 0.5);

/* Glow shadow - special highlights */
--glow-shadow: 0 0 50px hsla(352, 80%, 25%, 0.4);
```

---

## Typography

### Font Family
```css
font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
```

### Font Sizes (Common Patterns)
- **Headings (H1)**: `text-3xl` (1.875rem / 30px) - Page titles
- **Headings (H2)**: `text-2xl` (1.5rem / 24px) - Section titles
- **Headings (H3)**: `text-lg` (1.125rem / 18px) - Card titles
- **Body**: `text-base` (1rem / 16px) - Default text
- **Small**: `text-sm` (0.875rem / 14px) - Labels, captions
- **Tiny**: `text-xs` (0.75rem / 12px) - Meta info

### Font Weights
- **Bold**: `font-bold` (700) - Headings, emphasis
- **Semibold**: `font-semibold` (600) - Subheadings
- **Medium**: `font-medium` (500) - Labels
- **Normal**: `font-normal` (400) - Body text

---

## Spacing System

### Border Radius
```css
--radius: 0.75rem;              /* Base radius (12px) */
border-radius-lg: var(--radius);      /* 12px */
border-radius-md: calc(var(--radius) - 2px);  /* 10px */
border-radius-sm: calc(var(--radius) - 4px);  /* 8px */
```

### Common Spacing Patterns
- **Cards**: `p-4` to `p-6` (1rem to 1.5rem padding)
- **Buttons**: `h-14` (3.5rem height), `px-6` (1.5rem horizontal padding)
- **Page margins**: `px-4` (1rem horizontal), `pt-4` (1rem top)
- **Section gaps**: `mb-8` (2rem margin bottom)
- **Grid gaps**: `gap-3` (0.75rem)

---

## Animations & Transitions

### Transition Timing
```css
--transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

### Custom Animations

**Narrative Splash (Entry Animation):**
```css
@keyframes ptNarrativeSplash {
  0% {
    transform: scale(0.8) translateY(20px);
    opacity: 0;
  }
  50% {
    transform: scale(1.05) translateY(-5px);
    opacity: 0.8;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
/* Duration: 0.8s ease-out */
```

**Text Slide In:**
```css
@keyframes ptTextSlideIn {
  0% {
    transform: translateX(-20px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
/* Duration: 0.6s ease-out, Delay: 0.2s */
```

**Fade In Scale:**
```css
@keyframes fadeInScale {
  0% {
    transform: scale(0.9) translateY(10px);
    opacity: 0;
  }
  50% {
    transform: scale(1.02) translateY(-2px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
/* Duration: 0.6s ease-out */
```

---

## Component Patterns

### Buttons

**Primary Button (CTA):**
```jsx
<Button className="
  w-full h-14 text-lg
  bg-energy-gradient
  hover:opacity-90
  shadow-button
  transition-smooth
  disabled:opacity-50
  text-cream
  font-semibold
">
  Start Workout
</Button>
```

**Secondary/Outline Button:**
```jsx
<Button className="
  border-2
  border-cream/50
  text-cream/80
  hover:border-cream
  hover:text-cream
  hover:bg-burgundy-dark/30
  transition-smooth
">
  Cancel
</Button>
```

### Cards

**Standard Card:**
```jsx
<Card className="
  shadow-card
  border-0
  bg-card-texture
  border
  border-cream/20
">
  <CardContent className="p-6">
    {/* content */}
  </CardContent>
</Card>
```

**Interactive/Selectable Card:**
```jsx
<Card className="
  cursor-pointer
  transition-smooth
  shadow-card
  border-2
  bg-card-texture
  ${selected
    ? 'border-cream bg-glow-gradient/20'
    : 'border-cream/30 hover:border-cream/60'
  }
">
  {/* content */}
</Card>
```

### Selection Indicators (Radio/Checkbox Style)

**Circular Check:**
```jsx
<div className={`
  w-6 h-6 rounded-full border-2
  flex items-center justify-center
  ${selected
    ? 'border-primary bg-primary'
    : 'border-cream/50'
  }
`}>
  {selected && (
    <span className="text-primary-foreground text-sm">✓</span>
  )}
</div>
```

### Page Layout

**Standard Page Structure:**
```jsx
<div className="min-h-screen bg-premium-texture flex flex-col">
  {/* Content area */}
  <div className="flex-1 px-4 pt-4">
    {/* Back button */}
    <Button
      onClick={handleBack}
      variant="ghost"
      className="mb-4 p-2 hover:bg-burgundy-dark/20"
    >
      <ArrowLeft className="w-5 h-5 text-cream" />
    </Button>

    {/* Page title */}
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-cream mb-4">
        Page Title
      </h1>
      <p className="text-lg text-cream/80">
        Subtitle or description
      </p>
    </div>

    {/* Main content */}
    {/* ... */}

    {/* Bottom padding for nav */}
    <div className="mb-20">
      {/* CTA button */}
    </div>
  </div>

  {/* Bottom navigation */}
  <BottomNavigation />
</div>
```

---

## Icon System

**Primary Icon Library:** Lucide React
```bash
npm install lucide-react
```

**Common Icons Used:**
- `ArrowLeft` - Back navigation
- `Check` - Selection indicators
- `Home`, `Calendar`, `User`, etc. - Navigation

**Icon Sizing:**
- Default: `w-5 h-5` (20px)
- Large: `w-6 h-6` (24px)
- Small: `w-4 h-4` (16px)

---

## Responsive Design

### Breakpoints (Tailwind CSS Defaults)
```css
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1400px /* Large screens (custom max) */
```

### Container
```css
container: {
  center: true,
  padding: '2rem',
  screens: {
    '2xl': '1400px'  /* Max width */
  }
}
```

---

## Accessibility

### Focus States
- All interactive elements have visible focus rings
- Focus ring color: `ring-ring` (burgundy in light mode)
- Focus ring width: Default Radix UI focus indicators

### Color Contrast
- Burgundy (#1A0000) on Cream (#F5EDE4): **WCAG AAA** compliant
- Cream on Burgundy: **WCAG AAA** compliant
- All functional colors meet WCAG AA minimum

---

## Component Library

**Using shadcn/ui (Radix UI primitives):**

### Installed Components
- `accordion` - Collapsible sections
- `alert` / `alert-dialog` - Notifications and modals
- `button` - All button variants
- `card` - Content containers
- `select` - Dropdown selectors
- `dialog` - Modals
- `form` - Form controls with react-hook-form
- `toast` - Notifications (sonner)
- And 30+ more components

### Installation Pattern
```bash
npx shadcn-ui@latest add [component-name]
```

---

## Design Principles (from MVP)

1. **Sophisticated & Premium**: Burgundy/cream palette evokes luxury
2. **Smooth Interactions**: 0.4s transitions, subtle animations
3. **Clear Hierarchy**: Bold headlines, generous spacing
4. **Touch-Friendly**: 44px minimum touch targets (h-14 buttons)
5. **Consistent Feedback**: Hover states, selection indicators, shadows
6. **Texture & Depth**: Gradients, shadows, and layered backgrounds

---

## Usage Notes

### Applying to Pilates v2.0

**Keep Identical:**
- All colors (exact HSL values)
- Gradients and shadows
- Typography scale
- Spacing system
- Animation timings
- Button styles
- Card styles

**Adapt for Pilates:**
- Swap workout format icons (use Pilates-specific icons/emojis)
- Replace "Workout" terminology with "Class"
- Use same layout patterns for class builder drag-and-drop
- Maintain same navigation structure

---

*This design system ensures pixel-perfect replication of the Bassline MVP's visual language in the Pilates Class Planner v2.0.*
