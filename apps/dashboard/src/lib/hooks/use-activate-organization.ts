"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { authClient } from "@/lib/auth/client";
import type { ClientSessionData } from "@/types/auth/session";
import type {
  OrganizationActivationResult,
  OrganizationSwitchContextValue,
} from "@/types/dashboard";
import type { FullOrganization } from "@/types/organizations/actions";
import { serializeOrganizationMutation } from "@/utils/organization-mutation";
import { QUERY_KEYS } from "@/utils/query-keys";

export function useActivateOrganization({
  cancelOrganizationSwitch,
  isOrganizationSwitchCurrent,
  markOrganizationSwitchActivated,
  startOrganizationSwitch,
  unblockOrganizationSwitch,
}: Pick<
  OrganizationSwitchContextValue,
  | "cancelOrganizationSwitch"
  | "isOrganizationSwitchCurrent"
  | "markOrganizationSwitchActivated"
  | "startOrganizationSwitch"
  | "unblockOrganizationSwitch"
>) {
  const queryClient = useQueryClient();

  // react-doctor-disable-next-line react-compiler-no-manual-memoization -- exported through a context action
  return useCallback(
    async (
      targetSlug: string,
      targetOrganizationId: string
    ): Promise<OrganizationActivationResult> => {
      const switchId = startOrganizationSwitch(
        targetSlug,
        targetOrganizationId
      );

      let result: Awaited<ReturnType<typeof authClient.organization.setActive>>;
      try {
        const queuedResult = await serializeOrganizationMutation(() => {
          if (!isOrganizationSwitchCurrent(switchId)) {
            return Promise.resolve(null);
          }
          return authClient.organization.setActive({
            organizationId: targetOrganizationId,
          });
        });
        if (!queuedResult) {
          return { message: null, status: "stale", switchId };
        }
        result = queuedResult;
      } catch (error) {
        if (!isOrganizationSwitchCurrent(switchId)) {
          return { message: null, status: "stale", switchId };
        }
        cancelOrganizationSwitch(switchId);
        return {
          message:
            error instanceof Error
              ? error.message
              : "Failed to switch organization",
          status: "failed",
          switchId,
        };
      }

      if (!isOrganizationSwitchCurrent(switchId)) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.AUTH.activeOrganization,
        });
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.AUTH.session,
        });
        return { message: null, status: "stale", switchId };
      }

      if (result.error) {
        cancelOrganizationSwitch(switchId);
        return {
          message: result.error.message,
          status: "failed",
          switchId,
        };
      }

      void queryClient.invalidateQueries({ refetchType: "none" });
      let confirmationFailure: string | null = null;
      try {
        await Promise.all([
          queryClient.refetchQueries(
            {
              queryKey: QUERY_KEYS.AUTH.activeOrganization,
              type: "active",
            },
            { throwOnError: true }
          ),
          queryClient.refetchQueries(
            { queryKey: QUERY_KEYS.AUTH.session, type: "active" },
            { throwOnError: true }
          ),
        ]);

        const confirmedOrganization =
          queryClient.getQueryData<FullOrganization | null>(
            QUERY_KEYS.AUTH.activeOrganization
          );
        const confirmedSession =
          queryClient.getQueryData<ClientSessionData | null>(
            QUERY_KEYS.AUTH.session
          );
        if (
          confirmedOrganization?.id !== targetOrganizationId ||
          confirmedSession?.session.activeOrganizationId !==
            targetOrganizationId
        ) {
          confirmationFailure =
            "The active organization could not be confirmed";
        }
      } catch (error) {
        confirmationFailure =
          error instanceof Error
            ? error.message
            : "Failed to refresh organization data";
      }

      if (confirmationFailure !== null) {
        if (!isOrganizationSwitchCurrent(switchId)) {
          return { message: null, status: "stale", switchId };
        }
        unblockOrganizationSwitch(switchId, "activation-confirmation-failed");
        return {
          message: confirmationFailure,
          status: "confirmation-failed",
          switchId,
        };
      }

      if (!isOrganizationSwitchCurrent(switchId)) {
        return { message: null, status: "stale", switchId };
      }
      markOrganizationSwitchActivated(switchId);
      return { message: null, status: "activated", switchId };
    },
    [
      cancelOrganizationSwitch,
      isOrganizationSwitchCurrent,
      markOrganizationSwitchActivated,
      queryClient,
      startOrganizationSwitch,
      unblockOrganizationSwitch,
    ]
  );
}
