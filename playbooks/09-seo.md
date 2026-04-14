# Phase 9: SEO

> Pipeline stage: deploy
> Prerequisites: Phase 3 (Design) complete, Phase 6 (Core Features) complete
> Skills: none
> Estimated items: 3 checklist items

## Overview

Set up SEO fundamentals: meta tags, sitemap, robots.txt, and Open Graph images. These need to be in place before the landing page goes live and before any distribution begins.

## Checklist Items

### [seo] Meta tags and Open Graph
**Approach:** Update `src/app/layout.tsx` with comprehensive metadata:
```typescript
export const metadata: Metadata = {
  title: {
    default: '<App Name> - <tagline>',
    template: '%s | <App Name>',
  },
  description: '<One sentence describing the app>',
  metadataBase: new URL('https://<domain>'),
  openGraph: {
    title: '<App Name>',
    description: '<description>',
    url: 'https://<domain>',
    siteName: '<App Name>',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '<App Name>',
    description: '<description>',
    images: ['/og-image.png'],
  },
};
```
Create an OG image at `public/og-image.png` (1200x630). Can use the Satori template engine from Content Flywheel or create manually.

Add page-specific metadata to individual pages using `export const metadata` or `generateMetadata()`.
**Skill:** null
**Done when:** Sharing the app URL on LinkedIn/Twitter/Slack shows the correct title, description, and image. Verify with opengraph.xyz or LinkedIn Post Inspector.
**References:** ["https://nextjs.org/docs/app/building-your-application/optimizing/metadata"]
**Depends on:** Frontend design complete

### [seo] Sitemap and robots.txt
**Approach:** Create `src/app/sitemap.ts`:
```typescript
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://<domain>', lastModified: new Date(), priority: 1 },
    { url: 'https://<domain>/login', lastModified: new Date(), priority: 0.5 },
    { url: 'https://<domain>/privacy', lastModified: new Date(), priority: 0.3 },
    { url: 'https://<domain>/terms', lastModified: new Date(), priority: 0.3 },
    // Add public pages
  ]
}
```
Create `src/app/robots.ts`:
```typescript
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/'] },
    sitemap: 'https://<domain>/sitemap.xml',
  }
}
```
**Skill:** null
**Done when:** `/sitemap.xml` returns valid XML with all public pages. `/robots.txt` returns valid directives. Dashboard and API routes are disallowed.
**References:** ["https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap"]
**Depends on:** Next.js app scaffolded

### [seo] Domain configured
**Approach:** Purchase the domain (if not already done in idea phase). Configure DNS:
1. Add domain in Vercel project settings
2. Set DNS records as instructed by Vercel (usually CNAME to `cname.vercel-dns.com`)
3. Add `www` redirect
4. Wait for SSL certificate provisioning (automatic)
5. Update `metadataBase` in layout.tsx to use the production domain

Update LaunchPad project links with the live URL.
**Skill:** null
**Done when:** App is accessible at the custom domain with HTTPS. `www` redirects to the apex domain (or vice versa).
**References:** ["https://vercel.com/docs/projects/domains"]
**Depends on:** Vercel project connected

## Decision Points

- Custom domain now or stay on `.vercel.app`? (Custom domain for any public-facing app)
- Subdomain of existing domain? (e.g., `tool.procure.blog`)

## Common Pitfalls

- **Forgetting `metadataBase`.** Without it, OG image URLs will be relative and broken.
- **Not testing OG images.** Use opengraph.xyz to verify before sharing.
- **Sitemap missing dynamic pages.** If the app has public dynamic routes, generate them in `sitemap.ts`.
