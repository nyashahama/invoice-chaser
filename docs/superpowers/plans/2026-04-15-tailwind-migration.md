# Tailwind CSS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all manual CSS classes and inline styles with Tailwind CSS v4 utility classes across the entire frontend, reducing globals.css from ~1,162 lines to ~80 lines.

**Architecture:** Tailwind v4 CSS-based config (`@theme`) for design tokens (colors, fonts, animations). All component CSS class names replaced with Tailwind utility classes inline in JSX. Complex pseudo-elements (noise overlay, scroll reveal) kept as minimal `@layer` rules. Scroll reveal hook updated to use Tailwind class names.

**Tech Stack:** Next.js, React, Tailwind CSS v4, `@tailwindcss/postcss`

---

### Task 1: Set up Tailwind v4 @theme configuration in globals.css

**Files:**
- Modify: `frontend/app/globals.css`

This is the foundation task. Replace the entire globals.css with: (1) `@import "tailwindcss"`, (2) `@theme` block with all design tokens, (3) `@keyframes` for custom animations, (4) `@layer base` for body/html/noise overlay, (5) `@layer utilities` for scroll reveal.

- [ ] **Step 1: Replace globals.css with Tailwind v4 configuration**

Write the new `globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-black: #0a0a0a;
  --color-surface: #111111;
  --color-surface2: #161616;
  --color-border-default: #222222;
  --color-border-light: #2a2a2a;
  --color-green: #00e676;
  --color-green-dim: rgba(0, 230, 118, 0.13);
  --color-green-mid: rgba(0, 230, 118, 0.27);
  --color-red: #ff3d3d;
  --color-amber: #ffb300;
  --color-text: #f0ede8;
  --color-text-dim: #888888;
  --color-text-muted: #444444;

  --font-mono: "JetBrains Mono", monospace;
  --font-display: "Syne", sans-serif;
  --font-serif: "Instrument Serif", serif;

  --animate-fade-up: fade-up 0.6s ease forwards;
  --animate-fade-in: fade-in 0.8s ease forwards;
  --animate-slide-in: slide-in 0.4s ease forwards;
  --animate-ticker: ticker 30s linear infinite;
  --animate-pulse-green: pulse-green 2s ease infinite;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes ticker {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes pulse-green {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(0, 230, 118, 0);
  }
}

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    background-color: var(--color-black);
    color: var(--color-text);
    font-family: var(--font-display);
    overflow-x: hidden;
    cursor: default;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1000;
    opacity: 0.6;
  }
}

@layer utilities {
  .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Important notes on the `@theme` block:**
- Tailwind v4 colors: `--color-*` maps to utilities like `bg-surface`, `text-green`, `border-default`.
- Because `border-default` could conflict with Tailwind's built-in `border-default`, we use `--color-border-default` instead of `--color-border`. This gives us `border-border-default` for borders. Alternatively, we could use `--color-border` and get `border-border` — the migration should use whichever a) doesn't conflict with built-ins and b) reads naturally. Let me clarify: In Tailwind v4, `--color-border` would generate `bg-border`, `text-border`, etc. Since `border` is a Tailwind utility prefix, we should avoid naming conflicts. Use `--color-border-default` → `border-border-default` for the border color.
- Font families: `--font-mono`, `--font-display`, `--font-serif` → `font-mono`, `font-display`, `font-serif`.
- Animations: `--animate-fade-up` → `animate-fade-up`.

- [ ] **Step 2: Verify the build compiles**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

Expected: Build may show visual regressions (since we removed all the CSS classes), but should not crash. The Tailwind import and theme should be recognized.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/globals.css
git commit -m "feat: set up Tailwind v4 @theme config and replace manual CSS"
```

---

### Task 2: Migrate Nav component

**Files:**
- Modify: `frontend/components/Nav.tsx`

Replace all CSS class names with Tailwind utility classes. Remove any inline styles that can be expressed as Tailwind classes.

- [ ] **Step 1: Rewrite Nav.tsx with Tailwind classes**

The Nav component uses these CSS classes from globals.css:
- `nav` → position fixed, top, left, right, z-50, flex, items-center, justify-between, px-12, py-5, border-b border-border-default, bg-black/90, backdrop-blur-md
- `nav-logo` → font-mono text-[13px] font-bold tracking-[0.08em] text-green uppercase
- `nav-logo span` → text-text-dim
- `nav-links` → flex items-center gap-8 list-none
- `nav-links a` → font-mono text-[11px] tracking-[0.12em] uppercase text-text-dim no-underline hover:text-text transition-colors
- `nav-cta` → font-mono text-[11px] tracking-[0.1em] uppercase text-black bg-green px-5 py-2 rounded-[2px] no-underline hover:opacity-85 transition-opacity
- Inline styles on `.nav-auth` button and sign-out button → convert to Tailwind

Write the converted Nav.tsx:

```tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/context/SessionContext";

interface NavProps {
  onOpenAuthModal: (mode: "login" | "register") => void;
}

export default function Nav({ onOpenAuthModal }: NavProps) {
  const router = useRouter();
  const { authenticated, logout } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5 border-b border-border-default bg-black/90 backdrop-blur-md">
      <div className="font-mono text-[13px] font-bold tracking-[0.08em] text-green uppercase">
        Invoice<span className="text-text-dim">Chaser</span>
      </div>
      <ul className="flex items-center gap-8 list-none">
        {!authenticated && (
          <>
            <li>
              <a href="#how" className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-dim no-underline hover:text-text transition-colors">
                How it works
              </a>
            </li>
            <li>
              <a href="#pricing" className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-dim no-underline hover:text-text transition-colors">
                Pricing
              </a>
            </li>
            <li>
              <button
                className="bg-transparent border-none text-text-dim cursor-pointer font-mono text-[11px] tracking-[0.12em] uppercase p-0 hover:text-text transition-colors"
                onClick={() => onOpenAuthModal("login")}
                type="button"
              >
                Sign in
              </button>
            </li>
          </>
        )}
        <li>
          <a href="/demo" className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-dim no-underline hover:text-text transition-colors">
            Live demo ↗
          </a>
        </li>
        {authenticated ? (
          <>
            <li>
              <a href="/dashboard" className="font-mono text-[11px] tracking-[0.1em] uppercase text-black bg-green px-5 py-2 rounded-[2px] no-underline hover:opacity-85 transition-opacity">
                Dashboard →
              </a>
            </li>
            <li>
              <button
                className="bg-transparent border-none cursor-pointer text-text-dim font-mono text-[11px]"
                onClick={() => {
                  void logout();
                  router.push("/");
                }}
                type="button"
              >
                Sign out
              </button>
            </li>
          </>
        ) : (
          <li>
            <button
              className="font-mono text-[11px] tracking-[0.1em] uppercase text-black bg-green px-5 py-2 rounded-[2px] no-underline hover:opacity-85 transition-opacity border-none cursor-pointer"
              onClick={() => onOpenAuthModal("register")}
              type="button"
            >
              Create account →
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Nav.tsx
git commit -m "feat: migrate Nav component to Tailwind"
```

---

### Task 3: Migrate Hero component

**Files:**
- Modify: `frontend/components/Hero.tsx`

The Hero component is the most CSS-intensive component. It uses many classes from globals.css: hero, hero-content, hero-eyebrow, hero-title, hero-sub, hero-actions, btn-primary, btn-ghost, hero-visual, invoice-card, invoice-header, dot variants, invoice-title-bar, invoice-body, inv-row, inv-total, status-badge, status-overdue/status-paid, reminder-thread, thread-label, reminder-item, r-icon, r-sent/r-pending, r-text, r-label, r-date, amount.

- [ ] **Step 1: Rewrite Hero.tsx with Tailwind classes**

Convert each CSS class to Tailwind utility classes. Key mappings:

- `hero` → `min-h-screen grid grid-cols-2 items-center pt-[120px] px-12 pb-20 gap-20 relative overflow-hidden`
- `hero-content` → no specific class, just wrapper div
- `hero-eyebrow` → `font-mono text-[11px] tracking-[0.2em] uppercase text-green mb-7 flex items-center gap-3 opacity-0 animate-fade-up animate-delay-100` plus `before:content-[''] before:block before:w-6 before:h-px before:bg-green`
- `hero-title` → `text-[clamp(42px,5.5vw,76px)] font-extrabold leading-none tracking-tight mb-7 opacity-0 animate-fade-up animate-delay-200`
- `hero-title em` → `font-serif italic font-normal text-green`
- `hero-sub` → `text-[clamp(16px,1.8vw,20px)] text-text-dim leading-relaxed max-w-[480px] mb-12 font-normal opacity-0 animate-fade-up animate-delay-300`
- `hero-actions` → `flex items-center gap-5 flex-wrap opacity-0 animate-fade-up animate-delay-400`
- `btn-primary` → `inline-flex items-center gap-2.5 bg-green text-black font-mono text-[13px] font-bold tracking-[0.05em] uppercase px-8 py-4 rounded-[2px] no-underline transition-all hover:bg-[#1fffaa] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,230,118,0.3)] border-none cursor-pointer`
- `btn-ghost` → `inline-flex items-center gap-2 text-text-dim font-mono text-xs tracking-[0.08em] uppercase no-underline hover:text-text transition-colors py-4`
- `hero-visual` → `relative opacity-0 animate-fade-in animate-delay-500`
- `invoice-card` → `bg-surface border border-border-default rounded-[4px] overflow-hidden font-mono text-xs shadow-[0_40px_80px_rgba(0,0,0,0.6)]`
- `invoice-header` → `bg-surface2 py-3.5 px-5 border-b border-border-default flex items-center gap-2`
- `dot` → `w-2.5 h-2.5 rounded-full`
- `dot-r` → `bg-[#ff5f57]`
- `dot-y` → `bg-[#febc2e]`
- `dot-g` → `bg-[#28c840]`
- `invoice-title-bar` → `flex-1 text-center text-[10px] text-text-muted tracking-[0.1em] uppercase`
- `invoice-body` → `p-6`
- `inv-row` → `flex justify-between py-2 border-b border-border-default text-text-dim text-[11px] last:border-b-0`
- `inv-row strong` → `text-text`
- `inv-total` → `flex justify-between pt-4 pb-2 text-xl font-bold border-t-2 border-border-light mt-2 text-text`
- `inv-total .amount` → `text-red`
- `status-badge` → `inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-[2px] mt-1`
- `status-overdue` → `bg-red/15 text-red border border-red/30`
- `status-paid` → `bg-green-dim text-green border border-green/30`
- `reminder-thread` → `mt-4 border-t border-border-default pt-4`
- `thread-label` → `text-[9px] tracking-[0.2em] uppercase text-text-muted mb-2.5`
- `reminder-item` → `flex items-start gap-2.5 py-2 border-b border-border-default last:border-b-0 opacity-0`
- Animation delays on reminder-items: `animate-slide-in`, `animate-slide-in delay-[1200ms]`, `animate-slide-in delay-[1600ms]`, etc.
- `r-icon` → `w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0 mt-px`
- `r-sent` → `bg-green/15 text-green`
- `r-pending` → `bg-amber/15 text-amber`
- `r-text` → `flex-1`
- `r-label` → `text-[10px] text-text-dim mb-0.5`
- `r-date` → `text-[9px] text-text-muted`

Also handle the hero::after pseudo-element (radial gradient glow). This can't be a utility class, so add it as an `after:` variant or handle in globals.css `@layer components`. The simplest approach: keep it as a `div` pseudo-element in JSX.

- [ ] **Step 2: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Hero.tsx
git commit -m "feat: migrate Hero component to Tailwind"
```

---

### Task 4: Migrate Stats + Ticker + Footer components

**Files:**
- Modify: `frontend/components/Stats.tsx`
- Modify: `frontend/components/Ticker.tsx`
- Modify: `frontend/components/Footer.tsx`

These are smaller components that can be migrated together.

- [ ] **Step 1: Rewrite Stats.tsx with Tailwind classes**

Key mappings:
- `stats-strip` → `border-t border-b border-border-default bg-surface px-12 grid grid-cols-3 overflow-hidden`
- `stat-item` → `py-10 pr-12 pl-12 border-r border-border-default opacity-0 animate-fade-up first:pl-0 last:border-r-0` with delay variants
- `stat-num` → `text-[clamp(36px,4vw,54px)] font-extrabold leading-none mb-2 text-green tracking-tight`
- `stat-label` → `font-mono text-[11px] text-text-dim tracking-[0.1em] uppercase leading-relaxed`

- [ ] **Step 2: Rewrite Ticker.tsx with Tailwind classes**

Key mappings:
- `ticker-wrap` → `border-t border-b border-border-default bg-surface2 overflow-hidden py-3 whitespace-nowrap`
- `ticker` → `inline-flex gap-0 animate-ticker`
- `ticker-item` → `inline-flex items-center gap-2 font-mono text-[11px] text-text-muted tracking-[0.1em] px-10 uppercase`
- `amt` → `text-green font-bold`
- `ticker-sep` → `text-border-light`

- [ ] **Step 3: Rewrite Footer.tsx with Tailwind classes**

Key mappings:
- `footer` → `border-t border-border-default px-12 py-8 flex items-center justify-between`
- `footer-logo` → `font-mono text-xs font-bold text-text-muted tracking-[0.1em] uppercase`
- `footer-copy` → `font-mono text-[11px] text-text-muted`

Add responsive: on mobile, footer should be flex-col, gap-3, text-center, py-6

- [ ] **Step 4: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 5: Commit**

```bash
git add frontend/components/Stats.tsx frontend/components/Ticker.tsx frontend/components/Footer.tsx
git commit -m "feat: migrate Stats, Ticker, Footer components to Tailwind"
```

---

### Task 5: Migrate HowItWorks + Features components

**Files:**
- Modify: `frontend/components/HowItWorks.tsx`
- Modify: `frontend/components/Features.tsx`

- [ ] **Step 1: Rewrite HowItWorks.tsx with Tailwind classes**

Key mappings:
- `section` → `py-[120px] px-12 max-w-[1200px] mx-auto`
- `section-label` → `font-mono text-[10px] tracking-[0.25em] uppercase text-green mb-4 flex items-center gap-2.5 after:content-[''] after:flex-1 after:h-px after:bg-border-default`
- `section-title` → `text-[clamp(32px,4vw,52px)] font-extrabold leading-tight tracking-tight mb-[72px] max-w-[600px]`
- `section-title em` → `font-serif italic font-normal text-text-dim`
- `steps` → `grid grid-cols-3 gap-px bg-border-default border border-border-default`
- `step` → `bg-black py-12 px-10 relative transition-colors hover:bg-surface duration-300`
- `step-num` → `font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted mb-6`
- `step-icon` → `text-[32px] mb-5 leading-none`
- `step-title` → `text-xl font-extrabold mb-3 tracking-tight`
- `step-desc` → `text-sm text-text-dim leading-relaxed font-mono font-normal`

Responsive: on mobile, steps → grid-cols-1, section → padding reduced.

- [ ] **Step 2: Rewrite Features.tsx with Tailwind classes**

Key mappings:
- `features-grid` → `grid grid-cols-2 gap-px bg-border-default border border-border-default mt-[60px]`
- `feature-card` → `bg-black p-10 transition-colors hover:bg-surface duration-300`
- `feature-icon` → `text-2xl mb-4 leading-none`
- `feature-title` → `text-[17px] font-extrabold mb-2.5 tracking-tight`
- `feature-desc` → `font-mono text-xs text-text-dim leading-relaxed`

Responsive: on mobile → grid-cols-1.

- [ ] **Step 3: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add frontend/components/HowItWorks.tsx frontend/components/Features.tsx
git commit -m "feat: migrate HowItWorks and Features to Tailwind"
```

---

### Task 6: Migrate ToneSelector component

**Files:**
- Modify: `frontend/components/ToneSelector.tsx`

- [ ] **Step 1: Rewrite ToneSelector.tsx with Tailwind classes**

Key mappings:
- `tone-section` → `bg-surface border-t border-b border-border-default py-[100px] px-12`
- `tone-inner` → `max-w-[1200px] mx-auto grid grid-cols-2 gap-20 items-center`
- `tone-cards` → `flex flex-col gap-3`
- `tone-card` → `border border-border-default rounded-[3px] py-5 px-6 cursor-pointer transition-all relative overflow-hidden before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-transparent before:transition-colors hover:border-border-light hover:bg-surface2`
- `tone-card.active-tone` → `border-green bg-green-dim before:bg-green`
- `tone-card.active-amber` → `border-amber bg-amber/[0.08] before:bg-amber`
- `tone-card.active-red` → `border-red bg-red/[0.08] before:bg-red`
- `tone-header` → `flex items-center justify-between mb-1.5`
- `tone-name` → `text-sm font-extrabold tracking-tight`
- `tone-day` → `font-mono text-[10px] text-text-muted tracking-[0.1em] uppercase`
- `tone-preview` → `font-mono text-[11px] text-text-dim leading-relaxed`
- `email-window` → `bg-black border border-border-default rounded-[4px] overflow-hidden font-mono text-xs`
- `email-header` → `bg-surface2 py-3 px-4 border-b border-border-default flex items-center gap-2`
- `email-meta` → `py-4 px-5 border-b border-border-default`
- `email-field` → `flex gap-3 text-text-dim text-[11px] py-0.5`
- `email-field span:first-child` → `text-text-muted min-w-[40px]`
- `email-field strong` → `text-text`
- `email-body` → `py-5 px-5 leading-relaxed text-[11px] text-text-dim min-h-[160px] transition-all`

Also handle the inline styles in ToneSelector (opacity fading transition).

Responsive: on mobile, tone-inner → grid-cols-1.

- [ ] **Step 2: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/components/ToneSelector.tsx
git commit -m "feat: migrate ToneSelector to Tailwind"
```

---

### Task 7: Migrate Testimonials + Pricing components

**Files:**
- Modify: `frontend/components/Testimonials.tsx`
- Modify: `frontend/components/Pricing.tsx`

- [ ] **Step 1: Rewrite Testimonials.tsx with Tailwind classes**

Key mappings:
- `testimonials` → `grid grid-cols-3 gap-6 mt-[60px]`
- `testimonial` → `border border-border-default py-8 px-8 rounded-[2px] relative transition-colors hover:border-border-light`
- `testimonial-stars` → `text-amber text-xs mb-4 tracking-[2px]`
- `testimonial-text` → `font-serif italic text-[17px] leading-relaxed text-text mb-6`
- `testimonial-author` → `font-mono text-[11px] text-text-dim`
- `testimonial-author strong` → `text-text block mb-0.5`

Responsive: grid-cols-1 on mobile.

- [ ] **Step 2: Rewrite Pricing.tsx with Tailwind classes**

Key mappings:
- `pricing-grid` → `grid grid-cols-3 gap-px bg-border-default border border-border-default mt-[60px]`
- `price-card` → `bg-black py-12 px-9 relative transition-colors hover:bg-surface duration-300`
- `price-card.featured` → `bg-surface outline outline-1 outline-green outline-offset-[-1px]`
- `price-tag` → `font-mono text-[10px] tracking-[0.2em] uppercase text-green mb-2 block`
- `price-name` → `text-[22px] font-extrabold mb-5`
- `price-amount` → `text-[clamp(36px,4vw,52px)] font-extrabold tracking-tighter leading-none mb-1`
- `price-amount sup` → `text-[0.4em] font-normal text-text-dim align-super`
- `price-period` → `font-mono text-[11px] text-text-dim mb-8`
- `price-features` → `list-none mb-9`
- `price-features li` → `font-mono text-xs text-text-dim py-2 border-b border-border-default flex items-center gap-2.5 before:content-['—'] before:text-green before:text-[10px]`

Responsive: grid-cols-1 on mobile.

- [ ] **Step 3: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add frontend/components/Testimonials.tsx frontend/components/Pricing.tsx
git commit -m "feat: migrate Testimonials and Pricing to Tailwind"
```

---

### Task 8: Migrate CTA component

**Files:**
- Modify: `frontend/components/CTA.tsx`

The CTA component has many inline styles that need to be converted.

- [ ] **Step 1: Rewrite CTA.tsx with Tailwind classes**

Key CSS class mappings:
- `cta-final` → `bg-surface border-t border-border-default pt-[140px] pb-[140px] px-12 text-center relative overflow-hidden`
- `cta-final::before` → add a div pseudo-element for the radial gradient glow: `<div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,230,118,0.08)_0%,transparent_70%)] pointer-events-none" />`
- `cta-email-form` → `flex gap-3 justify-center max-w-[480px] mx-auto`
- `cta-input` → `flex-1 bg-black border border-border-light text-text font-mono text-[13px] px-[18px] py-3.5 rounded-[2px] outline-none focus:border-green placeholder:text-text-muted`

Also convert all inline styles in the success state and error display to Tailwind classes.

Keep the `<style>` tag with the `@keyframes ctaSpin` animation — move this keyframe into the globals.css `@theme` block or use a Tailwind custom animation.

- [ ] **Step 2: Add ctaSpin keyframe to globals.css**

Add to globals.css under `@keyframes`:

```css
@keyframes cta-spin {
  to {
    transform: rotate(360deg);
  }
}
```

And add to `@theme`:

```css
--animate-cta-spin: cta-spin 0.7s linear infinite;
```

- [ ] **Step 3: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add frontend/components/CTA.tsx frontend/app/globals.css
git commit -m "feat: migrate CTA component to Tailwind"
```

---

### Task 9: Migrate Dashboard components

**Files:**
- Modify: `frontend/components/Dashboard.tsx`
- Modify: `frontend/components/dashboard/DashboardShell.tsx`
- Modify: `frontend/components/dashboard/InvoiceList.tsx`
- Modify: `frontend/components/dashboard/InvoiceDetail.tsx`
- Modify: `frontend/components/dashboard/NewInvoiceForm.tsx`
- Modify: `frontend/components/dashboard/ProfilePanel.tsx`

These components use extensive inline styles. Convert all inline `style={{}}` props to Tailwind utility classes. Also convert CSS class names (`btn-primary`, `btn-ghost`) to Tailwind.

- [ ] **Step 1: Rewrite DashboardShell.tsx with Tailwind**

Replace all inline styles with Tailwind utility classes. The component uses:
- `radial-gradient` background → use `bg-[radial-gradient(...)]` 
- `var()` references → use theme tokens like `text-text`, `font-mono`, etc.
- `btn-ghost` class → Tailwind utility classes for ghost button

- [ ] **Step 2: Rewrite Dashboard.tsx with Tailwind**

Convert StatCard inline styles and all dashboard grid/layout styles to Tailwind.

- [ ] **Step 3: Rewrite InvoiceList.tsx with Tailwind**

Convert all inline styles to Tailwind classes. Replace `btn-primary` class.

- [ ] **Step 4: Rewrite InvoiceDetail.tsx with Tailwind**

Convert all inline styles to Tailwind classes. This is the most complex dashboard component. The `fieldStyle` constant and `Meta` component need conversion.

- [ ] **Step 5: Rewrite NewInvoiceForm.tsx with Tailwind**

Convert all inline styles, `fieldStyle` constant, and `btn-primary`/`btn-ghost` classes to Tailwind.

- [ ] **Step 6: Rewrite ProfilePanel.tsx with Tailwind**

Convert all inline styles, `fieldStyle` constant, and `btn-primary` class to Tailwind.

- [ ] **Step 7: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 8: Commit**

```bash
git add frontend/components/Dashboard.tsx frontend/components/dashboard/
git commit -m "feat: migrate Dashboard components to Tailwind"
```

---

### Task 10: Migrate Auth components

**Files:**
- Modify: `frontend/components/auth/AuthModal.tsx`
- Modify: `frontend/components/auth/AuthGate.tsx`

- [ ] **Step 1: Rewrite AuthModal.tsx with Tailwind**

Convert all inline styles to Tailwind classes. This component has extensive inline styles for the modal overlay, card, form fields, mode toggle buttons, etc.

- [ ] **Step 2: Rewrite AuthGate.tsx with Tailwind**

Convert all inline styles to Tailwind classes. Include `btn-primary` and `btn-ghost` class conversions.

- [ ] **Step 3: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add frontend/components/auth/AuthModal.tsx frontend/components/auth/AuthGate.tsx
git commit -m "feat: migrate Auth components to Tailwind"
```

---

### Task 11: Migrate DemoPage component

**Files:**
- Modify: `frontend/components/DemoPage.tsx`

- [ ] **Step 1: Rewrite DemoPage.tsx with Tailwind**

Convert all inline styles and `btn-primary`/`btn-ghost` classes to Tailwind utility classes.

- [ ] **Step 2: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/components/DemoPage.tsx
git commit -m "feat: migrate DemoPage to Tailwind"
```

---

### Task 12: Update useScrollReveal hook

**Files:**
- Modify: `frontend/hooks/useScrollReveal.ts`

The hook currently adds/removes the `visible` class and applies inline styles for stagger animation. Update the `staggerSelector` defaults and the inline style application to use Tailwind-compatible patterns.

- [ ] **Step 1: Update useScrollReveal.ts**

The hook still works with the `.reveal` / `.visible` pattern (which we kept in globals.css `@layer utilities`). Update the default staggerSelector from CSS class selectors to more generic ones, and keep the inline style approach for stagger animations (since these are dynamic delays):

```tsx
"use client";

import { useEffect, useRef } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  staggerSelector?: string;
  staggerDelay?: number;
}

export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options: UseScrollRevealOptions = {},
) {
  const {
    threshold = 0.15,
    staggerSelector,
    staggerDelay = 100,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");

          if (staggerSelector) {
            const children =
              entry.target.querySelectorAll<HTMLElement>(staggerSelector);
            children.forEach((child, i) => {
              child.style.opacity = "0";
              child.style.transform = "translateY(16px)";
              child.style.transition = "opacity 0.5s ease, transform 0.5s ease";
              setTimeout(
                () => {
                  child.style.opacity = "1";
                  child.style.transform = "none";
                },
                staggerDelay + i * staggerDelay,
              );
            });
          }

          observer.unobserve(entry.target);
        });
      },
      { threshold },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold, staggerSelector, staggerDelay]);

  return ref;
}
```

The change: remove the default `staggerSelector` value. Components that use it will need to pass the selector explicitly or not at all. The stagger animation approach (inline styles) is fine because it's JS-driven.

Actually, looking at the current code, the components pass `staggerSelector` explicitly, so we just need to update the defaults. The components currently pass things like `.step`, `.feature-card`, `.testimonial`, `.price-card`. These CSS class names will still work even with Tailwind since we're keeping them as regular class names alongside Tailwind utilities.

Wait — actually, if we're removing all the manual CSS classes, the selectors `.step`, `.feature-card`, etc. won't match unless we keep those as class names in the JSX. So we should either:
(a) Keep semantic class names alongside Tailwind utilities (e.g., `className="bg-black py-12 px-10 step"`) 
(b) Change the selector to data attributes

Option (a) is simpler and the class names serve as semantic markers. Let me revise: components will keep a semantic class name for stagger targeting, e.g., `className="bg-black py-12 px-10 step"`.

- [ ] **Step 2: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/hooks/useScrollReveal.ts
git commit -m "feat: update useScrollReveal hook for Tailwind compatibility"
```

---

### Task 13: Add responsive styles and final cleanup

**Files:**
- Modify: `frontend/app/globals.css`

The original CSS has a `@media (max-width: 900px)` breakpoint with responsive overrides. Since we're converting to Tailwind, responsive styles should be handled with Tailwind's responsive prefixes (`md:`, `lg:`). 

However, some of the responsive overrides in the original CSS modify flex directions, grid columns, padding, etc. These need to be applied directly in the component JSX using Tailwind responsive prefixes.

This task is about reviewing all components to ensure responsive Tailwind classes are properly applied. The original responsive breakpoint was at 900px, which maps to Tailwind's `lg:` prefix (1024px). Since the original was 900px, we may want to use a custom breakpoint or use `md:` (768px) as a close approximation, or define a custom screens value.

Add to the Tailwind `@theme` config in globals.css:

```css
--breakpoint-md: 900px;
```

This overrides Tailwind's default `md:` breakpoint to match the original 900px breakpoint.

Then ensure all components include responsive classes:
- Nav: hide `.nav-links` on mobile → `hidden lg:flex`
- Hero: `grid-cols-1 lg:grid-cols-2`, reduced padding on mobile
- Stats: `grid-cols-1 lg:grid-cols-3`
- Steps/Features/Pricing: `grid-cols-1 lg:grid-cols-3` or `lg:grid-cols-2`
- Footer: `flex-col lg:flex-row`
- etc.

- [ ] **Step 1: Add custom breakpoint to globals.css @theme**

Add `--breakpoint-md: 900px;` to the `@theme` block.

- [ ] **Step 2: Audit all components for responsive classes**

Review each component and ensure the responsive classes match the original `@media (max-width: 900px)` overrides.

- [ ] **Step 3: Verify build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add frontend/app/globals.css frontend/components/
git commit -m "feat: add responsive Tailwind classes and custom breakpoint"
```

---

### Task 14: Final verification and cleanup

**Files:**
- Verify: `frontend/app/globals.css` — should only contain Tailwind config, no manual CSS classes
- Verify: All component files — no manual CSS class references remaining (except semantic stagger markers like `step`, `feature-card`, etc.)
- Verify: Build passes

- [ ] **Step 1: Grep for any remaining manual CSS class usage**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && grep -rn "className=\"[a-z]" components/ app/ | grep -v "className=\"[^\"]*b[^\"]*\"" | head -50`

Look for any component that still references old CSS class names like `hero`, `nav-logo`, `stats-strip`, etc. that aren't Tailwind utilities or semantic stagger markers.

- [ ] **Step 2: Grep for inline style={{}} usage**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && grep -rn "style={{" components/ | head -50`

Any remaining inline styles should either be (a) dynamic/runtime values that can't be Tailwind classes, or (b) need conversion.

- [ ] **Step 3: Run full build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 4: Run linter**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run lint`

Expected: Lint passes with no errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Tailwind CSS migration — all manual CSS replaced"
```