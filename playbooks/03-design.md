# Phase 3: Design

> Pipeline stage: build
> Prerequisites: Phase 2 (Scaffold) complete
> Skills: /frontend-vibe, /logo-generator, /ui-ux-pro-max
> Estimated items: 3 checklist items

## Overview

Build the visual identity and frontend. Use the `/frontend-vibe` skill for component selection and heavy animations. Use `/logo-generator` for the brand mark. Exit this phase with a polished, responsive UI that looks production-ready even before features are wired up.

## Checklist Items

### [design] Frontend design complete
**Approach:** Run `/frontend-vibe` to orchestrate the full design pipeline:
1. Design system selection (colors, typography, spacing)
2. Component sourcing from 21st.dev (fetch actual source code, never approximate)
3. Page layouts with heavy animations (background effects, text reveals, scroll animations, interactive effects)
4. Build all pages with real component code

Install shadcn/ui base components:
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input label select textarea toast
```
**Skill:** `/frontend-vibe`
**Done when:** All app pages are built with real 21st.dev components. Animations are present throughout. Design feels polished and professional. `npm run dev` shows the complete UI.
**References:** ["https://21st.dev", "https://ui.shadcn.com"]
**Depends on:** Next.js app scaffolded

### [design] Mobile responsive
**Approach:** Test every page at mobile (375px), tablet (768px), and desktop (1280px) breakpoints. Fix layout issues with Tailwind responsive prefixes (`sm:`, `md:`, `lg:`). Pay special attention to: navigation (hamburger menu on mobile), forms (full-width inputs), tables (horizontal scroll or card layout), and modals (full-screen on mobile).
**Skill:** null
**Done when:** All pages look good and are functional at 375px, 768px, and 1280px. No horizontal overflow, no cut-off text, no overlapping elements.
**References:** []
**Depends on:** Frontend design complete

### [design] Logo and branding
**Approach:** Run `/logo-generator` to create the brand logo. This produces 4 variants: light, dark, light-transparent, dark-transparent. All follow the minimalist style: black icon + small blue `#0000FE` accent on white. Upload the logo to Supabase Storage `content-images/brand-assets/<brand_id>/logo.png` for use across the ecosystem.
**Skill:** `/logo-generator`
**Done when:** 4 logo variants exist. Logo is displayed in the app header/nav. Logo is uploaded to Supabase Storage.
**References:** []
**Depends on:** App name and slug decided

## Decision Points

- What's the color palette? (Use `/ui-ux-pro-max` for suggestions based on the app's domain)
- Dark mode or light mode? (Most apps are light-first)
- What font pairing? (Geist is the default for this ecosystem)

## Common Pitfalls

- **Approximating 21st.dev components.** Always fetch the actual source code with `curl -s 'https://21st.dev/r/<user>/<slug>'`. Never recreate from memory.
- **Skipping mobile testing.** Test early. Fixing responsive issues later is painful.
- **Being conservative with animations.** Go heavy. Background effects, text reveals, scroll animations, interactive effects. Don't hold back.
