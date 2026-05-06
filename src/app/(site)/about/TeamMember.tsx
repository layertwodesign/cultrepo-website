import Image from "next/image";
import SplitReveal from "@/components/SplitReveal";
import Reveal from "@/components/Reveal";

type Props = {
  name: string;
  role: string;
  photo: string;
  bio: string;
  email?: string;
  bioStartDelay?: number;
};

// Glue the last two words with a non-breaking space so a single trailing word
// can never sit alone on its own line.
function preventOrphan(text: string): string {
  const trimmed = text.trimEnd();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace < 0) return trimmed;
  return trimmed.slice(0, lastSpace) + " " + trimmed.slice(lastSpace + 1);
}

export default function TeamMember({ name, role, photo, bio, email, bioStartDelay = 0 }: Props) {
  const safeBio = preventOrphan(bio);
  // Reveal email after the bio has mostly finished animating in.
  // SplitReveal uses 18ms stagger × words + ~1s per-word transition.
  const wordCount = bio.trim().split(/\s+/).length;
  const emailDelay = bioStartDelay + wordCount * 18 + 200;
  return (
    <div className="team-member">
      <div className="team-member-portrait">
        <Image
          src={photo}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="team-member-info">
        <span className="team-member-name">{name}</span>
        <span className="team-member-role">{role}</span>
      </div>
      <div className="team-member-bio">
        <p className="team-member-bio-text">
          <SplitReveal text={safeBio} stagger={18} startDelay={bioStartDelay} />
        </p>
        {email && (
          <Reveal delay={emailDelay} className="team-member-email-wrap">
            <a href={`mailto:${email}`} className="team-member-email">
              {email}
            </a>
          </Reveal>
        )}
      </div>
    </div>
  );
}
