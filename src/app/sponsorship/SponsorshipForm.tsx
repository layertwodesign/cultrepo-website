"use client";

import { FormEvent } from "react";

export default function SponsorshipForm() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const firstName = String(data.get("firstName") || "");
    const lastName = String(data.get("lastName") || "");
    const email = String(data.get("email") || "");
    const company = String(data.get("company") || "");
    const role = String(data.get("role") || "");
    const message = String(data.get("message") || "");

    const subject = `Sponsorship inquiry — ${firstName} ${lastName}`.trim();
    const body = [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      company && `Company: ${company}`,
      role && `Role: ${role}`,
      "",
      "Message:",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href = `mailto:emma@cultrepo.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form className="sponsorship-form" onSubmit={handleSubmit}>
      <div className="sponsorship-row">
        <input type="text" name="firstName" placeholder="First Name" required autoComplete="given-name" />
        <input type="text" name="lastName" placeholder="Last Name" required autoComplete="family-name" />
      </div>
      <input type="email" name="email" placeholder="Email" required autoComplete="email" />
      <div className="sponsorship-row">
        <input type="text" name="company" placeholder="Company" autoComplete="organization" />
        <input type="text" name="role" placeholder="Role" autoComplete="organization-title" />
      </div>
      <textarea name="message" placeholder="Tell us about your sponsorship interest" rows={5} required />
      <button type="submit" className="sponsorship-submit">Submit</button>
    </form>
  );
}
