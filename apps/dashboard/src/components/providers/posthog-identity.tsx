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

    if (userId) {
      if (identifiedUserId && identifiedUserId !== userId) {
        posthog.reset();
      }
      posthog.identify(userId);
      return;
    }

    if (identifiedUserId) {
      posthog.reset();
    }
  }, [isPending, userId]);

  return null;
}
