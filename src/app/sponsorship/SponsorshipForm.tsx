"use client";

import { FormEvent } from "react";

const TOPICS = [
  { value: "film", label: "Sponsor a film" },
  { value: "series", label: "Sponsor a series" },
  { value: "partnership", label: "Brand partnership" },
  { value: "other", label: "Something else" },
];

export default function SponsorshipForm() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const firstName = String(data.get("firstName") || "");
    const lastName = String(data.get("lastName") || "");
    const email = String(data.get("email") || "");
    const phone = String(data.get("phone") || "");
    const topic = String(data.get("topic") || "");
    const topicLabel = TOPICS.find((t) => t.value === topic)?.label || topic;
    const message = String(data.get("message") || "");

    const subject = `Sponsorship inquiry — ${firstName} ${lastName}`.trim();
    const body = [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      phone && `Phone: ${phone}`,
      topicLabel && `Topic: ${topicLabel}`,
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
      <label className="sponsorship-field">
        <span className="sponsorship-field-label">First Name</span>
        <input type="text" name="firstName" required autoComplete="given-name" />
      </label>
      <label className="sponsorship-field">
        <span className="sponsorship-field-label">Last Name</span>
        <input type="text" name="lastName" required autoComplete="family-name" />
      </label>
      <label className="sponsorship-field">
        <span className="sponsorship-field-label">Email Address</span>
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label className="sponsorship-field">
        <span className="sponsorship-field-label">Phone Number</span>
        <input type="tel" name="phone" autoComplete="tel" />
      </label>
      <label className="sponsorship-field">
        <span className="sponsorship-field-label">Topic</span>
        <select name="topic" defaultValue="" required>
          <option value="" disabled hidden>
            Select a topic
          </option>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="sponsorship-field">
        <span className="sponsorship-field-label">Message</span>
        <textarea name="message" rows={4} required />
      </label>
      <button type="submit" className="sponsorship-submit">
        Submit <span aria-hidden>→</span>
      </button>
    </form>
  );
}
