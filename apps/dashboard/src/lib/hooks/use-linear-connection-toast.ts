"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function useLinearConnectionToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const connected = searchParams.get("linearConnected");
    const error = searchParams.get("error");

    if (connected === "true") {
      toast.success("Linear workspace connected successfully");
      router.replace(pathname, { scroll: false });
    } else if (error === "workspace_already_connected") {
      toast.error("This Linear workspace is already connected");
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);
}
