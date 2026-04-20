"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useRouter, usePathname } from "next/navigation";

type TransitionState = "idle" | "exiting" | "entering";

const TransitionContext = createContext<{
  navigateTo: (href: string) => void;
}>({
  navigateTo: () => {},
});

export function useTransition() {
  return useContext(TransitionContext);
}

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<TransitionState>("idle");
  const pendingHref = useRef<string | null>(null);
  const prevPathname = useRef(pathname);

  const navigateTo = useCallback(
    (href: string) => {
      if (href === pathname) return;
      pendingHref.current = href;
      setState("exiting");

      // After exit animation, navigate
      setTimeout(() => {
        router.push(href);
      }, 500);
    },
    [pathname, router]
  );

  // Detect when pathname changes (navigation completed) → play enter animation
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setState("entering");
      // Scroll to top on new page
      window.scrollTo(0, 0);
      setTimeout(() => {
        setState("idle");
      }, 500);
    }
  }, [pathname]);

  return (
    <TransitionContext.Provider value={{ navigateTo }}>
      {children}
      {/* Transition overlay */}
      <div
        className={`page-transition ${state}`}
        aria-hidden="true"
      >
        <img src="/ghost.png" alt="" className="page-transition-ghost" />
      </div>
    </TransitionContext.Provider>
  );
}
