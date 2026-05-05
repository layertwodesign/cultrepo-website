import { hygraphFetch, isHygraphConfigured } from "./hygraph/client";
import { SPONSORSHIP_PAGE_QUERY } from "./hygraph/queries";
import type { HygraphSeo } from "./seo";

export const SPONSORSHIP_CACHE_TAG = "sponsorship";

export type FormFieldType = "Text" | "Email" | "Tel" | "Textarea" | "Select";

export type FormField = {
  label: string;
  name: string;
  type: FormFieldType;
  required: boolean;
  options: string[];
  placeholder: string | null;
};

export type SponsorshipPageData = {
  heroCopy: string;
  formRecipientEmail: string | null;
  formTitle: string | null;
  formSubmitLabel: string;
  formSuccessMessage: string | null;
  formFields: FormField[];
  seo: HygraphSeo;
};

const defaultFields: FormField[] = [
  { label: "First Name", name: "firstName", type: "Text", required: true, options: [], placeholder: null },
  { label: "Last Name", name: "lastName", type: "Text", required: true, options: [], placeholder: null },
  { label: "Email Address", name: "email", type: "Email", required: true, options: [], placeholder: null },
  { label: "Phone Number", name: "phone", type: "Tel", required: false, options: [], placeholder: null },
  {
    label: "Topic",
    name: "topic",
    type: "Select",
    required: true,
    options: ["Sponsor a film", "Sponsor a series", "Brand partnership", "Something else"],
    placeholder: "Select a topic",
  },
  { label: "Message", name: "message", type: "Textarea", required: true, options: [], placeholder: null },
];

const local: SponsorshipPageData = {
  heroCopy:
    "Our team is here to help shape a sponsorship that puts your story in front of builders, engineers, and technical leaders.",
  formRecipientEmail: null,
  formTitle: null,
  formSubmitLabel: "Submit",
  formSuccessMessage: null,
  formFields: defaultFields,
  seo: null,
};

type Hygraph = {
  heroCopy: string | null;
  formRecipientEmail: string | null;
  formTitle: string | null;
  formSubmitLabel: string | null;
  formSuccessMessage: string | null;
  formFields:
    | {
        label: string;
        name: string;
        type: FormFieldType;
        required: boolean | null;
        options: string[] | null;
        placeholder: string | null;
      }[]
    | null;
  seo: HygraphSeo;
};

export async function getSponsorshipPage(): Promise<SponsorshipPageData> {
  if (!isHygraphConfigured) return local;
  const data = await hygraphFetch<{ sponsorshipPages: Hygraph[] }>(
    SPONSORSHIP_PAGE_QUERY,
    undefined,
    { tag: SPONSORSHIP_CACHE_TAG }
  );
  const cms = data?.sponsorshipPages?.[0];
  if (!cms) return local;
  return {
    heroCopy: cms.heroCopy ?? local.heroCopy,
    formRecipientEmail: cms.formRecipientEmail,
    formTitle: cms.formTitle,
    formSubmitLabel: cms.formSubmitLabel ?? local.formSubmitLabel,
    formSuccessMessage: cms.formSuccessMessage,
    formFields: cms.formFields?.length
      ? cms.formFields.map((f) => ({
          label: f.label,
          name: f.name,
          type: f.type,
          required: f.required ?? false,
          options: f.options ?? [],
          placeholder: f.placeholder,
        }))
      : local.formFields,
    seo: cms.seo,
  };
}
