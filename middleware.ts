import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isCookieValid } from "@/lib/admin-auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  // /admin/login is the gate — never block it
  if (req.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (await isCookieValid(cookie)) return NextResponse.next();

  const login = new URL("/admin/login", req.url);
  login.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(login);
}
