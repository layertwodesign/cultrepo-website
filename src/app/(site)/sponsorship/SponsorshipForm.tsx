"use client";

import { FormEvent, useState } from "react";
import type { FormField } from "@/lib/sponsorship";

type Props = {
  fields: FormField[];
  recipientEmail: string;
  submitLabel: string;
  successMessage: string | null;
};

const HTML_TYPE: Record<FormField["type"], string> = {
  Text: "text",
  Email: "email",
  Tel: "tel",
  Textarea: "textarea",
  Select: "select",
};

const AUTOCOMPLETE_BY_NAME: Record<string, string> = {
  firstName: "given-name",
  lastName: "family-name",
  fullName: "name",
  name: "name",
  email: "email",
  phone: "tel",
  tel: "tel",
};

export default function SponsorshipForm({ fields, recipientEmail, submitLabel, successMessage }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const lines: string[] = [];
    let firstName = "";
    let lastName = "";
    for (const f of fields) {
      const raw = String(data.get(f.name) || "").trim();
      if (!raw) continue;
      if (f.name === "firstName") firstName = raw;
      if (f.name === "lastName") lastName = raw;
      lines.push(`${f.label}: ${raw}`);
    }

    const subject = `Sponsorship inquiry${firstName || lastName ? ` — ${firstName} ${lastName}`.trim() : ""}`;
    const body = lines.join("\n");

    window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (successMessage) setSubmitted(true);
  };

  if (submitted && successMessage) {
    return <div className="sponsorship-form-success">{successMessage}</div>;
  }

  return (
    <form className="sponsorship-form" onSubmit={handleSubmit}>
      {fields.map((f) => {
        const htmlType = HTML_TYPE[f.type];
        const autoComplete = AUTOCOMPLETE_BY_NAME[f.name];
        return (
          <label key={f.name} className="sponsorship-field">
            <span className="sponsorship-field-label">{f.label}</span>
            {f.type === "Textarea" ? (
              <textarea
                name={f.name}
                rows={4}
                required={f.required}
                placeholder={f.placeholder ?? undefined}
              />
            ) : f.type === "Select" ? (
              <select name={f.name} defaultValue="" required={f.required}>
                <option value="" disabled hidden>
                  {f.placeholder ?? "Select"}
                </option>
                {f.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={htmlType}
                name={f.name}
                required={f.required}
                autoComplete={autoComplete}
                placeholder={f.placeholder ?? undefined}
              />
            )}
          </label>
        );
      })}
      <button type="submit" className="sponsorship-submit">
        {submitLabel} <span aria-hidden>→</span>
      </button>
    </form>
  );
}
