import Image from "next/image";
import SplitReveal from "@/components/SplitReveal";

type Props = {
  name: string;
  role: string;
  photo: string;
  bio: string;
  email?: string;
  bioStartDelay?: number;
};

export default function TeamMember({ name, role, photo, bio, email, bioStartDelay = 0 }: Props) {
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
          <SplitReveal text={bio} stagger={18} startDelay={bioStartDelay} />
        </p>
        {email && (
          <a href={`mailto:${email}`} className="team-member-email">
            {email}
          </a>
        )}
      </div>
    </div>
  );
}
