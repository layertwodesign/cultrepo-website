type Props = {
  name: string;
  role: string;
  photo: string;
  bio: string;
  email?: string;
};

export default function TeamMember({ name, role, photo, bio, email }: Props) {
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
        <p>{bio}</p>
        {email && (
          <a href={`mailto:${email}`} className="team-member-email">
            {email}
          </a>
        )}
      </div>
    </div>
  );
}
