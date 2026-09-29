/** Keep the public homepage and its internal ISR route identical in shared UI. */
export function sitePath(pathname: string): string {
  return pathname === "/index" ? "/" : pathname;
}
