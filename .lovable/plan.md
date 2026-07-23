# Make Everything Editable in Admin

Right now categories, products, orders and the subscription plan are already managed from the admin panel. But large parts of the storefront are still hardcoded in the source (hero, trust bar, legacy story, CTA strip, header announcement, footer). This plan makes all of that editable too, from a single "Site Content" area in the admin dashboard.

## What becomes editable

**Header**
- Top announcement strip (3 items: icon + text)
- Brand name & tagline
- Mobile/desktop nav (already dynamic via categories)

**Homepage**
- Hero: eyebrow, title, subtitle, description, primary CTA (label + link), secondary CTA (label + link), custom-jewellery card (title + body)
- Trust bar (5 items: icon + title + body)
- Legacy section: eyebrow, title, description, bullet list, image
- Categories section: eyebrow + title (categories already dynamic)
- Featured section: eyebrow + title
- CTA strip: title, body, button label + link
- Subscription section (already dynamic)

**Footer**
- Brand blurb
- "Shop" and "Help" link columns
- Newsletter heading + description
- Copyright line

**Products / Orders / Subscription** – already fully admin-managed.

## How it works

1. New `public.site_content` table: one row per section, `key TEXT PRIMARY KEY`, `data JSONB`. Public read (anon SELECT), admin-only write.
2. Migration seeds every section with the current hardcoded content so nothing changes visually on first load.
3. `src/lib/site-content.functions.ts` – server fns: `getAllSiteContent`, `updateSiteContent(key, data)` (admin-guarded).
4. `src/lib/site-content.queries.ts` – TanStack Query helper + typed defaults so components stay strict.
5. Refactor `index.tsx`, `site-header.tsx`, `site-footer.tsx` to read from the query (with the seeded defaults as fallback).
6. Admin dashboard gets a new "Site Content" tab with an accordion of forms — one per section — using the same shadcn form styling as the existing tabs. Icon fields are simple name pickers (from a small allowed list) so trust items and announcement items keep working without an icon picker UI.

## Out of scope

Rich text editor, media upload UI (legacy image stays a URL field for now), i18n. These can be added later without schema changes.

## Technical notes

- Table: `site_content(key text pk, data jsonb not null, updated_at timestamptz)` + `updated_at` trigger.
- Policies: `SELECT` to `anon, authenticated`; `INSERT/UPDATE/DELETE` gated by `has_role(auth.uid(), 'admin')`.
- Grants: `SELECT` to `anon, authenticated`; `ALL` to `service_role`; `INSERT, UPDATE, DELETE` to `authenticated` (RLS enforces admin).
- Query cache: single `siteContentQuery()` returning a typed record keyed by section; components pick their slice.
- Defaults live in `site-content.defaults.ts` and are used both to seed the DB and as fallback if a row is missing.
