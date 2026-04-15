# Restore Proportions & Add Polish Design

## Goal

The Tailwind migration inflated spacing and sizing across the landing page. Components that were compact and precise now feel oversized and spread out. This spec restores the original proportions from the manual CSS and adds subtle premium polish — the page should look nearly identical to the pre-migration design but with minor refinements.

## Problem

Tailwind utility classes like `py-12`, `px-10`, `mb-7` etc. map to larger values than the original CSS:
- `padding: 48px 40px` (step cards) → `py-12 px-10` (same 👍)
- `padding: 120px 48px` (sections) → `py-[120px] px-12` (px-12 = 48px 👍, but py-[120px] matches)
- `margin-bottom: 28px` (hero-eyebrow) → `mb-7` = 28px (👍)
- But many subtle differences crept in — some padding/padding values don't match exactly

The main issues:
1. **Inflated spacing** — some components got more space than the originals
2. **Emoji icons** look cheap for a premium product
3. **Missing subtle interactions** — hover effects were minimal in original, could be slightly richer
4. **Inconsistent patterns** — section labels, title sizes varied slightly

## Approach

### Phase 1: Restore Original Proportions

Audit each component against the original CSS values and fix any spacing/size regressions. The original globals.css values are preserved as comments below for reference.

Key original values to restore:

**Nav:**
- `padding: 20px 48px` → was correct
- Nav links gap: `32px` → `gap-8` (=32px) 👍

**Hero:**
- `padding: 120px 48px 80px` → need `pt-[120px] px-12 pb-20` (original was 80px bottom, not 5rem)
- `gap: 80px` → `gap-20` (=80px) 👍
- Hero eyebrow margin-bottom: `28px` → `mb-7` (=28px) 👍
- Hero title margin-bottom: `28px` → `mb-7` 👍
- Hero sub margin-bottom: `48px` → `mb-12` (=48px) 👍

**Stats:**
- `padding: 0 48px` → `px-12` 👍
- `padding: 40px 0` per stat → `py-10` (=40px) 👍

**Section:**
- `padding: 120px 48px` → `py-[120px] px-12` 👍
- Section title margin-bottom: `72px` → `mb-[72px]` 👍

**Steps:**
- `padding: 48px 40px` → `py-12 px-10` 👍

**Tone section:**
- `padding: 100px 48px` → `py-[100px] px-12` — currently `py-[100px]` was `py-[100px]` 👍

**CTA:**
- `padding: 140px 48px` → `pt-[140px] pb-[140px] px-12` 👍

**Footer:**
- `padding: 32px 48px` → `px-12 py-8` 👍

Most values actually look correct. Let me focus on what might feel "too big":

1. **Step cards gap-px** — the 1px gap between cards makes them feel cramped, but the original also used `gap: 1px` with `background: var(--border)` as separator 👍 — this matches
2. **Feature cards `p-10`** — original was `40px`, which equals `p-10` (2.5rem = 40px) 👍
3. **Pricing cards `py-12 px-9`** — original was `48px 36px`, px-9 = 36px 👍

So the specific proportions may actually match. The "too big" feeling might come from:

- **Hero mockup card width** — the original had `max-width` constraints on the visual column that may not be matching
- **Typography sizes** — the `clamp()` values should match but may render differently
- **Missing visual density** — the original had more content density in certain areas

### Phase 2: Premium Polish Additions

1. **Replace emojis** with styled text labels or unicode alternatives:
   - 📄 → `<span className="w-8 h-8 rounded bg-surface2 flex items-center justify-center font-mono text-[11px] text-green">01</span>` (number in a box)
   - Actually, simpler: use the step number that's already there ("// 01") as the prominent element and remove the emoji entirely
   - For features: replace 🔌⚡📬🔒 with simple styled icons using borders/shapes or just remove

2. **Add subtle hover animations** on interactive cards:
   - Step cards: add `hover:translate-y-[-2px] hover:shadow-lg` for subtle lift
   - Feature cards: same subtle lift effect
   - Pricing cards: subtle lift on hover
   - Testimonial cards: subtle lift

3. **Improve pricing card emphasis**:
   - Featured Pro card: add a subtle glow or brighter ring effect
   - Maybe `ring-2 ring-green` instead of `outline outline-1`

4. **Better button hover** — the current `hover:bg-[#1fffaa]` is good, keep it

5. **Subtle border-glow on focus** for inputs — already have `focus:border-green`

### Phase 3: Consistency Fixes

1. Ensure all section titles use identical Tailwind classes
2. Ensure all section labels use identical pattern
3. Make sure the `reveal` scroll animation still works consistently

## Files Changed

All landing page components:
- `frontend/components/Nav.tsx`
- `frontend/components/Hero.tsx`
- `frontend/components/Stats.tsx`
- `frontend/components/Ticker.tsx`
- `frontend/components/HowItWorks.tsx`
- `frontend/components/ToneSelector.tsx`
- `frontend/components/Features.tsx`
- `frontend/components/Testimonials.tsx`
- `frontend/components/Pricing.tsx`
- `frontend/components/CTA.tsx`
- `frontend/components/Footer.tsx`

## Implementation Notes

- This is purely a styling/refinement pass — no logic changes
- All changes are Tailwind class adjustments in existing components
- The original visual identity (dark theme, green accents, mono/serif/display typography, minimal aesthetic) is preserved
- The goal is "same look, tighter spacing, more polished feel"