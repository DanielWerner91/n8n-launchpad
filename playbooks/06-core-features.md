# Phase 6: Core Features

> Pipeline stage: build
> Prerequisites: Phase 2 (Scaffold) complete, relevant phases for dependencies (Auth if needed, etc.)
> Skills: varies per project
> Estimated items: varies per project (not templated)

## Overview

Build the actual app features defined in the MVP feature list. This phase is project-specific and cannot be fully templated. The checklist items here are created manually based on the MVP scope from Phase 0.

## General Approach

For each MVP feature:
1. Build the API route first (`src/app/api/<feature>/route.ts`)
2. Build the UI component that consumes it
3. Test the full roundtrip: UI action > API call > DB operation > response > UI update
4. Handle error states and loading states

### API Route Pattern
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("<table>").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  const body = await req.json();
  // validate body fields
  const { data, error } = await supabase.from("<table>").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

### n8n Webhook Integration
If features depend on n8n workflows:
1. Webhook URL goes in `.env.local` as `N8N_WEBHOOK_URL`
2. All n8n calls happen server-side (API routes or server actions)
3. Never expose webhook URLs to the client
```typescript
const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

### AI Feature Integration
If the app uses Claude API:
```bash
npm install @anthropic-ai/sdk
```
Add `ANTHROPIC_API_KEY` to env vars. Create AI helpers in `src/lib/ai/`.

## Decision Points

- Which features need auth? (All data-modifying features)
- Which features need payments gating?
- Which features need n8n workflow support?
- Does any feature need real-time updates? (Supabase Realtime)

## Common Pitfalls

- **Building features not in the MVP list.** Stay disciplined. Ship the MVP first.
- **Server-side vs client-side data fetching.** Use server components for initial data load, client-side fetch for mutations and real-time updates.
- **Not handling loading states.** Every async operation needs a loading indicator.
