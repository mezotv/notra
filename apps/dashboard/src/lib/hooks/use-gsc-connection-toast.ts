"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { GSC_ERROR_MESSAGES } from "@/lib/integrations/google-search-console/oauth-errors";

const OAUTH_RESULT_PARAMS = ["gscConnected", "error"] as const;

/** Drops only the OAuth result params so page state (filters, tabs) survives. */
function urlWithoutOAuthParams(
  pathname: string,
  searchParams: URLSearchParams
): string {
  const next = new URLSearchParams(searchParams);
  for (const param of OAUTH_RESULT_PARAMS) {
    next.delete(param);
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function useGscConnectionToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const connected = searchParams.get("gscConnected");
    const error = searchParams.get("error");

    if (connected === "true") {
      toast.success("Google Search Console connected", {
        id: "gsc-connected",
      });
    } else if (error && Object.hasOwn(GSC_ERROR_MESSAGES, error)) {
      toast.error(GSC_ERROR_MESSAGES[error], { id: `gsc-error-${error}` });
    } else {
      return;
    }

    // Not a redirect: strips the one-shot OAuth query params from the current
    // URL after the toast has been shown.
    // react-doctor-disable-next-line nextjs-no-client-side-redirect
    router.replace(urlWithoutOAuthParams(pathname, searchParams), {
      scroll: false,
    });
  }, [searchParams, pathname, router]);
}
