# CultRepo · Hygraph Project

Quick reference so future-me can keep editing the CMS side without spelunking through chat history.

## Project identity

- **Project name:** CultRepo
- **Project ID:** `cmoddosz9007507w3c40l0pxm`
- **Project owner UUID:** `bfa04c279f5c4661b4b1747c3cfecbb1` (the studio dashboard team/project key)
- **Environment:** `master`
- **Environment ID:** `36af04adedeb412fa3759e8b2b1fe9eb`
- **Region:** `us-west-2`

## Endpoints

- **Content (CDN, fast read):** `https://us-west-2.cdn.hygraph.com/content/cmoddosz9007507w3c40l0pxm/master`
- **Content (regular API, used as endpoint by management SDK):** `https://api-us-west-2.hygraph.com/v2/cmoddosz9007507w3c40l0pxm/master`
- **Management:** `https://management-us-west-2.hygraph.com/graphql`
- **MCP server (for AI clients):** `https://mcp-us-west-2.hygraph.com/cmoddosz9007507w3c40l0pxm/master/mcp`

## Dashboard quick links

- **Studio root:** https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb
- **Schema:** https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb/schema
- **Content:** https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb/content
- **Assets:** https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb/assets
- **API access / Endpoints:** https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb/settings/api-access
- **Permanent Auth Tokens:** https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb/settings/permanent-auth-tokens
- **Webhooks:** https://studio-us-west-2.hygraph.com/bfa04c27-9f5c-4661-b4b1-747c3cfecbb1/36af04adedeb412fa3759e8b2b1fe9eb/settings/webhooks

## Tokens (in `.env.local`, never committed)

- `HYGRAPH_MIGRATION_TOKEN` — Permanent Auth Token named `migration-write`. Used by the seed/setup scripts via the Management API. **Rotate after the initial setup is finished** — it was pasted in chat history during setup.
- `HYGRAPH_API_URL` — set to the CDN content URL above; used by the live site for fetching published content.
- `HYGRAPH_REVALIDATE_SECRET` — random hex string, shared with the Hygraph webhook → `/api/revalidate`.

## Permissions notes

The current `migration-write` PAT can MUTATE schema (we successfully submitted batch migrations) but cannot READ environment metadata (`ENVIRONMENT_READ`, `AUDIT_LOGS_READ`, etc.). This means:

- `@hygraph/management-sdk`'s `Client.run()` fails its preflight environment lookup. We bypass the SDK and POST raw `submitBatchChanges` mutations directly with the hard-coded `environmentId`.
- We can't poll migration status via the API — to verify migrations applied, hit the **Content API** introspection (`__type(name: "Film")`) or look at the dashboard's Schema page.

If we want richer tooling later (audit log access, migration history queries), create a token with broader management permissions — typically `Project Admin` role.

## Schema

Defined in `scripts/setup-hygraph-schema.ts`. Models:

- **Film** — title, slug, status (enum), description, synopsis, year, duration, director, youtubeId, technologies (list), fundraisingGoal/Raised, order, poster (asset), videoClip (asset), stills (asset list), sponsors (relation), cast/crew/extras/timeline (component lists)
- **TeamMember** — name, role, bio, email, order, photo (asset)
- **Sponsor** — name, slug, logo (asset)
- **AboutPage** — singleton-by-convention. heroTitle, heroSubtitle, story, backstageImage, stats (component list), trustedBySponsors (relation list)
- **SiteSettings** — singleton-by-convention. tagline, social URLs, newsletterFormAction
- **Components:** FilmCastMember, FilmCrewMember, FilmExtra, FilmTimelineStep, AboutStat
- **Enumerations:** FilmStatus, StatChannel

Field-level changes go in `scripts/setup-hygraph-schema.ts` under the matching model section. Re-run is destructive: Hygraph rejects re-creating existing fields, so for incremental schema edits, prefer running smaller per-change scripts or going through the dashboard.

## Operational scripts

- `scripts/setup-hygraph-schema.ts` — one-shot schema build (raw `submitBatchChanges`)
- `scripts/seed-hygraph.ts` — pushes hardcoded films + team data into Hygraph. Idempotent via upserts.
- `src/app/api/revalidate/route.ts` — webhook receiver. Hygraph posts on publish/unpublish; we revalidate the matching cache tag with `expire: 0`.

Run scripts with: `pnpm tsx scripts/<file>.ts`. They auto-load `.env.local`.

## TODO / known gaps

- **Asset upload step** — neither script uploads images. Run them, then either (a) upload posters/stills/team photos manually in the Hygraph Asset Library and link them to records, or (b) extend `seed-hygraph.ts` with the Hygraph asset upload API to walk `/public/team`, `/public/posters`, `/public/stills`, `/public/clips`.
- **Future: site admin shell** — user wants a `/admin` (or subdomain) page that pulls together: link to Hygraph for "Edit site content", embedded analytics (Vercel Web Analytics + Speed Insights, GA4, Search Console), brand tools (logo files, color palette, fonts download). Single sign-in to all the places they need to manage the site/brand.
- **Token rotation** — after initial setup is verified working, regenerate `migration-write` and update `.env.local` + Vercel env.
