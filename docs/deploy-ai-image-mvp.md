# AI Image MVP Deployment Guide

This guide covers the first production deployment of the AI image generator MVP that now lives at `/`, with the legacy hub moved to `/hub`.

## What ships

- Public marketing homepage at `/`
- Email magic-link login at `/login`
- Auth callback at `/auth/callback`
- Protected image studio at `/studio`
- Protected history page at `/history`
- Upgrade placeholder page at `/pricing`
- Supabase-backed credits, history, and auth
- Supabase Edge Function `generate-image` for prompt assembly and GPT-Image generation

## Required services

- One Supabase project
- One OpenAI API key with access to `gpt-image-1`
- One frontend host such as Vercel

## Environment variables

### Frontend

Set these in your frontend host:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=http://localhost:8000
```

Notes:

- `VITE_API_BASE_URL` is already used elsewhere in this repo. The AI image MVP itself talks to Supabase directly, so this value can stay as-is unless the rest of the site needs a different API origin.
- The frontend also reads the same values locally from [`frontend/.env.example`](/Users/chen/projects/agent-skills-hub/frontend/.env.example).

### Supabase Edge Function secrets

Set these in Supabase for the `generate-image` function:

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

## Supabase setup

### 1. Run the migration

Apply the AI image MVP schema in [`supabase/migrations/009_ai_image_mvp.sql`](/Users/chen/projects/agent-skills-hub/supabase/migrations/009_ai_image_mvp.sql).

This migration creates:

- `profiles`
- `generations`
- `credit_transactions`
- signup bootstrap trigger for new users
- RLS policies for read-own access
- `consume_credit_and_create_generation(...)` RPC for atomic credit reservation

### 2. Configure Auth

In Supabase Auth:

- enable email login with magic links
- disable any providers you do not want in V1
- add your local and production redirect URLs

Recommended redirect URLs:

- local: `http://localhost:5173/auth/callback`
- production: `https://YOUR_DOMAIN/auth/callback`

Recommended site URLs:

- local: `http://localhost:5173`
- production: `https://YOUR_DOMAIN`

### 3. Deploy the Edge Function

Deploy the function from [`supabase/functions/generate-image/index.ts`](/Users/chen/projects/agent-skills-hub/supabase/functions/generate-image/index.ts).

Also included:

- prompt builder: [`supabase/functions/generate-image/prompt-builder.ts`](/Users/chen/projects/agent-skills-hub/supabase/functions/generate-image/prompt-builder.ts)
- shared CORS helper: [`supabase/functions/_shared/cors.ts`](/Users/chen/projects/agent-skills-hub/supabase/functions/_shared/cors.ts)

After deploy, verify that:

- unauthenticated requests return an auth error
- authenticated users with credits can generate
- users with zero credits receive `INSUFFICIENT_CREDITS`

## Frontend deployment

### Recommended host

Vercel is the simplest default for this app.

### Build settings

- root directory: `frontend`
- install command: `npm install`
- build command: `npx tsc -b && npx vite build`
- output directory: `dist`

Why not use the existing `npm run build` script directly:

- the repo build script continues into site-generation tasks unrelated to the image MVP
- those tasks fetch external Supabase content and can fail in offline or locked-down environments
- `npx tsc -b && npx vite build` verifies the actual frontend app bundle cleanly

### Node version

Use Node `20.19+` or `22.12+`.

Local verification in this workspace succeeded with `npx vite build`, but Vite emitted a warning because the current machine is on Node `20.17.0`. Production should use a supported version to avoid edge-case build issues.

## Local verification checklist

From `frontend/`:

```bash
npm install
npm test
npx tsc -b
npx vite build
```

Expected:

- tests pass
- TypeScript build passes
- Vite production build passes

## Production smoke test

Run this once after deploy with a brand-new email account:

1. Open `/`
2. Click into the studio
3. Confirm you are redirected to `/login`
4. Send a magic link
5. Open the link and land back in the app
6. Confirm the new user has `5` credits
7. Generate one image and confirm credits drop to `4`
8. Confirm the image appears in `/history`
9. Generate until credits reach `0`
10. Confirm the upgrade prompt appears instead of a generic failure
11. Confirm `/hub` still loads the legacy experience

## Known V1 limits

- no real payment flow
- no admin panel
- no reference-image upload
- no image editor
- no regenerate-from-history action
- no multi-model switcher

## Files to know during rollout

- App routing: [`frontend/src/App.tsx`](/Users/chen/projects/agent-skills-hub/frontend/src/App.tsx)
- Supabase client bootstrap: [`frontend/src/lib/supabase.ts`](/Users/chen/projects/agent-skills-hub/frontend/src/lib/supabase.ts)
- Studio page: [`frontend/src/pages/StudioPage.tsx`](/Users/chen/projects/agent-skills-hub/frontend/src/pages/StudioPage.tsx)
- History page: [`frontend/src/pages/HistoryPage.tsx`](/Users/chen/projects/agent-skills-hub/frontend/src/pages/HistoryPage.tsx)
- Login page: [`frontend/src/pages/LoginPage.tsx`](/Users/chen/projects/agent-skills-hub/frontend/src/pages/LoginPage.tsx)
- Edge function: [`supabase/functions/generate-image/index.ts`](/Users/chen/projects/agent-skills-hub/supabase/functions/generate-image/index.ts)
- SQL migration: [`supabase/migrations/009_ai_image_mvp.sql`](/Users/chen/projects/agent-skills-hub/supabase/migrations/009_ai_image_mvp.sql)
