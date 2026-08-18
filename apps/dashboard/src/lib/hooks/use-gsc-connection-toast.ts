"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const GSC_ERROR_MESSAGES: Record<string, string> = {
  gsc_not_configured:
    "Google Search Console is not available on this workspace yet.",
  gsc_access_denied: "Google access was denied. Nothing was connected.",
  gsc_missing_refresh_token:
    "Google did not grant offline access. Please try connecting again.",
  gsc_token_exchange_failed: "Google sign-in failed. Please try again.",
  gsc_auth_failed: "Failed to connect Google Search Console.",
  gsc_expired_state: "The connection request expired. Please try again.",
  gsc_session_mismatch: "Please sign in again before connecting.",
  gsc_rate_limited: "Too many connection attempts. Please wait a moment.",
  gsc_session_expired: "Your session expired. Sign in and try again.",
  gsc_forbidden: "You do not have access to this organization.",
  gsc_invalid_callback:
    "Google returned an invalid response. Please try again.",
};

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
      router.replace(pathname, { scroll: false });
      return;
    }
    if (error && Object.hasOwn(GSC_ERROR_MESSAGES, error)) {
      toast.error(GSC_ERROR_MESSAGES[error], { id: `gsc-error-${error}` });
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);
}
