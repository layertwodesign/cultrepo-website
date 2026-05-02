import { hygraphFetch, isHygraphConfigured } from "./hygraph/client";
import { SPONSORSHIP_PAGE_QUERY } from "./hygraph/queries";

export const SPONSORSHIP_CACHE_TAG = "sponsorship";

export type SponsorshipPageData = {
  heroCopy: string;
  formRecipientEmail: string | null;
};

const local: SponsorshipPageData = {
  heroCopy:
    "Our team is here to help shape a sponsorship that puts your story in front of builders, engineers, and technical leaders.",
  formRecipientEmail: null,
};

type Hygraph = {
  heroCopy: string | null;
  formRecipientEmail: string | null;
};

export async function getSponsorshipPage(): Promise<SponsorshipPageData> {
  if (!isHygraphConfigured) return local;
  const data = await hygraphFetch<{ sponsorshipPages: Hygraph[] }>(
    SPONSORSHIP_PAGE_QUERY,
    undefined,
    { tag: SPONSORSHIP_CACHE_TAG }
  );
  const cms = data?.sponsorshipPages?.[0];
  if (!cms) return local;
  return {
    heroCopy: cms.heroCopy ?? local.heroCopy,
    formRecipientEmail: cms.formRecipientEmail,
  };
}
