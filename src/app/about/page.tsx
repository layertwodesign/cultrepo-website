import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | CultRepo",
  description:
    "CultRepo creates cinematic documentaries about the humans shaping technology. Partner with us to tell the stories that matter.",
};

const sponsors = [
  "IBM",
  "Red Hat",
  "Google",
];

export default function AboutPage() {
  return (
    <div className="page-container">
      <div className="about-content">
        {/* Hero section */}
        <section className="about-hero">
          <p className="about-label">About</p>
          <h1 className="about-title">
            Cinema for the builders<br />
            shaping our era.
          </h1>
          <p className="about-subtitle">
            Long-form documentaries about the humans behind open source,
            infrastructure, and emerging systems.
          </p>
        </section>

        {/* Mission */}
        <section className="about-section">
          <h2 className="about-section-label">Mission</h2>
          <p className="about-section-text">
            Tell the human stories behind the technology shaping our era.
            We focus on the people, decisions, failures, and obsessions behind
            the code — not tutorials, not hype. Films about people.
          </p>
        </section>

        {/* What we do */}
        <section className="about-section">
          <h2 className="about-section-label">What We Do</h2>
          <div className="about-grid">
            <div className="about-card">
              <h3 className="about-card-title">Documentary Films</h3>
              <p className="about-card-text">
                Cinematic stories about the creators and maintainers building
                foundational systems.
              </p>
            </div>
            <div className="about-card">
              <h3 className="about-card-title">Human-Centered Storytelling</h3>
              <p className="about-card-text">
                Focused on the decisions, tensions, and motivations behind the
                code.
              </p>
            </div>
            <div className="about-card">
              <h3 className="about-card-title">A Living Archive</h3>
              <p className="about-card-text">
                Documenting the culture of open source before it disappears
                into abstraction.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="about-section">
          <h2 className="about-section-label">By the Numbers</h2>
          <div className="about-stats">
            <div className="about-stat">
              <span className="about-stat-number">350K+</span>
              <span className="about-stat-label">YouTube Subscribers</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">22M+</span>
              <span className="about-stat-label">Total Views</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">15+</span>
              <span className="about-stat-label">Films</span>
            </div>
          </div>
        </section>

        {/* Sponsors */}
        <section className="about-section">
          <h2 className="about-section-label">Past Partners</h2>
          <p className="about-section-text" style={{ marginBottom: 32 }}>
            We work with organizations that believe in the value of
            documenting the people behind technology.
          </p>
          <div className="about-sponsors">
            {sponsors.map((name) => (
              <div key={name} className="about-sponsor">
                {name}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="about-section about-cta">
          <h2 className="about-cta-title">Partner with CultRepo</h2>
          <p className="about-section-text">
            Reach an audience of builders, engineers, and technical leaders
            through cinematic storytelling.
          </p>
          <a href="mailto:emma@cultrepo.com" className="about-cta-button">
            Get in Touch
          </a>
        </section>
      </div>
    </div>
  );
}
