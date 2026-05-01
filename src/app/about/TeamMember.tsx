import Typewriter from "@/components/Typewriter";

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
        <img src={photo} alt={name} />
      </div>
      <div className="team-member-info">
        <span className="team-member-name">{name}</span>
        <span className="team-member-role">{role}</span>
      </div>
      <div className="team-member-bio">
        <Typewriter
          text={bio}
          speed={10}
          startDelay={bioStartDelay}
          className="team-member-bio-text"
        />
        {email && (
          <a href={`mailto:${email}`} className="team-member-email">
            {email}
          </a>
        )}
      </div>
    </div>
  );
}
