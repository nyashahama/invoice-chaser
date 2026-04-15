# Tailwind CSS Migration Design

## Goal

Replace all manual CSS in `globals.css` (~1,162 lines) with Tailwind CSS v4 utility classes across all 28 component files. Achieve a full cutover with no residual manual CSS classes.

## Current State

- Next.js frontend with Tailwind v4 + `@tailwindcss/postcss` in `package.json` (installed but unused)
- All styling in a single `globals.css` file with CSS custom properties and class-based rules
- Components use CSS class names (`.hero`, `.btn-primary`, etc.) and extensive inline styles
- 28 component files need migration

## Approach: Full Cutover

Configure Tailwind v4's CSS-based theme (`@theme`) with all design tokens, then convert every component from manual CSS classes to Tailwind utility classes. Delete all manual CSS classes from `globals.css`.

## Design

### 1. Tailwind v4 Theme Configuration

All CSS custom properties become Tailwind theme tokens in `globals.css` using `@theme`:

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-black: #0a0a0a;
  --color-surface: #111111;
  --color-surface2: #161616;
  --color-border: #222222;
  --color-border-light: #2a2a2a;
  --color-green: #00e676;
  --color-green-dim: #00e67622;
  --color-green-mid: #00e67644;
  --color-red: #ff3d3d;
  --color-amber: #ffb300;
  --color-text: #f0ede8;
  --color-text-dim: #888888;
  --color-text-muted: #444444;

  /* Fonts */
  --font-mono: "JetBrains Mono", monospace;
  --font-display: "Syne", sans-serif;
  --font-serif: "Instrument Serif", serif;

  /* Animations */
  --animate-fade-up: fadeUp 0.6s ease forwards;
  --animate-fade-in: fadeIn 0.8s ease forwards;
  --animate-slide-in: slideIn 0.4s ease forwards;
  --animate-ticker: ticker 30s linear infinite;
  --animate-pulse-green: pulse-green 2s ease infinite;
}
```

### 2. Remaining `globals.css` Content

After migration, `globals.css` will contain only:
- `@import "tailwindcss";`
- `@theme { ... }` block
- `@keyframes` definitions (required for custom animations)
- `@layer base` for the noise overlay pseudo-element on `body::before`
- `@layer base` for `html { scroll-behavior: smooth; }` and `body` base styles
- `@layer utilities` for the `.reveal` / `.reveal.visible` scroll-reveal classes (since these are state-driven and toggled by JS)
- Responsive overrides using `@media (max-width: 900px)` will be handled by Tailwind's `lg:` prefix or `@screen` directives

### 3. Component Migration Pattern

Replace CSS class names with Tailwind utility classes directly in JSX:

**Before:**
```tsx
<div className="hero-eyebrow">Autopilot for overdue invoices</div>
```
```css
.hero-eyebrow {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--green);
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fadeUp 0.6s 0.1s ease forwards;
}
```

**After:**
```tsx
<div className="font-mono text-[11px] tracking-[0.2em] uppercase text-green mb-7 flex items-center gap-3 animate-fade-up delay-100">
  Autopilot for overdue invoices
</div>
```

### 4. Inline Styles Migration

All inline `style={{}}` props in components (Dashboard, DemoPage, CTA, Nav, Stats, etc.) will be converted to Tailwind utility classes.

### 5. Special Cases

| Pattern | Solution |
|---|---|
| Noise overlay `body::before` | `@layer base` in globals.css |
| Decorative pseudo-elements (`.section-label::after`, `.hero-eyebrow::before`) | Tailwind `after:` variants |
| Responsive breakpoints (`@media max-width: 900px`) | Tailwind `md:` / `lg:` responsive prefixes |
| Scroll reveal (`.reveal` / `.visible`) | Custom utility in `@layer utilities` |
| Animation delays | Tailwind `delay-*` utilities |

### 6. Files Changed

- `frontend/app/globals.css` — Reduced from ~1,162 lines to ~80 lines
- `frontend/postcss.config.mjs` — Confirm `@tailwindcss/postcss` plugin
- All component files in `frontend/components/` and `frontend/app/` — CSS classes → Tailwind utilities

### 7. Component Mapping

Full list of components to migrate:
- `Nav.tsx` - nav, nav-logo, nav-links, nav-cta
- `Hero.tsx` - hero, hero-content, hero-eyebrow, hero-title, hero-sub, hero-actions, hero-visual, invoice-card, invoice-header, dot variants, invoice-body, inv-row, inv-total, status-badge, reminder-thread, thread-label, reminder-item, r-icon variants, r-text, r-label, r-date
- `Stats.tsx` - stats-strip, stat-item, stat-num, stat-label
- `Ticker.tsx` - ticker-wrap, ticker, ticker-item, amt, ticker-sep
- `HowItWorks.tsx` - section, section-label, section-title, steps, step, step-num, step-icon, step-title, step-desc
- `ToneSelector.tsx` - tone-section, tone-inner, tone-cards, tone-card variants, tone-header, tone-name, tone-day, tone-preview, email-window, email-header, email-meta, email-field, email-body
- `Features.tsx` - features-grid, feature-card, feature-icon, feature-title, feature-desc
- `Testimonials.tsx` - testimonials, testimonial, testimonial-stars, testimonial-text, testimonial-author
- `Pricing.tsx` - pricing-grid, price-card, featured, price-tag, price-name, price-amount, price-period, price-features
- `CTA.tsx` - cta-final, cta-email-form, cta-input + extensive inline styles
- `Footer.tsx` - footer, footer-logo, footer-copy
- `LandingAuthShell.tsx` - orchestration only, no CSS classes
- `DemoPage.tsx` - extensive inline styles
- `Dashboard.tsx` - extensive inline styles, StatCard component
- `DashboardShell.tsx` - extensive inline styles
- `InvoiceList.tsx` - inline styles
- `InvoiceDetail.tsx` - inline styles
- `NewInvoiceForm.tsx` - inline styles
- `ProfilePanel.tsx` - inline styles
- `AuthGate.tsx` - inline styles
- `AuthModal.tsx` - inline styles
- `get-started/page.tsx` - inline styles
- `dashboard/page.tsx` - minimal styles

### 8. Verification

After migration:
1. `npm run build` must pass without errors
2. Visual regression check by running `npm run dev` and verifying each page
3. No manual CSS classes remain in components (grep for className patterns)
4. `globals.css` reduced to theme config + keyframes + noise overlay only