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
          <h1 className="sponsorship-title">Sponsor Our Work</h1>
          <p className="sponsorship-sub">
            We&apos;re happy to chat about a partnership.
          </p>
          <SponsorshipForm />
        </div>
        <div className="sponsorship-ghost">
          <img src="/ghost.png" alt="" />
        </div>
      </div>
    </div>
  );
}
