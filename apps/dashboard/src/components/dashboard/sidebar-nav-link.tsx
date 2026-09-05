"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Sidebar destinations stay in the viewport (both GEO and Studio panels stay
 * mounted for the mode swoosh). Default Next.js prefetch would compile and
 * fetch every route on first paint. Prefetch only after the user aims at a
 * link.
 */
export function SidebarNavLink({
  href,
  onFocus,
  onMouseEnter,
  ...props
}: Omit<ComponentProps<typeof Link>, "prefetch">) {
  const router = useRouter();

  function prefetchRoute() {
    if (typeof href === "string") {
      router.prefetch(href);
    }
  }

  return (
    <Link
      {...props}
      href={href}
      onFocus={(event) => {
        prefetchRoute();
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        prefetchRoute();
        onMouseEnter?.(event);
      }}
      prefetch={false}
    />
  );
}
