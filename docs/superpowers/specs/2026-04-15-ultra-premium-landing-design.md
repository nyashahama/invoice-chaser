# Ultra-Premium Landing Page Design

## Goal

Transform the InvoiceChaser landing page from a clean dark SaaS page into a Stripe-level premium experience using four targeted enhancements: background mesh gradients, glassmorphic cards, gradient headline text, and animated number counters.

## Current State

- Dark theme (#0a0a0a) with green (#00e676) accents
- Flat card backgrounds (bg-surface, bg-surface2)
- Solid border cards throughout
- Static text in all headlines
- Static stat numbers
- Recently migrated to Tailwind v4 with mobile-first responsive classes

## Design

### Enhancement 1: Background Mesh Gradients

Add soft, floating gradient orbs behind key sections for depth and atmosphere.

**Hero section:**
- Existing: single diagonal gradient orb at `-top-[200px] -right-[200px]`
- New: Add a second, larger orb at bottom-left for more depth
- Second orb: `w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(0,230,118,0.04)_0%,transparent_60%)]` positioned at bottom-left

**Stats section:**
- Add a subtle green glow underneath the stat numbers
- A centered gradient orb behind the grid: `w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(0,230,118,0.06)_0%,transparent_70%)]` absolute positioned, centered

**Pricing section:**
- Behind the featured (Pro) card, add a subtle glow
- `w-[400px] h-[600px] bg-[radial-gradient(circle,rgba(0,230,118,0.05)_0%,transparent_70%)]` positioned behind the middle card

**CTA section:**
- Already has one gradient orb — add a second, offset one for richer depth
- Second orb: `w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(0,230,118,0.04)_0%,transparent_70%)]` positioned top-right

All orbs: `pointer-events-none absolute`, positioned with negative offsets to bleed slightly outside their sections.

### Enhancement 2: Glassmorphic Cards

Transform key cards from flat backgrounds to glass-like surfaces with backdrop-blur and luminous borders.

**Invoice card (Hero):**
- Current: `bg-surface border border-border-default rounded-[4px]`
- New: `bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-[0_25px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]`

**Email window (ToneSelector):**
- Current: `bg-black border border-border-default rounded-[4px]`
- New: `bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]`

**Tone cards:**
- Current: `border border-border-default`
- Active state gets a subtle glow: `shadow-[0_0_20px_rgba(0,230,118,0.1)]` for polite, amber variant for firm, red variant for final

**Step cards (HowItWorks):**
- Current: `bg-black`
- Add inner glow on hover: `hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)]`

**Feature cards:**
- Same treatment as step cards

**Testimonial cards:**
- Current: `border border-border-default`
- New: `bg-white/[0.02] backdrop-blur-sm border border-white/[0.06]`
- Hover: `hover:border-white/[0.12]`

**Pricing cards:**
- Default cards: `bg-white/[0.02] backdrop-blur-sm border border-white/[0.06]`
- Featured Pro card: Animated gradient border using a `conic-gradient` that rotates. Implementation:
  - Outer wrapper div with `background: conic-gradient(from var(--angle), transparent, #00e676, transparent)` 
  - Inner card sits inside with a slight inset creating the border effect
  - Use `@property --angle` with CSS animation for rotation (add to globals.css)
  - Inner card gets `bg-surface/95 backdrop-blur-xl`

### Enhancement 3: Gradient Headline Text

Apply gradient text effects to key words/phrases in section titles using `bg-gradient-to-r bg-clip-text text-transparent`.

Implementation: Wrap the key phrase in a `<span>` with gradient classes.

**Hero:** "getting paid" → `<span className="bg-gradient-to-r from-text to-green bg-clip-text text-transparent">getting paid</span>`

**HowItWorks:** "autopilot." → `<em className="font-serif italic font-normal bg-gradient-to-r from-text-dim to-green bg-clip-text text-transparent">autopilot.</em>`

**Features:** "hate" → `<em className="font-serif italic font-normal bg-gradient-to-r from-text-dim to-green bg-clip-text text-transparent">hate</em>`

**Pricing:** "first invoice." → `<em className="font-serif italic font-normal bg-gradient-to-r from-text-dim to-green bg-clip-text text-transparent">first invoice.</em>`

**CTA:** "On autopilot." → `<span className="bg-gradient-to-r from-text to-green bg-clip-text text-transparent">On autopilot.</span>`

**Testimonials:** "now." → `<em className="font-serif italic font-normal bg-gradient-to-r from-text-dim to-green bg-clip-text text-transparent">now.</em>`

### Enhancement 4: Animated Number Counters

Create a `useCountUp` hook that animates numbers from 0 to their target value when the stats section enters the viewport.

**Implementation:**

New file: `frontend/hooks/useCountUp.ts`

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(
  end: number,
  duration: number = 2000,
  suffix: string = "",
  prefix: string = "",
  decimals: number = 0,
): { ref: React.RefObject<HTMLDivElement>; value: string } {
  const ref = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
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
            setCurrent(eased * end);

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

  const formatted = current < end * 0.01 && hasAnimated.current
    ? prefix + current.toFixed(decimals) + suffix
    : prefix + Math.round(current).toLocaleString() + suffix;

  return { ref, value: formatted };
}
```

**Stats component update:**

```tsx
// Each stat uses the hook:
const stat2M = useCountUp(2.4, 2000, "", "$", 1);
const stat94 = useCountUp(94, 2000, "%", "", 0);
const stat0 = useCountUp(0, 1000, "", "", 0);

// Render:
<div ref={stat2M.ref}>{stat2M.value}M</div>  // displays "$2.4M" animating
<div ref={stat94.ref}>{stat94.value}</div>      // displays "94%" animating
<div ref={stat94.ref}>0</div>                    // stays at "0" (no animation needed)
```

Actually, simplifying — the "0" stat should just stay 0. Only animate $2.4M and 94%. The "M" and "%" suffixes display outside the counter.

### Enhancement 5: Misc Premium Polish

**Noise overlay:** Reduce opacity from 0.6 to 0.4 for subtler grain (the noise texture on body::before is currently too prominent).

**Section dividers:** Replace thin `border-t border-border-default` lines with subtle gradient lines:
```css
background: linear-gradient(to right, transparent, var(--color-border-default), transparent);
height: 1px;
```

**Button hover micro-animation:** Add a subtle scale on the primary button:
`hover:scale-[1.02] active:scale-[0.98] transition-transform`

## Files Changed

- `frontend/app/globals.css` — Add gradient border animation keyframes, reduce noise opacity
- `frontend/components/Hero.tsx` — Second gradient orb, glassmorphic invoice card, gradient headline
- `frontend/components/Stats.tsx` — Background gradient orb, animated counters
- `frontend/hooks/useCountUp.ts` — New file for counter animation
- `frontend/components/HowItWorks.tsx` — Glassmorphic step cards, gradient headline
- `frontend/components/Features.tsx` — Glassmorphic feature cards, gradient headline
- `frontend/components/ToneSelector.tsx` — Glassmorphic email window, tone card glow
- `frontend/components/Testimonials.tsx` — Glassmorphic cards, gradient headline
- `frontend/components/Pricing.tsx` — Glassmorphic cards, animated gradient border on featured, gradient headline
- `frontend/components/CTA.tsx` — Second gradient orb, gradient headline, scale button hover
- `frontend/components/Footer.tsx` — Gradient divider line

## Out of Scope

- Logo/brand redesign
- New sections or content changes
- Dashboard/dashboard page changes
- Performance optimization (any animations should respect `prefers-reduced-motion`)
- Mobile app or email templates