# Phase 4: Authentication

> Pipeline stage: build
> Prerequisites: Phase 2 (Scaffold) complete
> Skills: /saas-setup
> Estimated items: 4 checklist items

## Overview

Set up Google OAuth via Supabase Auth with middleware-protected routes and Row Level Security. Every authenticated app must include a UserMenu component (avatar dropdown, sign out, delete account).

## Checklist Items

### [auth] Google OAuth configured
**Approach:** Use `/saas-setup` or manually configure:
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://{{supabase_project_id}}.supabase.co/auth/v1/callback`
4. In Supabase dashboard > Authentication > Providers > Google, enable and paste Client ID + Secret
5. Create login page at `src/app/login/page.tsx` with Google sign-in button
6. Create auth callback route at `src/app/auth/callback/route.ts`

The callback route pattern:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(/* ... */)
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```
**Skill:** `/saas-setup`
**Done when:** Clicking "Sign in with Google" on the login page completes the OAuth flow and redirects to the dashboard. User session persists across page refreshes.
**References:** ["https://supabase.com/docs/guides/auth/social-login/auth-google"]
**Depends on:** Supabase tables created, Environment variables configured

### [auth] Auth middleware protecting routes
**Approach:** Create `src/middleware.ts` that protects `/dashboard/*` routes:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }
```
**Skill:** null
**Done when:** Navigating to `/dashboard` without being logged in redirects to `/login`. After login, `/dashboard` is accessible.
**References:** ["https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs"]
**Depends on:** Google OAuth configured

### [auth] RLS policies in place
**Approach:** For each table, create RLS policies that restrict access to the authenticated user's data:
```sql
CREATE POLICY "Users can view own data" ON <table>
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON <table>
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON <table>
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own data" ON <table>
  FOR DELETE USING (auth.uid() = user_id);
```
For tables without a `user_id` column (e.g., shared lookup tables), use permissive read policies.
**Skill:** null
**Done when:** Every table has RLS enabled and appropriate policies. Verified by: signing in as user A, inserting data, signing in as user B, confirming user B cannot see user A's data.
**References:** ["https://supabase.com/docs/guides/database/postgres/row-level-security"]
**Depends on:** Supabase tables created

### [auth] UserMenu component
**Approach:** Create a UserMenu component with: user avatar (from Google), dropdown with "Sign out" and "Delete account" options. "Delete account" should call a server action that deletes the user's data and then calls `supabase.auth.admin.deleteUser(userId)`. Place the UserMenu in the dashboard layout header.
**Skill:** null
**Done when:** UserMenu shows in dashboard header with avatar. Sign out works. Delete account removes user data and redirects to landing page.
**References:** []
**Depends on:** Google OAuth configured

## Decision Points

- Does this app even need auth? (Tools and utilities may not)
- Email/password in addition to Google? (Usually not needed)
- Admin role needed? (For most apps, single-user is fine)

## Common Pitfalls

- **Forgetting the auth callback route.** OAuth won't work without it.
- **Not using `getUser()` in middleware.** `getSession()` is client-side and can be spoofed. Always use `getUser()` for server-side auth checks.
- **Missing RLS policies.** If RLS is enabled but no policies exist, all queries return empty results.
