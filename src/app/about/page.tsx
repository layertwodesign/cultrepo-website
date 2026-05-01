import type { Metadata } from "next";
import TransitionLink from "@/components/TransitionLink";
import {
  YouTubeIcon,
  InstagramIcon,
  XIcon,
} from "@/components/SocialIcons";
import Reveal from "@/components/Reveal";
import Typewriter from "@/components/Typewriter";
import CountUp from "@/components/CountUp";
import TeamMember from "./TeamMember";

export const metadata: Metadata = {
  title: "About | CultRepo",
  description:
    "Independent documentaries about the humans behind open source and the systems shaping modern technology.",
};

const team = [
  {
    name: "Emma Tracey",
    role: "CEO",
    photo: "/team/emma.webp",
    bio: "Serial founder who started her career as a journalist and never stopped chasing stories. A long-time open source advocate, Emma cares about getting recognition into the hands of the people quietly maintaining the systems everyone else depends on.",
    email: "emma@cultrepo.com",
  },
  {
    name: "Josiah McGarvie",
    role: "Filmmaker",
    photo: "/team/josiah.webp",
    bio: "Australian filmmaker, eight years deep in tech documentaries. Co-founded the original YouTube channel with Emma and assembled the team behind films on Kubernetes, Vue.js, GraphQL, Elixir, Vite, Argo, eBPF, PyTorch, Envoy, Prometheus, and Ember.js.",
    email: "josiah@cultrepo.com",
  },
  {
    name: "Ida Bechtle",
    role: "Filmmaker",
    photo: "/team/ida.webp",
    bio: "Joined when the YouTube channel was barely a channel. She has been a quiet engine behind its growth, with a knack for finding the human moment inside a technical story. Off-set: cats, puzzles, and a strong opinion about coffee.",
    email: "ida@cultrepo.com",
  },
  {
    name: "Guillermo Lopez",
    role: "Filmmaker",
    photo: "/team/guillermo.webp",
    bio: "Filmmaker and producer who came up in advertising before turning fully to tech documentaries. Brings a sharper narrative spine to production. Credits include Kubernetes, Prometheus, Angular, Vite, TypeScript, the Investors Masterclass, and various minidocs.",
    email: "guillermo@cultrepo.com",
  },
];

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

export default function AboutPage() {
  return (
    <div className="page-container about-editorial">
      <section className="about-hero">
        <Reveal>
          <h1 className="about-title">
            Films about the humans<br />
            behind the systems<br />
            we use every day.
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className="about-subtitle">
            Independent. Long-form. Made with the people who built the things,
            not about them.
          </p>
        </Reveal>
      </section>

      <section className="about-image-break">
        <Reveal>
          <img src="/about/backstage-1.jpg" alt="" />
        </Reveal>
      </section>

      <section className="about-story">
        <div className="about-story-layout">
          <Reveal className="about-story-ghost">
            <img src="/ghost.svg" alt="" />
          </Reveal>
          <div className="about-story-text">
            <Typewriter text={STORY_TEXT} speed={12} />
          </div>
        </div>
      </section>

      <section className="about-numbers">
        {community.map((c, i) => (
          <Reveal key={c.label} delay={i * 120}>
            <div className="about-number">
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
      </section>

      <section className="about-team-section">
        <div className="team-grid">
          {team.map((m, i) => (
            <Reveal key={m.name} delay={i * 100}>
              <TeamMember {...m} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-partners">
        <Reveal>
          <span className="about-partners-label">Trusted by</span>
        </Reveal>
        <Reveal delay={120}>
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
      </section>

      <section className="about-final-cta">
        <Reveal>
          <h2 className="about-final-cta-title">Sponsor a film.</h2>
          <p className="about-final-cta-sub">
            Reach builders, engineers, and technical leaders.
          </p>
          <TransitionLink href="/sponsorship" className="about-cta-button">
            Sponsorship
          </TransitionLink>
        </Reveal>
      </section>
    </div>
  );
}
