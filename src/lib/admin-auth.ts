/**
 * Admin auth helpers — runs in Edge or Node.
 *
 * Storage: a single httpOnly cookie `cr_admin` whose value is the SHA-256
 * hash of the ADMIN_PASSWORD env var. Server compares the cookie value
 * against the same hash on every request. The cookie value is unguessable
 * without the password and we never store the plaintext.
 *
 * "Good enough" for a single-tenant client deliverable — same model as
 * Vercel Password Protection. Not a substitute for real auth (sessions,
 * rotation, MFA) when those matter.
 */

export const ADMIN_COOKIE = "cr_admin";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedCookie(): Promise<string | null> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return sha256Hex(pw);
}

export async function isPasswordValid(provided: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = await sha256Hex(provided);
  const b = await sha256Hex(pw);
  return constantTimeEqual(a, b);
}

export async function isCookieValid(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await expectedCookie();
  if (!expected) return false;
  return constantTimeEqual(cookieValue, expected);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
