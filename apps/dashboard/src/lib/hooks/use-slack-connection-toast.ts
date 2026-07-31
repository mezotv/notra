"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function useSlackConnectionToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const connected = searchParams.get("slackConnected");
    const error = searchParams.get("error");

    if (connected === "true") {
      toast.success("Slack workspace connected successfully");
      router.replace(pathname, { scroll: false });
    } else if (error === "workspace_already_connected") {
      toast.error("This Slack workspace is already connected");
      router.replace(pathname, { scroll: false });
    } else if (error === "workspace_connected_elsewhere") {
      toast.error(
        "This Slack workspace is already connected to another organization"
      );
      router.replace(pathname, { scroll: false });
    } else if (error === "slack_not_configured") {
      toast.error(
        "Slack OAuth is not configured. Set SLACK_AGENT_CLIENT_ID and SLACK_AGENT_CLIENT_SECRET."
      );
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);
}
