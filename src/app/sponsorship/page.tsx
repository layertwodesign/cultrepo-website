import type { Metadata } from "next";
import SponsorshipForm from "./SponsorshipForm";

export const metadata: Metadata = {
  title: "Sponsorship | CultRepo",
  description:
    "Partner with CultRepo to reach an audience of builders, engineers, and technical leaders through cinematic storytelling.",
};

export default function SponsorshipPage() {
  return (
    <div className="sponsorship-page">
      <div className="sponsorship-layout">
        <div className="sponsorship-content">
          <h1 className="sponsorship-title">
            Our team is here to help shape a sponsorship that puts your story in front of builders, engineers, and technical leaders.
          </h1>
        </div>
        <SponsorshipForm />
      </div>
    </div>
  );
}
