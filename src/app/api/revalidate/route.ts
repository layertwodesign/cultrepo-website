import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { FILMS_CACHE_TAG } from "@/lib/films";
import { TEAM_CACHE_TAG } from "@/lib/team";

const SECRET = process.env.HYGRAPH_REVALIDATE_SECRET;

/**
 * Hygraph webhook receiver.
 * Configure in Hygraph: Webhooks → Add → URL = /api/revalidate
 *   Headers: x-hygraph-secret = <HYGRAPH_REVALIDATE_SECRET>
 *
 * Hygraph posts a JSON body shaped like:
 *   { operation: "publish", data: { __typename: "Film", slug: "vite", ... } }
 * We use the typename to invalidate the right cache tag, and revalidate the
 * specific path when we know it.
 */
export async function POST(req: Request) {
  if (!SECRET) {
    return NextResponse.json(
      { ok: false, error: "Revalidation not configured" },
      { status: 500 }
    );
  }

  // Hygraph header keys must be PascalCase alphanumeric, so the webhook sends
  // either `Authorization: Bearer <secret>` or `HygraphSecret: <secret>`.
  const auth = req.headers.get("authorization");
  const direct = req.headers.get("hygraphsecret") ?? req.headers.get("x-hygraph-secret");
  const fromAuth = auth?.match(/^Bearer\s+(.+)$/)?.[1] ?? null;
  const provided = direct ?? fromAuth;
  if (provided !== SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { operation?: string; data?: { __typename?: string; slug?: string } } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine — fall through and revalidate everything */
  }

  const typename = body?.data?.__typename;
  const slug = body?.data?.slug;
  const revalidated: string[] = [];

  // Webhooks need immediate expiration so the next request fetches fresh data.
  const EXPIRE_NOW = { expire: 0 };

  switch (typename) {
    case "Film":
      revalidateTag(FILMS_CACHE_TAG, EXPIRE_NOW);
      revalidated.push(FILMS_CACHE_TAG);
      if (slug) {
        revalidateTag(`${FILMS_CACHE_TAG}:${slug}`, EXPIRE_NOW);
        revalidatePath(`/films/${slug}`);
        revalidated.push(`/films/${slug}`);
      }
      revalidatePath("/films");
      revalidatePath("/");
      break;
    case "TeamMember":
    case "AboutPage":
      revalidateTag(TEAM_CACHE_TAG, EXPIRE_NOW);
      revalidatePath("/about");
      revalidated.push("team", "/about");
      break;
    case "Sponsor":
    case "SiteSettings":
    default:
      // Unknown or sweeping change — flush all CMS-backed surfaces.
      revalidateTag(FILMS_CACHE_TAG, EXPIRE_NOW);
      revalidateTag(TEAM_CACHE_TAG, EXPIRE_NOW);
      revalidatePath("/", "layout");
      revalidated.push("all");
  }

  return NextResponse.json({ ok: true, revalidated });
}
