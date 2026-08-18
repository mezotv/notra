"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { GSC_ERROR_MESSAGES } from "@/constants/google-search-console";

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
