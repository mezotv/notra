"use client";

import { POSTHOG_GROUP_TYPES } from "@notra/posthog/constants/posthog";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useOrganizationSwitch } from "@/components/providers/organization-switch-provider";
import { POSTHOG_PROJECT_TOKEN } from "@/constants/posthog";
import {
  enqueuePostHogStateOperation,
  trackPostHogPageView,
} from "@/lib/analytics/posthog-client";
import { authClient } from "@/lib/auth/client";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";

export function PostHogIdentity() {
  const { data: session, isPending } = authClient.useSession();
  const {
    isOrganizationStateSettled,
    isOrganizationSwitching,
    organizationStateGeneration,
  } = useOrganizationSwitch();
  const [projectQuery] = useGeoProjectQueryState();
  const userId = session?.user.id;
  const organizationId = session?.session.activeOrganizationId ?? null;
  const projectId = projectQuery ?? null;
  const hidePersonalData = session?.user.hidePersonalData ?? true;
  const email = session?.user.email;
  const name = session?.user.name;
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if (!POSTHOG_PROJECT_TOKEN || isPending) {
      return;
    }

    enqueuePostHogStateOperation("identity", (posthog) => {
      const identifiedUserId = posthog.get_property("$user_id");

      if (!userId) {
        if (identifiedUserId) {
          posthog.reset();
        }
        return;
      }

      if (identifiedUserId && identifiedUserId !== userId) {
        posthog.reset();
      }

      posthog.identify(
        userId,
        hidePersonalData ? undefined : { email, name: name ?? undefined }
      );
    });
  }, [email, hidePersonalData, isPending, name, userId]);

  useEffect(() => {
    if (
      !POSTHOG_PROJECT_TOKEN ||
      isPending ||
      isOrganizationSwitching ||
      !isOrganizationStateSettled(pathname, organizationId)
    ) {
      return;
    }

    enqueuePostHogStateOperation("groups", (posthog) => {
      posthog.resetGroups();

      if (!userId) {
        posthog.unregister("organization_id");
        posthog.unregister("project_id");
        return;
      }

      if (organizationId) {
        posthog.group(POSTHOG_GROUP_TYPES.ORGANIZATION, organizationId);
        posthog.register({ organization_id: organizationId });
      } else {
        posthog.unregister("organization_id");
      }

      if (projectId) {
        posthog.group(POSTHOG_GROUP_TYPES.PROJECT, projectId);
        posthog.register({ project_id: projectId });
      } else {
        posthog.unregister("project_id");
      }
    });
  }, [
    isOrganizationStateSettled,
    isOrganizationSwitching,
    isPending,
    organizationId,
    organizationStateGeneration,
    pathname,
    projectId,
    userId,
  ]);

  useEffect(() => {
    if (
      isPending ||
      isOrganizationSwitching ||
      !isOrganizationStateSettled(pathname, organizationId)
    ) {
      return;
    }
    trackPostHogPageView(window.location.href);
  }, [
    isOrganizationStateSettled,
    isOrganizationSwitching,
    isPending,
    organizationId,
    organizationStateGeneration,
    pathname,
    search,
  ]);

  return null;
}
