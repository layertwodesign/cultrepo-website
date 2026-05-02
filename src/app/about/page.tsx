import type { Metadata } from "next";
import TransitionLink from "@/components/TransitionLink";
import {
  YouTubeIcon,
  InstagramIcon,
  XIcon,
} from "@/components/SocialIcons";
import Reveal from "@/components/Reveal";
import SplitReveal from "@/components/SplitReveal";
import Typewriter from "@/components/Typewriter";
import CornerSquares from "@/components/CornerSquares";
import CountUp from "@/components/CountUp";
import InvertOnView from "@/components/InvertOnView";
import SiteFooter from "@/components/SiteFooter";
import TeamMember from "./TeamMember";
import { getTeam } from "@/lib/team";
import { getAboutPage } from "@/lib/about";

const ICON_FOR_CHANNEL = {
  YouTube: <YouTubeIcon size={14} />,
  Instagram: <InstagramIcon size={14} />,
  X: <XIcon size={12} />,
  Bluesky: <YouTubeIcon size={14} />,
} as const;

export const metadata: Metadata = {
  title: "About | CultRepo",
  description:
    "Independent documentaries about the humans behind open source and the systems shaping modern technology.",
};


export default async function AboutPage() {
  const [team, about] = await Promise.all([getTeam(), getAboutPage()]);
  return (
    <div className="page-container about-editorial">
      <section className="about-hero">
        <h1 className="about-title">
          <SplitReveal text={about.heroTitle} stagger={45} />
        </h1>
        <p className="about-subtitle">
          <SplitReveal text={about.heroSubtitle} stagger={25} startDelay={500} />
        </p>
        <div className="about-hero-trusted">
          <Reveal delay={300}>
            <span className="about-partners-label">Trusted by</span>
          </Reveal>
          <Reveal delay={420}>
            <div className="about-partners-logos">
              {about.trustedBySponsors.map((p) => (
                <img
                  key={p.slug}
                  src={p.logo ?? `/partners/${p.slug}.png`}
                  alt={p.name}
                  className="about-partner-logo"
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="about-image-break">
        <Reveal>
          <CornerSquares />
          <img src={about.backstageImage ?? "/about/backstage-1.jpg"} alt="" />
        </Reveal>
      </section>

      <section className="about-story">
        <div className="about-story-layout">
          <Reveal className="about-story-ghost">
            <img src="/ghost.svg" alt="" />
          </Reveal>
          <div className="about-story-text">
            <Typewriter text={about.story} speed={32} />
          </div>
        </div>
      </section>

      <section className="about-numbers-section">
        <div className="about-numbers">
          {about.stats.map((c, i) => (
            <Reveal key={c.label} delay={i * 120}>
              <div className="about-number">
                <CornerSquares corners={i === 0 ? ["tl", "tr", "bl", "br"] : ["tr", "br"]} />
                <span className="about-number-value">
                  <CountUp to={c.value} suffix={c.suffix} decimals={c.decimals} />
                </span>
                <div className="about-number-meta">
                  <span className="about-number-icon">{ICON_FOR_CHANNEL[c.channel]}</span>
                  <span className="about-number-label">{c.label}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-team-section">
        <div className="team-grid">
          {team.map((m, i) => (
            <Reveal key={m.name} delay={i * 100}>
              <TeamMember {...m} bioStartDelay={400 + i * 200} />
            </Reveal>
          ))}
        </div>
      </section>

      <InvertOnView>
        <div className="about-final-block">
          <section className="about-final-cta">
            <Reveal>
              <h2 className="about-final-cta-title">Sponsor a film.</h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="about-final-cta-sub">
                Reach builders, engineers, and technical leaders.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <TransitionLink href="/sponsorship" className="about-cta-button">
                Sponsorship
              </TransitionLink>
            </Reveal>
          </section>
          <SiteFooter force />
        </div>
      </InvertOnView>
    </div>
  );
}
