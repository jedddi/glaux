# Design System — Netron × Linear

## 1. Visual Theme & Atmosphere

Glaux uses an **airy minimalist** dark design. The philosophy: nothing decorative earns its pixels. Every element serves a functional purpose. The interface feels like a well-organized instrument panel — quiet, precise, and confident.

The canvas is a near-black (`#09090b`) that recedes completely, letting content breathe. Borders exist at the threshold of perception (`rgba(255,255,255,0.06)`). Text hierarchy is built through opacity and color, not weight — ghost text nearly vanishes, muted text whispers, secondary text informs, primary text commands. The single accent is a muted cyan (`#06b6d4`) used surgically: active navigation, key data values, and primary actions only.

**Key Principles:**
- Nothing decorative — every element earns its pixels
- Borders at the threshold of perception — `rgba(255,255,255,0.06)`
- Text hierarchy through opacity, not weight — ghost → muted → secondary → primary
- One accent color, used surgically — cyan on active states and key data only
- Space is the design — generous padding, minimal content density
- No glass morphism, no glow effects, no gradient meshes, no decorative animations

## 2. Color Palette

### Backgrounds
- **Canvas** (`#09090b`): Page background — near-black, recedes completely
- **Surface** (`#111113`): Sidebar, panels — barely lighter than canvas
- **Elevated** (`#19191b`): Hover states, dropdowns — subtle lift

### Text
- **Primary** (`#ededf0`): Headings, data values — not pure white
- **Secondary** (`#71717a`): Descriptions, labels, body text
- **Muted** (`#3f3f46`): Captions, timestamps, low-emphasis
- **Ghost** (`#27272a`): Decorative, disabled, structural hints

### Accent
- **Cyan** (`#06b6d4`): Active nav items, key metrics, primary actions
- **Cyan Hover** (`#0891b2`): Hover state for accent elements
- **Cyan Dim** (`rgba(6, 182, 212, 0.15)`): Subtle accent backgrounds

### Semantic
- **Success** (`#22c55e`): High accuracy, positive metrics
- **Warning** (`#eab308`): Moderate metrics, attention
- **Error** (`#ef4444`): Failures, errors, destructive actions

### Borders
- **Default** (`rgba(255, 255, 255, 0.06)`): Table rows, sidebar edge, card dividers
- **Hover** (`rgba(255, 255, 255, 0.10)`): Interactive element hover borders

## 3. Typography

### Font Families
- **Primary**: Geist (Vercel's typeface) — clean, technical, purpose-built
- **Mono**: Geist Mono — for all data, code, and technical values

### Hierarchy

| Role | Font | Size | Weight | Tracking | Use |
|------|------|------|--------|----------|-----|
| Display | Geist | 32px | 300 | -0.025em | Page titles (upload screen) |
| Heading | Geist | 20px | 400 | -0.015em | Section titles |
| Body | Geist | 14px | 400 | normal | Standard text |
| Body SM | Geist | 13px | 400 | normal | Secondary text, descriptions |
| Label | Geist | 11px | 500 | 0.06em | Uppercase section labels |
| Mono Data | Geist Mono | 13px | 400 | normal | Data values, tensor info |
| Mono LG | Geist Mono | 24px | 400 | -0.02em | Stat card values |
| Button | Geist | 13px | 500 | normal | Buttons and actions |

### Principles
- **Light weight for display**: 300 weight headings feel airy and confident
- **No bold anywhere**: 400 for body, 500 for labels/buttons maximum
- **Mono for all data**: Every number, tensor name, operator type uses Geist Mono
- **Uppercase for labels**: Section labels at 11px with 0.06em tracking

## 4. Component Styles

### Sidebar
- Width: 200px
- Background: `#111113`
- Border right: `1px solid rgba(255, 255, 255, 0.06)`
- Nav items: icon (14px) + label (13px), no descriptions
- Active: text color `#06b6d4`, no background change, no indicator bar
- Hover: text fades from `#71717a` to `#ededf0`

### Stat Cards
- No background, no border, no container
- Label: 11px uppercase, `#3f3f46`
- Value: 24px Geist Mono, `#ededf0` or `#06b6d4` for accent
- Arranged horizontally with 40px gaps

### Tables
- No container borders or backgrounds
- Header: 11px uppercase, `#3f3f46`
- Rows: separated by `1px solid rgba(255,255,255,0.06)`
- Data: 13px Geist Mono, `#ededf0`
- Hover: row gets `rgba(255,255,255,0.02)` background
- No rounded corners, no padding on container

### Buttons
- **Primary**: Text only (`#06b6d4`), no background, no border. Hover: underline
- **Secondary**: Text only (`#71717a`), hover: `#ededf0`
- **Ghost**: Text only, opacity-based states
- No filled backgrounds, no rounded containers

### Dropzone (Upload)
- Dashed border: `1px dashed rgba(255,255,255,0.06)`
- No background
- Drag active: border becomes `rgba(6, 182, 212, 0.40)`, subtle `rgba(6, 182, 212, 0.04)` background
- Upload icon: 24px, `#3f3f46`, turns `#06b6d4` on drag

### Loading
- Three-dot pulse animation (0.8px dots, staggered opacity)
- No spinners, no progress bars
- Muted text label beside dots

### Empty / Error States
- Title in heading style (20px, weight 400)
- Description in body-secondary
- Action as accent text link
- Centered vertically and horizontally

## 5. Layout

### Spacing
- Sidebar: 200px fixed
- Content padding: 48px (p-12)
- Section gaps: 40px (space-y-10)
- Stat gaps: 40px (gap-10)
- Table row padding: 8px vertical (py-2)

### Grid
- Max content width: fluid (fills available space)
- Stats: horizontal flex, no grid
- Tables: full-width, no container

### Whitespace Philosophy
- Content lives directly on the canvas — no card wrappers
- Generous padding creates structure, not borders
- Sections separated by space alone (40px gaps)
- No visual containers except the sidebar edge

## 6. Animation & Motion

### Rules
- **Opacity only** — no translateX, translateY, scale, or rotate
- **Fast** — 200-300ms duration
- **Staggered** — 40ms between items
- **No springs** — ease-out curves only
- **No decorative animations** — no floating orbs, gradient meshes, or glow pulses

### Specific
- Page enter: opacity 0 → 1, 300ms
- Panel switch: AnimatePresence with opacity exit/enter
- Content reveal: stagger 40ms, opacity only
- Table rows: no individual animation (too subtle to matter)
- Loading dots: CSS `pulse-dot` keyframe, staggered

## 7. Do's and Don'ts

### Do
- Use Geist for all UI text, Geist Mono for all data
- Keep borders at `rgba(255, 255, 255, 0.06)` — barely visible
- Use space (48px padding, 40px gaps) to create structure
- Use color sparingly — cyan only for active/accent, green/yellow/red only for semantics
- Let the canvas (`#09090b`) dominate — content floats in the void
- Use opacity for text hierarchy: `#ededf0` → `#71717a` → `#3f3f46` → `#27272a`
- Keep loading states minimal — three dots, no spinners

### Don't
- Don't add backgrounds to cards or containers
- Don't use glass morphism, backdrop blur, or translucent layers
- Don't use glow effects, gradient meshes, or decorative animations
- Don't add borders to tables or stat cards
- Don't use bold weights (500+ for body, 300-400 for headings)
- Don't add icons to section headers
- Don't add descriptions under sidebar nav items
- Don't use translate/scale in motion — opacity only
