/**
 * Schema migration:
 *   1. Seo component (title, description, ogImage, noIndex) — added to:
 *      - AboutPage, SponsorshipPage, Film as `seo`
 *      - SiteSettings as `defaultSeo`, `homeSeo`, `filmsListingSeo`
 *   2. FormFieldType enum + FormField component
 *   3. SponsorshipPage extras: formTitle, formSubmitLabel, formSuccessMessage,
 *      formFields (multi-component)
 *
 * Run once. Throws if anything already exists. To re-run, delete the
 * affected entities in Hygraph UI first.
 */

import { config } from "dotenv";

config({ path: ".env.local" });

const TOKEN = process.env.HYGRAPH_MIGRATION_TOKEN!;
const MGMT_URL = "https://management-us-west-2.hygraph.com/graphql";
const ENVIRONMENT_ID = "36af04adedeb412fa3759e8b2b1fe9eb";

if (!TOKEN) {
  console.error("Missing HYGRAPH_MIGRATION_TOKEN in .env.local");
  process.exit(1);
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(MGMT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("\n"));
  if (!json.data) throw new Error("No data returned");
  return json.data;
}

type Change = Record<string, unknown>;
const changes: Change[] = [];

// -------- enums --------
changes.push({
  createEnumeration: {
    apiId: "FormFieldType",
    displayName: "Form Field Type",
    values: [
      { apiId: "Text", displayName: "Text" },
      { apiId: "Email", displayName: "Email" },
      { apiId: "Tel", displayName: "Phone" },
      { apiId: "Textarea", displayName: "Textarea (multi-line)" },
      { apiId: "Select", displayName: "Select (dropdown)" },
    ],
  },
});

// -------- Seo component --------
changes.push({
  createComponent: {
    apiId: "Seo",
    apiIdPlural: "Seos",
    displayName: "SEO",
    description:
      "Search-engine + social-share metadata. Leave fields blank to fall back to site-wide defaults.",
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "Seo",
    apiId: "title",
    displayName: "Page Title",
    type: "STRING",
    description: "Browser tab + Google result title. 50–60 characters is ideal.",
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "Seo",
    apiId: "description",
    displayName: "Meta Description",
    type: "STRING",
    description:
      "Short summary shown under the Google result + as the social-share preview text. 150–160 characters is ideal.",
  },
});
changes.push({
  createRelationalField: {
    parentApiId: "Seo",
    apiId: "ogImage",
    displayName: "Social Share Image",
    type: "ASSET",
    isList: false,
    description:
      "Image shown when the page is shared to social. 1200×630 PNG or JPG works best.",
    reverseField: {
      apiId: "seosOgImage",
      modelApiId: "Asset",
      displayName: "SEO OG Images",
      isList: true,
    },
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "Seo",
    apiId: "noIndex",
    displayName: "Hide from Search",
    type: "BOOLEAN",
    initialValue: "false",
    description:
      "Tick to ask Google + other engines NOT to index this page. Leave off for normal pages.",
  },
});

// -------- FormField component --------
changes.push({
  createComponent: {
    apiId: "FormField",
    apiIdPlural: "FormFields",
    displayName: "Form Field",
    description:
      "A single field on a form. Add as many as you like — they render in order.",
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "FormField",
    apiId: "label",
    displayName: "Label",
    type: "STRING",
    isRequired: true,
    description: "Visible label above the input (e.g. 'First Name').",
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "FormField",
    apiId: "name",
    displayName: "Name (technical)",
    type: "STRING",
    isRequired: true,
    description:
      "Lowercase identifier used in the submission email (e.g. 'firstName'). No spaces.",
  },
});
changes.push({
  createEnumerableField: {
    parentApiId: "FormField",
    apiId: "type",
    displayName: "Type",
    enumerationApiId: "FormFieldType",
    isRequired: true,
    description: "Input type. Use 'Select' if you want a dropdown of options.",
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "FormField",
    apiId: "required",
    displayName: "Required",
    type: "BOOLEAN",
    initialValue: "true",
    description: "If on, the user must fill this in before submitting.",
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "FormField",
    apiId: "options",
    displayName: "Options (Select only)",
    type: "STRING",
    isList: true,
    description:
      "Dropdown options. Only used when Type = Select. One per line.",
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "FormField",
    apiId: "placeholder",
    displayName: "Placeholder",
    type: "STRING",
    description: "Optional ghost text inside the input.",
  },
});

// -------- Add Seo to existing models --------
const addSeo = (parentApiId: string, apiId = "seo", displayName = "SEO") => {
  changes.push({
    createComponentField: {
      parentApiId,
      apiId,
      displayName,
      componentApiId: "Seo",
      isList: false,
      description: "Search engine + social share settings for this page.",
    },
  });
};

addSeo("AboutPage");
addSeo("SponsorshipPage");
addSeo("Film");
addSeo("SiteSettings", "defaultSeo", "Default SEO");
addSeo("SiteSettings", "homeSeo", "Home Page SEO");
addSeo("SiteSettings", "filmsListingSeo", "Films Listing SEO");

// -------- SponsorshipPage form fields --------
changes.push({
  createSimpleField: {
    parentApiId: "SponsorshipPage",
    apiId: "formTitle",
    displayName: "Form Title",
    type: "STRING",
    description: "Optional heading shown above the form.",
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "SponsorshipPage",
    apiId: "formSubmitLabel",
    displayName: "Submit Button Label",
    type: "STRING",
    initialValue: "Submit",
    description: "Text on the submit button.",
  },
});
changes.push({
  createSimpleField: {
    parentApiId: "SponsorshipPage",
    apiId: "formSuccessMessage",
    displayName: "Success Message",
    type: "STRING",
    description:
      "Message shown after a successful submit. If blank, the user's email client opens a pre-filled draft to the recipient instead.",
  },
});
changes.push({
  createComponentField: {
    parentApiId: "SponsorshipPage",
    apiId: "formFields",
    displayName: "Form Fields",
    componentApiId: "FormField",
    isList: true,
    description:
      "Add, remove, and reorder the inputs on the sponsorship form. Submissions are emailed to the recipient address above.",
  },
});

// -------- submit --------
async function main() {
  const data = await gql<{
    submitBatchChanges: {
      migration: { id: string; status: string; errors: string | null };
    };
  }>(
    `mutation Submit($input: BatchMigrationInput!) {
      submitBatchChanges(data: $input) {
        migration { id status errors }
      }
    }`,
    {
      input: {
        environmentId: ENVIRONMENT_ID,
        name: `cultrepo-add-seo-form-${Date.now()}`,
        changes,
      },
    }
  );
  const m = data.submitBatchChanges.migration;
  console.log(`Migration ${m.id} (${m.status})`);
  if (m.errors) {
    console.error("Errors:", m.errors);
    process.exit(1);
  }
  console.log(`✓ ${changes.length} changes applied.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
