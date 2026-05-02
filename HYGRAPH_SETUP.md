# Hygraph Setup

This document describes how to wire up [Hygraph](https://hygraph.com) as the CMS for the CultRepo site. You'll create the schema in the Hygraph dashboard, then come back here to plug credentials into the app.

## 1. Create a project

1. Go to https://hygraph.com → **New project** → start from a blank schema (don't pick a template).
2. Region: `EU-Central` or `US-East` — whichever is closer to your audience. Doesn't matter much.
3. Plan: **Hobby (free)** is fine to start. 100K API requests/mo, 1GB assets, 2 locales.

## 2. Create the content models

In the Hygraph dashboard, go to **Schema** and create the models below. Field types use Hygraph's built-in primitives.

> Notation: `Field name` (`apiId`) — Type (notes)

### `Film` (model)

- `Title` (`title`) — Single line text, required, used as display title
- `Slug` (`slug`) — Slug, required, unique, generated from `title`
- `Status` (`status`) — Enumeration, required. Values: `Released`, `PostProduction`, `InProduction`, `Filming`, `PreProduction`, `ComingSoon`, `Fundraising`
- `Description` (`description`) — Markdown / multi-line text, required (short blurb shown on the home grid + film page)
- `Synopsis` (`synopsis`) — Rich text (Markdown), required (long body copy)
- `Year` (`year`) — Single line text (e.g. "2025")
- `Duration` (`duration`) — Single line text (e.g. "45 min")
- `Director` (`director`) — Single line text
- `YouTube ID` (`youtubeId`) — Single line text, optional (just the video ID, not the full URL)
- `Poster` (`poster`) — Asset, optional
- `Video Clip` (`videoClip`) — Asset, optional (the short MP4 used on the home carousel)
- `Stills` (`stills`) — Asset, **list** (multiple files)
- `Cast` (`cast`) — Component, list of `FilmCastMember`
- `Crew` (`crew`) — Component, list of `FilmCrewMember`
- `Technologies` (`technologies`) — Single line text, **list** (e.g. `["Vite","Vue.js"]`)
- `Sponsors` (`sponsors`) — Reference, list of `Sponsor`
- `Extras` (`extras`) — Component, list of `FilmExtra`
- `Timeline` (`timeline`) — Component, list of `FilmTimelineStep`
- `Fundraising Goal` (`fundraisingGoal`) — Integer, optional
- `Fundraising Raised` (`fundraisingRaised`) — Integer, optional
- `Order` (`order`) — Integer, used to order films on grid pages

> When `fundraisingGoal` is null, the film hides its fundraising widget.

### `FilmCastMember` (component)
- `Name` (`name`) — Single line text, required
- `Role` (`role`) — Single line text, required

### `FilmCrewMember` (component)
- `Name` (`name`) — Single line text, required
- `Role` (`role`) — Single line text, required

### `FilmExtra` (component)
- `Title` (`title`) — Single line text, required
- `YouTube ID` (`youtubeId`) — Single line text, required

### `FilmTimelineStep` (component)
- `Label` (`label`) — Single line text, required
- `Done` (`done`) — Boolean, default `false`

### `TeamMember` (model)
- `Name` (`name`) — Single line text, required
- `Role` (`role`) — Single line text, required (e.g. "CEO", "Filmmaker")
- `Photo` (`photo`) — Asset, required
- `Bio` (`bio`) — Multi-line text / Markdown, required
- `Email` (`email`) — Single line text, required
- `Order` (`order`) — Integer, used to sort the grid

### `Sponsor` (model)
- `Name` (`name`) — Single line text, required
- `Slug` (`slug`) — Slug, required, unique
- `Logo` (`logo`) — Asset, required

### `AboutPage` (model — singleton)
Mark this model as **single-instance** in Hygraph (settings on the model) so editors can only have one record.

- `Hero Title` (`heroTitle`) — Single line text
- `Hero Subtitle` (`heroSubtitle`) — Single line text
- `Story` (`story`) — Multi-line text / Markdown
- `Backstage Image` (`backstageImage`) — Asset
- `Stats` (`stats`) — Component, list of `AboutStat`
- `Trusted By Sponsors` (`trustedBySponsors`) — Reference, list of `Sponsor`

### `AboutStat` (component)
- `Value` (`value`) — Float (e.g. `12.5`)
- `Suffix` (`suffix`) — Single line text (e.g. "K", "M")
- `Decimals` (`decimals`) — Integer (default 0)
- `Label` (`label`) — Single line text (e.g. "YouTube Subscribers")
- `Channel` (`channel`) — Enumeration: `YouTube`, `Instagram`, `X`, `Bluesky` (drives which icon renders)

### `SiteSettings` (model — singleton)
- `Tagline` (`tagline`) — Single line text
- `YouTube URL` (`youtubeUrl`) — Single line text
- `Bluesky URL` (`blueskyUrl`) — Single line text
- `X URL` (`xUrl`) — Single line text
- `Instagram URL` (`instagramUrl`) — Single line text
- `Newsletter Form Action` (`newsletterFormAction`) — Single line text (so you can swap newsletter providers later without a code change)

## 3. Create API access

1. Project Settings → **API Access**.
2. Copy the **Content API** endpoint (looks like `https://api-eu-central-1.hygraph.com/v2/<projectId>/master`).
3. **Permanent Auth Tokens** → **Add token** → name it `production-read`. Permission: `Read` on `Published` content. Copy the token.
4. (For seeding) Create a second token `migration-write` with `Read + Mutate` permissions on the `master` stage. Treat this like a password — never commit it.
5. **Public Content API** → enable "Read access from `Published` stage" so anonymous reads work without a token (recommended; keeps the read-token out of the public bundle).

## 4. Plug credentials into the project

Add to `.env.local` (and Vercel project env vars):

```
HYGRAPH_API_URL=https://api-eu-central-1.hygraph.com/v2/<projectId>/master
HYGRAPH_READ_TOKEN=<production-read token>           # optional if Public API is enabled
HYGRAPH_MIGRATION_TOKEN=<migration-write token>      # local-only; seed script uses this
HYGRAPH_REVALIDATE_SECRET=<random string>            # share with Hygraph webhook
```

Generate a strong random secret:
```bash
openssl rand -hex 32
```

## 5. Seed existing content

After the schema is in place and the env vars are set:

```bash
pnpm install
pnpm tsx scripts/seed-hygraph.ts
```

The script reads the current hardcoded data in `src/lib/films.ts` and the team list from `src/app/about/page.tsx`, then creates them in Hygraph via the Management API. It's idempotent — safe to run multiple times.

## 6. Wire revalidation

In Hygraph: **Webhooks → Add webhook**.
- URL: `https://<your-vercel-domain>/api/revalidate`
- Method: POST
- Trigger: any model publish/unpublish event
- Headers: `x-hygraph-secret: <your HYGRAPH_REVALIDATE_SECRET>`

When content publishes, Vercel revalidates the affected pages within seconds — no full rebuild needed.

## 7. Open up the dashboard to the client

Hygraph → **Project Settings → Members → Invite member**.
- Role: `Editor` (can create/edit/publish, can't change schema)
- Or `Author` (can create/edit drafts; needs editor approval to publish) for stricter workflow

## What you need to decide

1. **Single editor or approval workflow?** Editor role lets anyone publish; Author role gates publishing through an approval step.
2. **Localization?** Free plan includes 2 locales. Skip if English-only for now — adding later is easy.
3. **Asset storage** — Hygraph hosts images on their CDN by default. Free tier = 1GB. Each film's stills can add up; if you'll have many large hero images, consider Cloudinary or a self-hosted bucket.
4. **Custom workflows** — Hygraph supports content scheduling, multi-stage publishing (draft/review/published), and webhooks. Tell me which of these you want enabled.

## Files this integration touches

- `src/lib/hygraph/client.ts` — GraphQL fetch wrapper
- `src/lib/hygraph/queries.ts` — typed query strings
- `src/lib/films.ts` — adapter that switches between local data and Hygraph based on env
- `src/lib/team.ts` — same adapter pattern for team members
- `src/app/api/revalidate/route.ts` — webhook receiver
- `scripts/seed-hygraph.ts` — one-shot migration
- `.env.local` — credentials (not committed)
