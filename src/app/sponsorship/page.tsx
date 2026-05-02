import type { Metadata } from "next";
import SplitReveal from "@/components/SplitReveal";
import SponsorshipForm from "./SponsorshipForm";

export const metadata: Metadata = {
  title: "Sponsorship",
  description:
    "Partner with CultRepo to reach an audience of builders, engineers, and technical leaders through cinematic storytelling.",
  alternates: { canonical: "/sponsorship" },
};

export default function SponsorshipPage() {
  return (
    <div className="sponsorship-page">
      <div className="sponsorship-layout">
        <div className="sponsorship-content">
          <h1 className="sponsorship-title">
            <span className="sponsorship-title-anchor" aria-hidden />
            <SplitReveal
              text="Our team is here to help shape a sponsorship that puts your story in front of builders, engineers, and technical leaders."
              stagger={45}
            />
          </h1>
        </div>
        <SponsorshipForm />
      </div>
    </div>
  );
}
