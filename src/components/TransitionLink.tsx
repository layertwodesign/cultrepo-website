"use client";

import { useTransition } from "./PageTransition";

export default function TransitionLink({
  href,
  children,
  className,
  style,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigateTo } = useTransition();

  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        // Let external links pass through
        if (href.startsWith("http") || href.startsWith("mailto:")) return;
        e.preventDefault();
        navigateTo(href);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
