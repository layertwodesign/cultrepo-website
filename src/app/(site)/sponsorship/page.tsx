import type { Metadata } from "next";
import SplitReveal from "@/components/SplitReveal";
import SponsorshipForm from "./SponsorshipForm";
import { getSponsorshipPage } from "@/lib/sponsorship";

export const metadata: Metadata = {
  title: "Sponsorship",
  description:
    "Partner with CultRepo to reach an audience of builders, engineers, and technical leaders through cinematic storytelling.",
  alternates: { canonical: "/sponsorship" },
};

export default async function SponsorshipPage() {
  const page = await getSponsorshipPage();
  return (
    <div className="sponsorship-page">
      <div className="sponsorship-layout">
        <div className="sponsorship-content">
          <h1 className="sponsorship-title">
            <span className="sponsorship-title-anchor" aria-hidden />
            <SplitReveal text={page.heroCopy} stagger={45} />
          </h1>
        </div>
        <SponsorshipForm />
      </div>
    </div>
  );
}
