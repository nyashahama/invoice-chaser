# Ultra-Premium Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform InvoiceChaser's landing page from clean dark SaaS to Stripe-level premium with mesh gradients, glassmorphic cards, gradient headlines, and animated counters.

**Architecture:** Pure CSS/Tailwind enhancements — no new dependencies. Add gradient orb divs to sections, swap flat card styles for glassmorphic variants, wrap headline key phrases in gradient spans, and create a `useCountUp` hook for stat number animations. CSS `@property` animation for the rotating gradient border on the featured pricing card.

**Tech Stack:** Next.js, React, Tailwind CSS v4, IntersectionObserver API

---

### Task 1: Add CSS infrastructure (gradient border animation + noise overlay adjustment)

**Files:**
- Modify: `frontend/app/globals.css`

Add the rotating gradient border animation infrastructure to globals.css. This requires a CSS `@property` declaration for `--angle` and a `@keyframes` for the rotation. Also reduce the noise overlay opacity from 0.6 to 0.4 for a subtler grain.

- [ ] **Step 1: Update globals.css**

Add the following to the `@theme` block:
```css
--animate-border-rotate: border-rotate 3s linear infinite;
```

Add `@property` declaration before the `@theme` block (CSS custom properties need `@property` for animation):
```css
@property --angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
```

Add keyframe:
```css
@keyframes border-rotate {
  to {
    --angle: 360deg;
  }
}
```

Also in the `@layer base` section, change the noise overlay `body::before` `opacity` from `0.6` to `0.35`:
```css
body::before {
  /* ... existing styles ... */
  opacity: 0.35;
}
```

- [ ] **Step 2: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/app/globals.css
git commit -m "feat: add gradient border animation infrastructure and reduce noise overlay"
```

---

### Task 2: Add mesh gradient orbs to Hero, Stats, Pricing, CTA

**Files:**
- Modify: `frontend/components/Hero.tsx`
- Modify: `frontend/components/Stats.tsx`
- Modify: `frontend/components/Pricing.tsx`
- Modify: `frontend/components/CTA.tsx`

Add second gradient orb to Hero (it already has one at top-right, add one at bottom-left). Add new gradient orbs to Stats, Pricing (behind featured card), and CTA (second orb top-right).

**Hero.tsx** — Add a second orb div after the existing one:
```tsx
<div className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,230,118,0.03)_0%,transparent_70%)] pointer-events-none" />
```

**Stats.tsx** — Wrap the grid in a `relative` div and add an orb before it:
```tsx
<div className="relative border-t border-b border-border-default bg-surface px-6 md:px-12 overflow-hidden">
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(0,230,118,0.06)_0%,transparent_70%)] pointer-events-none" />
  <div className="relative grid grid-cols-1 md:grid-cols-3 ...">
    {/* existing stat items */}
  </div>
</div>
```

**Pricing.tsx** — Add an orb behind the featured card. The grid needs `relative` and the featured card needs a glowing orb behind it. Add a centered orb:
```tsx
<div className="relative py-20 px-6 max-w-[1200px] mx-auto md:py-[120px] md:px-12" id="pricing">
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] bg-[radial-gradient(ellipse,rgba(0,230,118,0.04)_0%,transparent_70%)] pointer-events-none" />
  {/* ... existing content ... */}
</div>
```

**CTA.tsx** — Add a second orb at top-right:
```tsx
<div className="absolute top-[-200px] right-[-200px] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(0,230,118,0.04)_0%,transparent_70%)] pointer-events-none" />
```

- [ ] **Step 1: Add gradient orbs to all four components**

Read each file, add the gradient orb divs with `pointer-events-none absolute` positioning. Make sure parent sections have `relative` where needed for the orbs to position correctly.

- [ ] **Step 2: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Hero.tsx frontend/components/Stats.tsx frontend/components/Pricing.tsx frontend/components/CTA.tsx
git commit -m "feat: add mesh gradient orbs behind key sections"
```

---

### Task 3: Make cards glassmorphic (Hero invoice card, email window, testimonials, tone cards)

**Files:**
- Modify: `frontend/components/Hero.tsx`
- Modify: `frontend/components/ToneSelector.tsx`
- Modify: `frontend/components/Testimonials.tsx`
- Modify: `frontend/components/HowItWorks.tsx`
- Modify: `frontend/components/Features.tsx`

Replace flat card backgrounds with glassmorphic styling. The key pattern is:

**Invoice card (Hero):** Replace `bg-surface border border-border-default rounded-[4px]` with:
```
bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-[0_25px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]
```

**Email window (ToneSelector):** Replace `bg-black border border-border-default rounded-[4px]` with:
```
bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]
```

**Email header (inside ToneSelector):** Replace `bg-surface2` with `bg-white/[0.04]`

**Testimonial cards:** Replace `border border-border-default` with:
```
bg-white/[0.02] backdrop-blur-sm border border-white/[0.06]
```
And update hover to `hover:border-white/[0.12]`

**Step cards (HowItWorks):** Keep `bg-black` base but update hover shadow:
Replace `hover:bg-surface hover:-translate-y-0.5 hover:shadow-lg` with `hover:bg-white/[0.03] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]`

**Feature cards:** Same hover treatment as step cards.

**Invoice card header (Hero):** Replace `bg-surface2` with `bg-white/[0.04]`

**Invoice row borders:** Keep `border-border-default` but update card-level borders.

- [ ] **Step 1: Update each component's card styling**

Go through each file and swap flat card styles for glassmorphic variants. Keep all existing structure and layout classes unchanged — only modify background/border/shadow classes.

- [ ] **Step 2: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Hero.tsx frontend/components/ToneSelector.tsx frontend/components/Testimonials.tsx frontend/components/HowItWorks.tsx frontend/components/Features.tsx
git commit -m "feat: convert cards to glassmorphic style with backdrop-blur and translucent borders"
```

---

### Task 4: Animated gradient border on featured pricing card

**Files:**
- Modify: `frontend/components/Pricing.tsx`
- Modify: `frontend/app/globals.css` (if needed for @property)

The featured Pro card gets a rotating gradient border. This uses the `@property --angle` and `@keyframes border-rotate` added in Task 1.

Implementation pattern:
```tsx
{/* Wrapper with rotating gradient background */}
<div className="relative p-[1px] rounded-lg animate-border-rotate overflow-hidden"
     style={{ background: "conic-gradient(from var(--angle), transparent 30%, #00e676 50%, transparent 70%)" }}>
  {/* Inner card content sits inside, with its own background */}
  <div className="bg-surface/95 backdrop-blur-xl rounded-lg p-9">
    {/* ... existing Pro card content ... */}
  </div>
</div>
```

Note: The outer wrapper uses the `animate-border-rotate` animation (defined in globals.css) which rotates `--angle` from 0deg to 360deg, making the conic gradient spin. The 1px padding creates the border thickness.

Also make the non-featured pricing cards glassmorphic:
```
bg-white/[0.02] backdrop-blur-sm border border-white/[0.06]
```

- [ ] **Step 1: Implement gradient border on featured card and glassmorphic styling on all pricing cards**

Read Pricing.tsx, wrap the featured card in the gradient border wrapper, and update all card backgrounds.

- [ ] **Step 2: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Pricing.tsx frontend/app/globals.css
git commit -m "feat: add animated gradient border to featured pricing card"
```

---

### Task 5: Gradient headline text on key phrases

**Files:**
- Modify: `frontend/components/Hero.tsx`
- Modify: `frontend/components/HowItWorks.tsx`
- Modify: `frontend/components/Features.tsx`
- Modify: `frontend/components/Testimonials.tsx`
- Modify: `frontend/components/Pricing.tsx`
- Modify: `frontend/components/CTA.tsx`

Replace the `<em>` tags and key phrases with gradient text spans. The pattern:

```tsx
<span className="bg-gradient-to-r from-text to-green bg-clip-text text-transparent">getting paid</span>
```

For phrases that were `<em>` italic serif:
```tsx
<em className="font-serif italic font-normal bg-gradient-to-r from-text-dim to-green bg-clip-text text-transparent">autopilot.</em>
```

Specific replacements:
- **Hero**: "getting paid" in "Start getting paid." — wrap in gradient span
- **HowItWorks**: "autopilot." — change em to include gradient
- **Features**: "hate" — change em to include gradient
- **Testimonials**: "now." — change em to include gradient
- **Pricing**: "first invoice." — change em to include gradient
- **CTA**: "On autopilot." — wrap in gradient span, change from green to gradient

- [ ] **Step 1: Update all six components with gradient headline text**

Read each file, find the key phrases, and wrap them in gradient spans. Keep the existing font styling (font-serif, italic, etc.) on the gradient elements.

- [ ] **Step 2: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Hero.tsx frontend/components/HowItWorks.tsx frontend/components/Features.tsx frontend/components/Testimonials.tsx frontend/components/Pricing.tsx frontend/components/CTA.tsx
git commit -m "feat: add gradient headline text on key phrases"
```

---

### Task 6: Animated number counters for Stats

**Files:**
- Create: `frontend/hooks/useCountUp.ts`
- Modify: `frontend/components/Stats.tsx`

Create the `useCountUp` hook and apply it to the Stats component.

The hook uses IntersectionObserver to detect when the stats section is in view, then animates from 0 to the target value using `requestAnimationFrame` and a cubic ease-out curve.

```tsx
// useCountUp.ts
"use client";

import { useEffect, useRef, useState } from "react";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
}

export function useCountUp({ end, duration = 2000, decimals = 0 }: UseCountUpOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(eased * end);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return { ref, formatted };
}
```

Update Stats.tsx to use the hook for each stat. The "$2.4M" stat animates from 0 to 2.4 with 1 decimal. The "94%" stat animates from 0 to 94. The "0" stat stays as "0" (no animation needed).

```tsx
"use client";

import React from "react";
import { useCountUp } from "@/hooks/useCountUp";

export default function Stats() {
  const statRev = useCountUp({ end: 2.4, decimals: 1 });
  const statRate = useCountUp({ end: 94 });

  return (
    <div className="relative border-t border-b border-border-default bg-surface px-6 md:px-12 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(0,230,118,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="relative grid grid-cols-1 md:grid-cols-3 ...">
        <div ref={statRev.ref} className="...">
          <div className="text-[clamp(36px,4vw,54px)] ...">
            ${statRev.formatted}M
          </div>
          ...
        </div>
        <div ref={statRate.ref} className="...">
          <div className="text-[clamp(36px,4vw,54px)] ...">
            {statRate.formatted}%
          </div>
          ...
        </div>
        <div className="...">
          <div className="text-[clamp(36px,4vw,54px)] ...">
            0
          </div>
          ...
        </div>
      </div>
    </div>
  );
}
```

Note: The Stats component needs to become a client component (add `"use client"`) since it now uses a hook. Remove the explicit `React` import if not needed.

- [ ] **Step 1: Create `useCountUp.ts` hook**

Write the hook file as specified above.

- [ ] **Step 2: Update Stats.tsx to use the hook**

Convert Stats to client component, add `useCountUp` for the two animated values, wrap grid in `relative` div with gradient orb, render formatted values.

- [ ] **Step 3: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add frontend/hooks/useCountUp.ts frontend/components/Stats.tsx
git commit -m "feat: add animated number counters to Stats section"
```

---

### Task 7: Button hover micro-animation and gradient dividers

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: All components with primary buttons (Hero.tsx, CTA.tsx, Pricing.tsx)
- Modify: `frontend/components/Footer.tsx`

Add subtle scale on primary button hovers. Replace hard border-top/bottom section dividers with gradient lines.

**Button hover:** Add `hover:scale-[1.02] active:scale-[0.98]` to all `btn-primary` styled buttons across Hero, CTA, and Pricing. This is a micro-animation where the button scales up slightly on hover and down slightly on active/press.

**Gradient dividers:** The current `border-t border-b border-border-default` on Stats creates a hard line. Replace with a gradient divider that fades from transparent → border → transparent. Create a utility class in globals.css:

```css
@layer utilities {
  .divider-gradient {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--color-border-default), transparent);
  }
}
```

Replace Stats top/bottom borders with this gradient divider (render it as a div instead of using border on the element).

For the Ticker top border and CTA top border, similar treatment.

**Footer:** Replace `border-t border-border-default` with the gradient divider div.

- [ ] **Step 1: Add gradient divider utility to globals.css**

- [ ] **Step 2: Add scale micro-animation to primary buttons in Hero, CTA, Pricing**

Find all instances of `bg-green text-black font-mono text-[13px]` (primary button pattern) and add `hover:scale-[1.02] active:scale-[0.98] transition-transform` alongside existing hover classes.

- [ ] **Step 3: Replace hard borders with gradient dividers in Stats, Ticker, CTA, Footer**

- [ ] **Step 4: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/app/globals.css frontend/components/Hero.tsx frontend/components/CTA.tsx frontend/components/Pricing.tsx frontend/components/Stats.tsx frontend/components/Ticker.tsx frontend/components/Footer.tsx
git commit -m "feat: add button scale micro-animation and gradient section dividers"
```

---

### Task 8: Final polish pass and `prefers-reduced-motion`

**Files:**
- Modify: `frontend/app/globals.css`

Add `prefers-reduced-motion` media query to disable animations for accessibility:

```css
@layer base {
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

Also do a final visual review:
- Check all gradient orbs render correctly (not blocking content)
- Check glassmorphic cards look good on both desktop and mobile
- Verify gradient text is readable
- Verify animated counters work
- Verify the gradient border on the pricing featured card animates smoothly

- [ ] **Step 1: Add prefers-reduced-motion to globals.css**

- [ ] **Step 2: Build and test**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build && npm run lint && npm run test`
Expected: Build passes, lint passes (1 pre-existing warning), all 12 tests pass

- [ ] **Step 3: Commit**

```bash
git add frontend/app/globals.css
git commit -m "feat: add prefers-reduced-motion accessibility support"
```