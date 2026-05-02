import { NextResponse } from "next/server";

const WEBFLOW_SITE_ID = "67d4362770e6281fac20e0f6";
const WEBFLOW_PAGE_ID = "67d4362770e6281fac20e101";
const WEBFLOW_ELEMENT_ID = "7d3152c1-a659-ef01-abc8-698e31d21c3d";
const WEBFLOW_FORM_NAME = "email-form";
const WEBFLOW_FIELD_NAME = "email-newsletter";

export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const params = new URLSearchParams();
  params.set("name", WEBFLOW_FORM_NAME);
  params.set("pageId", WEBFLOW_PAGE_ID);
  params.set("elementId", WEBFLOW_ELEMENT_ID);
  params.set(`fields[${WEBFLOW_FIELD_NAME}]`, email);
  params.set("source", "https://cultrepo.com/");

  const res = await fetch(`https://webflow.com/api/v1/form/${WEBFLOW_SITE_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/plain, */*",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: "Subscription failed" },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true });
}
