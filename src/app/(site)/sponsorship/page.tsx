import type { Metadata } from "next";
import SplitReveal from "@/components/SplitReveal";
import SponsorshipForm from "./SponsorshipForm";
import { getSponsorshipPage } from "@/lib/sponsorship";
import { getSiteSettings } from "@/lib/site-settings";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getSponsorshipPage(),
    getSiteSettings(),
  ]);
  return buildMetadata(
    page.seo,
    settings.defaultSeo,
    {
      title: "Sponsorship",
      description:
        "Partner with CultRepo to reach an audience of builders, engineers, and technical leaders through cinematic storytelling.",
    },
    "/sponsorship"
  );
}

export default async function SponsorshipPage() {
  const page = await getSponsorshipPage();
  const recipientEmail = page.formRecipientEmail || "emma@cultrepo.com";
  return (
    <div className="sponsorship-page">
      <div className="sponsorship-layout">
        <div className="sponsorship-content">
          <h1 className="sponsorship-title">
            <span className="sponsorship-title-anchor" aria-hidden />
            <SplitReveal text={page.heroCopy} stagger={45} />
          </h1>
        </div>
        <div className="sponsorship-form-wrap">
          {page.formTitle ? (
            <h2 className="sponsorship-form-title">{page.formTitle}</h2>
          ) : null}
          <SponsorshipForm
            fields={page.formFields}
            recipientEmail={recipientEmail}
            submitLabel={page.formSubmitLabel}
            successMessage={page.formSuccessMessage}
          />
        </div>
      </div>
    </div>
  );
}
