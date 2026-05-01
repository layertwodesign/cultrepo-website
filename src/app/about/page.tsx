import type { Metadata } from "next";
import TransitionLink from "@/components/TransitionLink";
import {
  YouTubeIcon,
  InstagramIcon,
  XIcon,
} from "@/components/SocialIcons";
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
  { value: "250K", label: "YouTube Subscribers", icon: <YouTubeIcon size={28} /> },
  { value: "15M", label: "YouTube Views", icon: <YouTubeIcon size={28} /> },
  { value: "5K", label: "Instagram Followers", icon: <InstagramIcon size={26} /> },
  { value: "12.5K", label: "X Followers", icon: <XIcon size={24} /> },
];

const sponsors = ["IBM", "Red Hat", "Google", "JetBrains", "Shopify"];

export default function AboutPage() {
  return (
    <div className="page-container">
      <div className="about-content">
        <section className="about-hero">
          <h1 className="about-title">
            Films about the humans<br />
            behind the systems<br />
            we use every day.
          </h1>
          <p className="about-subtitle">
            Independent. Long-form. Made with the people who built the things,
            not about them.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-label">The Story</h2>
          <p className="about-section-text">
            Founded in 2018 as Honeypot, Cult.Repo is an independent media
            platform telling the human stories behind technology — with a
            particular focus on the people who build and maintain open source.
            What started as a single YouTube channel has grown into a small
            studio of filmmakers chasing the stories that don&apos;t fit into a
            blog post or a release note.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-label">Community</h2>
          <div className="community-grid">
            {community.map((c) => (
              <div key={c.label} className="community-stat">
                <div className="community-stat-icon">{c.icon}</div>
                <div className="community-stat-text">
                  <span className="community-stat-value">{c.value}</span>
                  <span className="community-stat-label">{c.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2 className="about-section-label">The Team</h2>
          <div className="team-grid">
            {team.map((m) => (
              <TeamMember key={m.name} {...m} />
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2 className="about-section-label">Past Partners</h2>
          <div className="about-sponsors">
            {sponsors.map((name) => (
              <div key={name} className="about-sponsor">
                {name}
              </div>
            ))}
          </div>
        </section>

        <section className="about-section about-cta">
          <h2 className="about-cta-title">Sponsor a film</h2>
          <p className="about-section-text">
            Reach an audience of builders, engineers, and technical leaders.
          </p>
          <TransitionLink href="/sponsorship" className="about-cta-button">
            Sponsorship
          </TransitionLink>
        </section>
      </div>
    </div>
  );
}
