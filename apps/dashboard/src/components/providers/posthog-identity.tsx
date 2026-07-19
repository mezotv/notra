"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { POSTHOG_PROJECT_TOKEN } from "@/constants/posthog";
import { authClient } from "@/lib/auth/client";

export function PostHogIdentity() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;

  useEffect(() => {
    if (!POSTHOG_PROJECT_TOKEN || isPending) {
      return;
    }

    const identifiedUserId = posthog.get_property("$user_id");

    if (!userId) {
      if (typeof identifiedUserId === "string") {
        posthog.reset();
      }
      return;
    }

    if (identifiedUserId === userId) {
      return;
    }

    if (typeof identifiedUserId === "string") {
      posthog.reset();
    }
    posthog.identify(userId);
  }, [isPending, userId]);

  return null;
}
