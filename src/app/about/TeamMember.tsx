"use client";

import { useState } from "react";

type Props = {
  name: string;
  role: string;
  photo: string;
  bio: string;
  email?: string;
};

export default function TeamMember({ name, role, photo, bio, email }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`team-member ${open ? "open" : ""}`}>
      <button
        type="button"
        className="team-member-card"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="team-member-portrait">
          <img src={photo} alt={name} />
        </div>
        <div className="team-member-info">
          <span className="team-member-name">{name}</span>
          <span className="team-member-role">{role}</span>
        </div>
      </button>
      <div className="team-member-bio" hidden={!open}>
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
