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

export const metadata: Metadata = {
  title: "About | CultRepo",
  description:
    "Independent documentaries about the humans behind open source and the systems shaping modern technology.",
};


const community = [
  {
    to: 250,
    suffix: "K",
    decimals: 0,
    label: "YouTube Subscribers",
    icon: <YouTubeIcon size={14} />,
  },
  {
    to: 15,
    suffix: "M",
    decimals: 0,
    label: "YouTube Views",
    icon: <YouTubeIcon size={14} />,
  },
  {
    to: 5,
    suffix: "K",
    decimals: 0,
    label: "Instagram Followers",
    icon: <InstagramIcon size={14} />,
  },
  {
    to: 12.5,
    suffix: "K",
    decimals: 1,
    label: "X Followers",
    icon: <XIcon size={12} />,
  },
];

const sponsors = [
  { name: "IBM", slug: "ibm" },
  { name: "Red Hat", slug: "redhat" },
  { name: "Google", slug: "google" },
  { name: "JetBrains", slug: "jetbrains" },
  { name: "Shopify", slug: "shopify" },
];

const STORY_TEXT = `Founded in 2018 as Honeypot, Cult.Repo is an independent media platform telling the human stories behind technology — with a particular focus on the people who build and maintain open source.

What started as a single YouTube channel has grown into a small studio of filmmakers chasing the stories that don't fit into a blog post or a release note.`;

export default async function AboutPage() {
  const team = await getTeam();
  return (
    <div className="page-container about-editorial">
      <section className="about-hero">
        <h1 className="about-title">
          <SplitReveal
            text="Films about the humans behind the systems we use every day."
            stagger={45}
          />
        </h1>
        <p className="about-subtitle">
          <SplitReveal
            text="Independent. Long-form. Made with the people who built the things, not about them."
            stagger={25}
            startDelay={500}
          />
        </p>
        <div className="about-hero-trusted">
          <Reveal delay={300}>
            <span className="about-partners-label">Trusted by</span>
          </Reveal>
          <Reveal delay={420}>
            <div className="about-partners-logos">
              {sponsors.map((p) => (
                <img
                  key={p.slug}
                  src={`/partners/${p.slug}.png`}
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
          <img src="/about/backstage-1.jpg" alt="" />
        </Reveal>
      </section>

      <section className="about-story">
        <div className="about-story-layout">
          <Reveal className="about-story-ghost">
            <img src="/ghost.svg" alt="" />
          </Reveal>
          <div className="about-story-text">
            <Typewriter text={STORY_TEXT} speed={32} />
          </div>
        </div>
      </section>

      <section className="about-numbers-section">
        <div className="about-numbers">
          {community.map((c, i) => (
            <Reveal key={c.label} delay={i * 120}>
              <div className="about-number">
                <CornerSquares corners={i === 0 ? ["tl", "tr", "bl", "br"] : ["tr", "br"]} />
                <span className="about-number-value">
                  <CountUp to={c.to} suffix={c.suffix} decimals={c.decimals} />
                </span>
                <div className="about-number-meta">
                  <span className="about-number-icon">{c.icon}</span>
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
