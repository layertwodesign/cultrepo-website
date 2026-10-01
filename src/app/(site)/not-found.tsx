import type { Metadata } from "next";
import NotFoundGhost from "@/components/NotFoundGhost";

export const metadata: Metadata = {
  title: "Page not found",
};

// notFound() inside (site), e.g. an unknown film slug. The (site) layout
// already supplies the chrome; unmatched URLs fall through to app/not-found.
export default function NotFound() {
  return <NotFoundGhost />;
}
