# Restore Proportions & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore original spacing proportions from the pre-migration CSS and add subtle premium polish (remove emojis, add hover lifts, improve card emphasis)

**Architecture:** Compare each component's current Tailwind classes against the original CSS values. Fix any spacing regressions. Then add polish: replace emojis with styled elements, add subtle hover transforms, improve pricing card emphasis.

**Tech Stack:** Next.js, React, Tailwind CSS v4

---

### Task 1: Audit and fix Hero proportions + polish

**Files:**
- Modify: `frontend/components/Hero.tsx`

The Hero is the most prominent section. Compare current Tailwind values against the original CSS:

Original values to verify/restore:
- Hero section: `min-height: 100vh`, `padding: 120px 48px 80px` → currently `pt-[120px] px-12 pb-20` (pb-20=80px ✅)
- Hero grid gap: `80px` → `gap-20` ✅
- Hero eyebrow: `margin-bottom: 28px` → `mb-7` ✅  
- Hero title: `margin-bottom: 28px` → `mb-7` ✅
- Hero sub: `margin-bottom: 48px` → `mb-12` ✅
- Invoice card shadow: `0 40px 80px rgba(0,0,0,0.6)` ✅

Polish additions:
- Add subtle `transition-shadow hover:shadow-[0_4px_20px_rgba(0,230,118,0.08)]` to the invoice card for hover

- [ ] **Step 1: Read current Hero.tsx, compare values against original CSS, make corrections**

Read `frontend/components/Hero.tsx` and verify each Tailwind value matches the original. Fix any discrepancies. Key areas to check:
- Section padding values
- Grid gap
- Margin/padding on sub-elements
- Invoice card dimensions and border-radius
- Status badge sizing
- Reminder thread spacing

Add polish: hover effect on invoice card (`hover:shadow-[0_4px_20px_rgba(0,230,118,0.08)] transition-shadow duration-300`)

- [ ] **Step 2: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Hero.tsx
git commit -m "polish: restore Hero proportions and add subtle hover effect"
```

---

### Task 2: Audit and fix Nav, Stats, Ticker, Footer proportions + polish

**Files:**
- Modify: `frontend/components/Nav.tsx`
- Modify: `frontend/components/Stats.tsx`
- Modify: `frontend/components/Ticker.tsx`
- Modify: `frontend/components/Footer.tsx`

Original values to verify:
- Nav: `padding: 20px 48px` → `px-12 py-5` (py-5=20px ✅)
- Stats strip: `padding: 0 48px` → `px-12` ✅, stat items `padding: 40px` → `py-10` ✅
- Ticker: `padding: 12px 0` → `py-3` ✅
- Footer: `padding: 32px 48px` → `px-12 py-8` ✅

Polish additions:
- Nav: Add subtle `transition-all duration-200` to nav CTA links for smoother hover
- Footer: No extra polish needed

- [ ] **Step 1: Verify and fix proportion issues in Nav, Stats, Ticker, Footer**

Read all 4 files. Verify Tailwind values match originals. Fix any discrepancies. Add subtle transition polish to nav links.

- [ ] **Step 2: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/components/Nav.tsx frontend/components/Stats.tsx frontend/components/Ticker.tsx frontend/components/Footer.tsx
git commit -m "polish: restore Nav/Stats/Ticker/Footer proportions and add transitions"
```

---

### Task 3: Replace emojis in HowItWorks and Features + fix proportions + add hover lifts

**Files:**
- Modify: `frontend/components/HowItWorks.tsx`
- Modify: `frontend/components/Features.tsx`

Original values to verify:
- Section: `padding: 120px 48px` → ✅
- Steps: `padding: 48px 40px` → `py-12 px-10` ✅
- Step num: `margin-bottom: 24px` → `mb-6` ✅
- Feature cards: `padding: 40px` → `p-10` ✅

Polish changes:
- Remove emojis (📄🎚️✅ for steps, 🔌⚡📬🔒 for features)
- Replace step emojis with styled number indicators (already have `// 01` etc, make them more prominent)
- Replace feature emojis with simple bordered/iconographic elements

For HowItWorks steps, remove the emoji line and strengthen the step number:
```tsx
// Before:
<div className="text-[32px] mb-5 leading-none">📄</div>
// After: remove this line entirely, make the step number more visually prominent
// Change step-num from text-text-muted to text-green and increase its visual weight
```

For Features, replace emojis with small colored squares/icons:
```tsx
// Before:
<div className="text-2xl mb-4 leading-none">🔌</div>
// After:
<div className="w-8 h-8 rounded-[3px] bg-green/10 border border-green/20 flex items-center justify-center text-green text-xs font-bold mb-4">✓</div>
```

Add hover lift to both step and feature cards:
- Steps: Add `hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300` to step containers
- Features: Same hover lift effect

- [ ] **Step 1: Update HowItWorks.tsx — remove emojis, strengthen step numbers, add hover lift**

- [ ] **Step 2: Update Features.tsx — replace emojis with styled elements, add hover lift**

- [ ] **Step 3: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add frontend/components/HowItWorks.tsx frontend/components/Features.tsx
git commit -m "polish: remove emojis, add hover lifts to HowItWorks and Features"
```

---

### Task 4: Fix ToneSelector, Testimonials, Pricing proportions + add polish

**Files:**
- Modify: `frontend/components/ToneSelector.tsx`
- Modify: `frontend/components/Testimonials.tsx`
- Modify: `frontend/components/Pricing.tsx`

Original values to verify:
- Tone section: `padding: 100px 48px` → `py-[100px] px-12` ✅
- Tone inner gap: `80px` → `gap-20` (80px ✅)
- Testimonials: `padding: 32px` → `py-8 px-8` (32px ✅)
- Pricing: `padding: 48px 36px` → `py-12 px-9` (48px/36px ✅)

Polish changes:
- Testimonial cards: Add subtle `hover:-translate-y-0.5 transition-all duration-300` lift
- Pricing featured card: Change `outline outline-1 outline-green` to more prominent `ring-2 ring-green` for better visibility
- Pricing cards: Add `hover:-translate-y-0.5 transition-all duration-300` lift
- Tone cards: Already have `transition-all` ✅

- [ ] **Step 1: Update ToneSelector — verify proportions, no changes needed if correct**

- [ ] **Step 2: Update Testimonials — add hover lift effect**

- [ ] **Step 3: Update Pricing — improve featured card emphasis, add hover lifts**

- [ ] **Step 4: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 5: Commit**

```bash
git add frontend/components/ToneSelector.tsx frontend/components/Testimonials.tsx frontend/components/Pricing.tsx
git commit -m "polish: add hover lifts, improve pricing emphasis"
```

---

### Task 5: Fix CTA proportions + add polish

**Files:**
- Modify: `frontend/components/CTA.tsx`

Original values to verify:
- CTA: `padding: 140px 48px` → `pt-[140px] pb-[140px] px-12` ✅
- CTA email form gap: `12px` → `gap-3` (12px ✅)
- CTA input padding: `14px 18px` → approximately `py-3.5 px-[18px]` ✅

Polish changes:
- CTA section: Add subtle entrance animation consideration (already has radial gradient ✅)
- Email form: Add `focus:ring-1 focus:ring-green/30` to input for better focus state
- Success card: Add subtle `border-green/40` emphasis

- [ ] **Step 1: Update CTA — verify proportions, add focus ring to input**

- [ ] **Step 2: Run build**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/components/CTA.tsx
git commit -m "polish: improve CTA input focus state"
```

---

### Task 6: Final visual consistency pass

**Files:**
- Potentially all landing page components

This task is a final sweep to ensure:
1. All section headers (`section-label`) use identical Tailwind classes
2. All section titles use identical Tailwind classes
3. All buttons (`btn-primary`, `btn-ghost`) have consistent classes across all components
4. Mobile responsive breakpoints are consistent
5. No visual regressions from the Tailwind migration

- [ ] **Step 1: Grep for variations of section-label patterns across components**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && grep -n "font-mono text-\[10px\] tracking-\[0.25em\]" components/*.tsx`

Verify all section labels use the same class pattern. Fix any inconsistencies.

- [ ] **Step 2: Grep for variations of section-title patterns**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && grep -n "text-\[clamp(32px" components/*.tsx`

Verify all section titles use the same class pattern. Fix any inconsistencies.

- [ ] **Step 3: Grep for btn-primary patterns across components**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && grep -rn "bg-green text-black font-mono" components/`

Verify all primary button instances use the same classes. Fix any inconsistencies.

- [ ] **Step 4: Run build and lint**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run build && npm run lint`

- [ ] **Step 5: Run tests**

Run: `cd /home/nyasha-hama/projects/invoice-generator/frontend && npm run test`

- [ ] **Step 6: Commit if any changes were made**

```bash
git add -A
git commit -m "polish: fix visual consistency across components"
```

If no changes were needed, skip this commit.