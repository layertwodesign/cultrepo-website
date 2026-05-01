import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsorship | CultRepo",
  description:
    "Partner with CultRepo to reach an audience of builders, engineers, and technical leaders through cinematic storytelling.",
};

export default function SponsorshipPage() {
  return (
    <div className="page-container">
      <div className="about-content">
        <section className="about-hero">
          <p className="about-label">Sponsorship</p>
          <h1 className="about-title">
            Reach the people<br />
            who build the future.
          </h1>
          <p className="about-subtitle">
            Partner with CultRepo to put your brand in front of an audience of
            builders, engineers, and technical leaders who watch our films.
          </p>
        </section>

        <section className="about-section about-cta">
          <h2 className="about-cta-title">Let&apos;s talk</h2>
          <p className="about-section-text">
            Reach out and we&apos;ll send our partnership deck.
          </p>
          <a href="mailto:emma@cultrepo.com" className="about-cta-button">
            Get in Touch
          </a>
        </section>
      </div>
    </div>
  );
}
