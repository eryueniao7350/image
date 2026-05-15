# AI Image Generator MVP Design

## Summary

Build a first-release AI image generation website for content creators. The product's differentiation is not freeform prompt writing. Instead, it guides users through structured choices such as image type, aspect ratio, style, scene, and whitespace, combines those with a user-provided subject and extra requirements, assembles a stronger GPT-Image prompt, and generates an image through OpenAI.

This spec covers the smallest launchable version:

- Marketing homepage
- Email magic-link login
- Structured image generation studio
- Generation history
- Credit system with signup bonus and per-image deduction
- Upgrade entry without real payment

This release explicitly excludes:

- Real payment
- Complex email workflows
- Admin dashboard
- Complex SEO work
- Image editing
- Reference image upload
- Multi-model switching

## Product Goal

Help content creators who do not know how to write prompts generate usable cover images and supporting visuals through a guided workflow that feels simpler and more professional than typing raw prompts.

## Target User

Primary user: content creators creating assets such as Xiaohongshu covers, article headers, social media visuals, and simple promotional graphics.

## Product Principles

1. Structured input is the core product value.
2. The homepage sells clarity and speed, not technical complexity.
3. The studio is the product center of gravity.
4. Credits must be simple, visible, and enforced server-side.
5. The first version should optimize for launch speed and reliability over flexibility.

## Scope

### In Scope

1. Homepage with product positioning and examples
2. Email magic-link authentication through Supabase Auth
3. Signup bonus of 5 credits for new users
4. One credit deducted per image generation request
5. Structured generation form
6. Server-side prompt assembly
7. Image generation through GPT-Image
8. Generation history view
9. Upgrade page or modal placeholder

### Out of Scope

1. Payment collection
2. Password auth
3. Team accounts
4. Asset editing after generation
5. Reference image uploads
6. Prompt freeform-first workflow
7. Multiple model choices
8. Refund automation beyond basic system behavior

## Information Architecture

- `/` homepage
- `/login` login page
- `/auth/callback` auth callback page
- `/studio` generation studio
- `/history` generation history
- `/pricing` upgrade placeholder page

## User Flows

### New User Flow

1. User lands on homepage.
2. User clicks the primary CTA to start generating.
3. Unauthenticated user is sent to login.
4. User enters email and receives a magic link.
5. After login, the system creates a profile if needed and grants 5 credits.
6. User lands in the studio and can generate an image.

### Generation Flow

1. User opens the studio.
2. User selects structured options and enters subject plus extra requirements.
3. User clicks generate.
4. Server verifies auth and available credits.
5. If credits are insufficient, the UI shows the upgrade prompt.
6. If credits are sufficient, one credit is deducted and a generation record is created.
7. Server assembles the final prompt and calls GPT-Image.
8. On success, the generated image and final prompt are stored in history.
9. The result is shown in the studio and becomes available in the history page.

### History Flow

1. User opens history.
2. User sees past generated images, timestamps, and generation metadata.
3. User opens a record to review the final prompt and configuration.
4. V1 history is read-only aside from download and prompt review; regenerate is out of scope for this release.

## Page Design

### Homepage

Purpose: explain the product's value and push users toward the studio.

Sections:

1. Header with logo, login, and primary CTA
2. Hero headline focused on "no prompt-writing required"
3. Three-step explanation of how the workflow works
4. Example gallery for creator-oriented outputs
5. Credit explanation block
6. Upgrade teaser block

The homepage should behave like a focused conversion page, not a content portal.

### Login Page

Purpose: minimal-friction authentication.

Components:

1. Email input
2. Send magic link button
3. Inline status and error messaging

This page should avoid password entry, registration mode switching, and extra marketing clutter.

### Studio Page

Purpose: the core generation experience.

Layout:

- Left side: structured generation form
- Right side: result panel

Form fields:

1. Image type
2. Aspect ratio
3. Style
4. Scene
5. Whitespace requirement
6. Subject description
7. Extra requirements

Primary action:

- `Generate image (costs 1 credit)`

Result states:

1. Empty state with guidance
2. Loading state while prompt assembly and generation are in progress
3. Success state showing image, download action, and expandable prompt preview
4. Error state
5. Insufficient credit state via upgrade modal or upgrade CTA

### History Page

Purpose: lightweight review of prior outputs.

Each history item should show:

1. Thumbnail
2. Creation time
3. Image type
4. Style
5. Subject summary
6. Credit cost

The detail view should show:

1. Larger image
2. Full structured inputs
3. Final assembled prompt

History should remain lightweight in V1. No bulk management, folders, or editing tools.

### Pricing Page

Purpose: reserve the upgrade surface for later monetization.

This page should:

1. Explain free plan behavior
2. Tease higher tiers
3. Provide a placeholder CTA such as "coming soon" or "contact to upgrade"

No real payment flow is required in this release.

## Structured Input Model

The structured form is the main product surface. V1 should support these fields:

### Image Type

Examples:

- Xiaohongshu cover
- WeChat article header
- Social media visual
- Poster
- General illustration

### Aspect Ratio

Supported values:

- `1:1`
- `3:4`
- `4:3`
- `9:16`
- `16:9`

### Style

Examples:

- Minimal
- Premium
- Fresh
- Magazine
- Cinematic
- Commercial poster
- Illustration

### Scene

Examples:

- Indoor
- Outdoor
- Tabletop
- Natural environment
- Urban street
- Plain backdrop

### Whitespace

Examples:

- No visible whitespace
- Top whitespace
- Bottom whitespace
- Left whitespace
- Right whitespace
- Moderate whitespace around the subject

### Subject Description

The user's primary description of the subject they want in the image.

### Extra Requirements

A secondary field for details such as mood, text area clarity, color constraints, or intended use.

## Prompt Assembly Design

V1 should use template-based server-side prompt assembly instead of a second LLM pass for prompt rewriting.

Reasons:

1. More stable output
2. Lower cost
3. Easier debugging
4. Better control over the product behavior

### Prompt Assembly Structure

The generation function should build a final prompt from these sections:

1. Intended image use
2. Subject description
3. Style requirements
4. Scene requirements
5. Composition and whitespace requirements
6. Quality and clarity constraints
7. Extra user requirements

### System-Level Prompt Constraints

The prompt builder should consistently reinforce:

1. High-quality visual output
2. Clear subject focus
3. Complete composition
4. Suitability for content creators
5. Avoidance of clutter
6. Strong visual hierarchy

### Field Mapping Examples

- Image type can map to a usage phrase such as a creator cover image for a Xiaohongshu-style post.
- Premium style can map to a refined, modern aesthetic.
- Top whitespace can map to preserved negative space for title placement.

The user should be able to review the final assembled prompt in the UI, but this can remain collapsed by default.

## Credits Design

### Rules

1. New users receive 5 credits once.
2. Each image generation request costs 1 credit.
3. If the user has fewer than 1 credit, generation is blocked.
4. Credit verification and deduction must happen on the server.
5. History records are created only for real generation attempts.

### Failure Policy

V1 should keep the rule simple: each generation attempt costs 1 credit once the server accepts the request. Do not build a complex refund flow in the first release.

Product copy must be explicit that each generation consumes one credit, not "only successful generations consume one credit."

### UX Requirements

1. Current credit balance should be visible in the authenticated UI.
2. The generate button should communicate the cost.
3. Insufficient credits should trigger an upgrade prompt instead of a generic error.

## Data Model

V1 should use four conceptual entities, with only the first three required as actual database tables.

### `profiles`

Purpose: store per-user application state.

Fields:

- `id`
- `email`
- `credits`
- `created_at`
- `updated_at`

Behavior:

- Created on first successful sign-in
- Initialized with 5 credits

### `generations`

Purpose: store image generation requests and results.

Fields:

- `id`
- `user_id`
- `image_type`
- `aspect_ratio`
- `style`
- `scene`
- `whitespace`
- `subject_text`
- `extra_requirements`
- `final_prompt`
- `image_url`
- `status`
- `credit_cost`
- `created_at`

Status values:

- `pending`
- `succeeded`
- `failed`

### `credit_transactions`

Purpose: keep a ledger of credit changes.

Fields:

- `id`
- `user_id`
- `type`
- `amount`
- `balance_after`
- `reason`
- `generation_id`
- `created_at`

Type values:

- `grant`
- `consume`

Reason values:

- `signup_bonus`
- `image_generation`

### Pricing data

Pricing content should stay hardcoded in the frontend for V1. No `plans` table is required in this release.

## Backend Architecture

### Platform Choices

- Frontend: React 19, TypeScript, Vite, React Router
- Auth: Supabase Auth with magic links
- Database: Supabase Postgres
- Server logic: Supabase Edge Functions
- Image generation: OpenAI GPT-Image API

### Core Service Boundary

V1 should keep server-side custom logic small.

Recommended split:

1. Use one Edge Function, `generate-image`, for the write-sensitive generation flow.
2. Let the frontend read profile, history, and credit data directly through Supabase with RLS protection.

This keeps V1 light while protecting the sensitive flow.

### Generation Function Responsibilities

The `generate-image` function should:

1. Verify the caller identity
2. Check current credits
3. Reject requests with insufficient credits
4. Deduct one credit atomically
5. Insert a credit ledger entry
6. Create a `pending` generation record
7. Assemble the final prompt
8. Call GPT-Image
9. Update the generation record to `succeeded` or `failed`
10. Return the result needed by the frontend

### Image Persistence

V1 can begin with the simplest workable image storage path:

1. If GPT-Image returns a stable image URL that can be displayed safely, store that URL.
2. If direct URL persistence is not reliable enough, upload the result to Supabase Storage and persist the resulting asset URL.

Implementation can choose the simpler path first, but the generation record schema should allow the storage strategy to evolve.

## Security and Permissions

### RLS Expectations

Users should only be able to read their own:

1. `profiles`
2. `generations`
3. `credit_transactions`

Users must not be allowed to update their own credit balances directly from the client.

### Sensitive Operations

All of these must stay server-side:

1. Credit deduction
2. Credit ledger writes
3. Final prompt assembly rules
4. OpenAI API invocation

## Frontend Architecture

### Routes

Implement these primary routes:

1. Homepage route
2. Login route
3. Auth callback route
4. Studio route
5. History route
6. Pricing route

### Key UI Components

Suggested component set:

1. Marketing hero and proof sections
2. Auth gate
3. Credit badge
4. Generation form
5. Prompt preview
6. Generation result panel
7. Upgrade modal
8. History list and history detail view

### State Management

Keep V1 state management lightweight:

1. Use existing app patterns and React local state where possible.
2. Use context only for shared auth and profile state such as current user and credit count.
3. Avoid introducing a heavy global store unless the existing codebase already depends on one.

## Error Handling

The product should distinguish between:

1. Not authenticated
2. Insufficient credits
3. Prompt assembly or request validation failure
4. Upstream image generation failure
5. Network or transient errors

User-facing errors should be actionable and non-technical. Insufficient credits must route users toward the upgrade surface.

## Testing Strategy

V1 should focus on high-value tests around the risky logic.

### Unit Tests

Test:

1. Prompt section mapping
2. Prompt assembly output shape
3. Credit eligibility logic

### Integration Tests

Test:

1. New user receives 5 credits
2. A valid generation request deducts 1 credit
3. Insufficient credits block generation
4. Successful generations create history records
5. Failed generations are recorded with the expected status

### Frontend Flow Tests

Test:

1. Unauthenticated studio access redirects to login
2. Login returns users to the intended destination
3. Generate button is disabled during submission
4. Insufficient credits open the upgrade prompt

## Deployment Plan

### Hosting

- Frontend: Vercel preferred
- Backend services: Supabase

### Required Environment Variables

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-side:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### Launch Sequence

1. Build and verify local auth flow
2. Build and verify signup credit initialization
3. Build and verify generation flow
4. Build and verify history page
5. Verify insufficient-credit UX
6. Deploy frontend
7. Configure Supabase production resources and secrets
8. Run end-to-end production smoke testing with a fresh account

## Success Criteria

V1 is successful if a new content creator can:

1. Sign in through magic link
2. Receive 5 initial credits
3. Generate at least one image through structured inputs
4. See credits decrease correctly
5. Review the generated output in history
6. Reach an upgrade prompt when credits run out

## Future Extensions

Not part of V1, but the design should leave room for:

1. Real payment integration
2. More generation templates
3. Regeneration shortcuts
4. Better asset storage
5. Reference image upload
6. Multiple generation models
