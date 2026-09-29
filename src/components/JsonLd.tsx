import { jsonLd } from "@/lib/site";

/** Structured data as a plain script tag: it's data, not code, so no next/script. */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
    />
  );
}
