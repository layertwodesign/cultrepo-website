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
        className="team-member-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <img src={photo} alt={name} className="team-member-photo" />
        <div className="team-member-info">
          <span className="team-member-name">{name}</span>
          <span className="team-member-role">{role}</span>
        </div>
        <span className="team-member-chevron" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M4 7l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
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
