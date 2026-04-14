# Phase 10: Content & Brand

> Pipeline stage: deploy
> Prerequisites: Phase 3 (Design) complete
> Skills: /carousel-generator, /infographic-generator, /newsletter-builder
> Estimated items: 3 checklist items

## Overview

Set up the content pipeline: create a brand in Content Flywheel, define brand voice, and prepare for content distribution. This phase connects the app to the content ecosystem for ongoing marketing.

## Checklist Items

### [content] Content Flywheel brand created
**Approach:** Create a brand in Content Flywheel (content-flywheel.com) for this app:
1. Log in to Content Flywheel
2. Create a new brand with the app name
3. Set the brand slug (matches the app slug)
4. Upload the logo (from Phase 3)
5. Configure the design system colors (primary, secondary, background, text)

Alternatively, create via Supabase directly:
```sql
INSERT INTO brands (name, slug, user_id, logo_url, design_system)
VALUES ('<App Name>', '<slug>', '<user-id>', '<logo-url>', '{
  "colors": {"primary": "#...", "secondary": "#...", "background": "#...", "text": "#..."},
  "typography": {"heading": "Geist", "body": "Geist"}
}'::jsonb);
```
**Skill:** null
**Done when:** Brand exists in Content Flywheel with logo and design system. Accessible via slug.
**References:** ["https://content-flywheel.com"]
**Depends on:** Logo and branding

### [content] Brand voice defined
**Approach:** Define the brand voice in Content Flywheel. This is used by all content generation tools (carousels, infographics, newsletters, LinkedIn posts). Set via Content Flywheel UI or directly in Supabase:

Key fields in `brand_voice` JSONB:
- `personality_archetype` (e.g., "Expert Guide", "Innovative Disruptor")
- `tone.formality` (0-100), `tone.seriousness` (0-100), `tone.authority` (0-100)
- `writing_rules.dos` (array of rules to follow)
- `writing_rules.donts` (array of rules to avoid, always includes: "no em dashes", "no ellipsis", "no AI-sounding prose")
- `vocabulary.preferred_terms`, `vocabulary.banned_words`, `vocabulary.jargon_level`
- `content_pillars` (3-5 topics the brand writes about)

The brand voice is the single source of truth for all content. Always fetch it before generating any content:
```sql
SELECT name, brand_voice, content_pillars FROM brands WHERE slug = '<slug>';
```
**Skill:** null
**Done when:** `brand_voice` JSONB is populated with all fields. Content pillars are defined. Test by generating a sample LinkedIn post using the voice.
**References:** []
**Depends on:** Content Flywheel brand created

### [content] Content Flywheel integrated
**Approach:** Connect the app to Content Flywheel for automated content:
1. Create an n8n workflow that generates content for this brand on a schedule
2. Configure Content Flywheel to use the brand for LinkedIn post generation
3. Set up the Make.com webhook for LinkedIn publishing (if using the LinkedIn publishing pipeline)
4. Verify the content pipeline: schedule triggers > Content Flywheel generates > review queue > publish

This connects the app to the existing content infrastructure for ongoing marketing.
**Skill:** null
**Done when:** Content Flywheel can generate content for this brand. At least one test piece of content has been generated and reviewed.
**References:** []
**Depends on:** Brand voice defined

## Decision Points

- Does this app need its own brand, or is it part of an existing brand (e.g., procure.blog ecosystem)?
- How many content pillars? (3-5 is ideal)
- What LinkedIn publishing org? (Daniel Werner personal, or a company page?)

## Common Pitfalls

- **Skipping brand voice definition.** Without it, generated content will be generic.
- **Not including "no em dashes" and "no ellipsis" in writing rules.** These are non-negotiable.
- **Forgetting to upload the logo.** Brand visual identity depends on it.
