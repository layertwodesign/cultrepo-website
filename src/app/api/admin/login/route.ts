import { NextResponse } from "next/server";
import { ADMIN_COOKIE, expectedCookie, isPasswordValid } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const from = String(form.get("from") ?? "/admin");

  if (!(await isPasswordValid(password))) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("error", "1");
    if (from && from !== "/admin") url.searchParams.set("from", from);
    return NextResponse.redirect(url, 303);
  }

  const target = from.startsWith("/admin") ? from : "/admin";
  const res = NextResponse.redirect(new URL(target, req.url), 303);
  const value = await expectedCookie();
  if (value) {
    res.cookies.set({
      name: ADMIN_COOKIE,
      value,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  return res;
}
