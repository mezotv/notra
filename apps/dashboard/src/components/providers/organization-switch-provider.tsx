"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ORGANIZATION_SWITCH_RECOVERY_TIMEOUT_MS } from "@/constants/organization";
import { authClient } from "@/lib/auth/client";
import type { ClientSessionData } from "@/types/auth/session";
import type {
  OrganizationActivationResult,
  OrganizationSwitchOutcome,
  OrganizationSwitchContextValue,
  OrganizationSwitchProviderProps,
  OrganizationSwitchState,
} from "@/types/dashboard";
import type { FullOrganization } from "@/types/organizations/actions";
import { serializeOrganizationMutation } from "@/utils/organization-mutation";
import { getOrganizationSlugFromPathname } from "@/utils/organization-pathname";
import {
  markOrganizationSwitchStateActivated,
  unblockOrganizationSwitchState,
} from "@/utils/organization-switch-state";
import { QUERY_KEYS } from "@/utils/query-keys";

const OrganizationSwitchContext =
  createContext<OrganizationSwitchContextValue | null>(null);

const FALLBACK_ORGANIZATION_SWITCH_CONTEXT: OrganizationSwitchContextValue = {
  isOrganizationSwitching: false,
  isOrganizationSwitchUiBlocked: false,
  organizationStateGeneration: 0,
  settledOrganizationId: null,
  settledOrganizationSlug: null,
  settledOrganizationSwitchOutcome: null,
  organizationSwitchId: null,
  organizationSwitchPhase: null,
  organizationSwitchRecoveryReason: null,
  organizationSwitchTargetSlug: null,
  activateOrganization: async () => ({
    message: "Organization switching is unavailable",
    status: "failed",
    switchId: 0,
  }),
  startOrganizationSwitch: () => 0,
  markOrganizationSwitchActivated: () => undefined,
  unblockOrganizationSwitch: () => undefined,
  finishOrganizationSwitch: () => undefined,
  cancelOrganizationSwitch: () => undefined,
  isOrganizationSwitchCurrent: () => false,
  getOrganizationSwitchTargetSlug: () => null,
  markOrganizationPathSettled: () => undefined,
  isOrganizationStateSettled: () => true,
};

export function OrganizationSwitchProvider({
  children,
}: OrganizationSwitchProviderProps) {
  const queryClient = useQueryClient();
  const nextSwitchIdRef = useRef(0);
  const activeSwitchIdRef = useRef<number | null>(null);
  const activeSwitchStateRef = useRef<OrganizationSwitchState | null>(null);
  const targetSlugRef = useRef<string | null>(null);
  const settledOrganizationIdRef = useRef<string | null>(null);
  const settledSlugRef = useRef<string | null>(null);
  const [switchState, setSwitchState] =
    useState<OrganizationSwitchState | null>(null);
  const [settledOrganization, setSettledOrganization] = useState<{
    generation: number;
    id: string | null;
    outcome: OrganizationSwitchOutcome | null;
    slug: string | null;
  }>({ generation: 0, id: null, outcome: null, slug: null });

  const startOrganizationSwitch = useCallback(
    (targetSlug: string, targetOrganizationId: string) => {
      const switchId = nextSwitchIdRef.current + 1;
      nextSwitchIdRef.current = switchId;
      activeSwitchIdRef.current = switchId;
      targetSlugRef.current = targetSlug;
      const nextState: OrganizationSwitchState = {
        id: switchId,
        isUiBlocked: true,
        phase: "activating",
        recoveryReason: null,
        targetOrganizationId,
        targetSlug,
      };
      activeSwitchStateRef.current = nextState;
      setSwitchState(nextState);
      return switchId;
    },
    []
  );
  const markOrganizationSwitchActivated = useCallback((switchId: number) => {
    const currentState = activeSwitchStateRef.current;
    const nextState = markOrganizationSwitchStateActivated(
      currentState,
      switchId
    );
    if (nextState === currentState) {
      return;
    }
    activeSwitchStateRef.current = nextState;
    setSwitchState(nextState);
  }, []);
  const unblockOrganizationSwitch = useCallback(
    (switchId: number, reason?: OrganizationSwitchState["recoveryReason"]) => {
      const currentState = activeSwitchStateRef.current;
      const nextState = unblockOrganizationSwitchState(
        currentState,
        switchId,
        reason
      );
      if (nextState === currentState) {
        return;
      }
      activeSwitchStateRef.current = nextState;
      setSwitchState(nextState);
    },
    []
  );
  const finishOrganizationSwitch = useCallback(
    (switchId: number, outcome: OrganizationSwitchOutcome) => {
      const currentState = activeSwitchStateRef.current;
      if (
        activeSwitchIdRef.current !== switchId ||
        currentState?.id !== switchId
      ) {
        return;
      }
      settledOrganizationIdRef.current = currentState.targetOrganizationId;
      settledSlugRef.current = currentState.targetSlug;
      activeSwitchIdRef.current = null;
      activeSwitchStateRef.current = null;
      targetSlugRef.current = null;
      setSwitchState(null);
      setSettledOrganization((current) => ({
        generation: current.generation + 1,
        id: currentState.targetOrganizationId,
        outcome,
        slug: currentState.targetSlug,
      }));
    },
    []
  );
  const cancelOrganizationSwitch = useCallback((switchId: number) => {
    if (activeSwitchIdRef.current !== switchId) {
      return;
    }
    activeSwitchIdRef.current = null;
    activeSwitchStateRef.current = null;
    targetSlugRef.current = null;
    setSwitchState(null);
  }, []);
  const isOrganizationSwitchCurrent = useCallback(
    (switchId: number) => activeSwitchIdRef.current === switchId,
    []
  );
  const getOrganizationSwitchTargetSlug = useCallback(
    () => targetSlugRef.current,
    []
  );
  const markOrganizationPathSettled = useCallback(
    (slug: string | null, organizationId: string | null) => {
      if (
        activeSwitchIdRef.current !== null ||
        (settledSlugRef.current === slug &&
          settledOrganizationIdRef.current === organizationId)
      ) {
        return;
      }
      settledSlugRef.current = slug;
      settledOrganizationIdRef.current = organizationId;
      setSettledOrganization((current) => ({
        generation: current.generation + 1,
        id: organizationId,
        outcome: null,
        slug,
      }));
    },
    []
  );
  const isOrganizationStateSettled = useCallback(
    (pathname: string, organizationId: string | null) => {
      if (activeSwitchIdRef.current !== null) {
        return false;
      }
      const pathSlug = getOrganizationSlugFromPathname(pathname);
      if (pathSlug !== settledSlugRef.current) {
        return false;
      }
      return (
        pathSlug === null ||
        (organizationId !== null &&
          organizationId === settledOrganizationIdRef.current)
      );
    },
    []
  );

  const activateOrganization = useCallback(
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
          throw new Error("The active organization could not be confirmed");
        }
      } catch (error) {
        if (!isOrganizationSwitchCurrent(switchId)) {
          return { message: null, status: "stale", switchId };
        }
        unblockOrganizationSwitch(switchId, "activation-confirmation-failed");
        return {
          message:
            error instanceof Error
              ? error.message
              : "Failed to refresh organization data",
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

  useEffect(() => {
    const switchId = switchState?.id;
    if (switchId === undefined) {
      return;
    }

    const recoveryTimer = globalThis.setTimeout(() => {
      unblockOrganizationSwitch(switchId);
    }, ORGANIZATION_SWITCH_RECOVERY_TIMEOUT_MS);
    return () => globalThis.clearTimeout(recoveryTimer);
  }, [switchState?.id, switchState?.phase, unblockOrganizationSwitch]);

  const value = useMemo<OrganizationSwitchContextValue>(
    () => ({
      isOrganizationSwitching: switchState !== null,
      isOrganizationSwitchUiBlocked: switchState?.isUiBlocked ?? false,
      organizationStateGeneration: settledOrganization.generation,
      settledOrganizationId: settledOrganization.id,
      settledOrganizationSlug: settledOrganization.slug,
      settledOrganizationSwitchOutcome: settledOrganization.outcome,
      organizationSwitchId: switchState?.id ?? null,
      organizationSwitchPhase: switchState?.phase ?? null,
      organizationSwitchRecoveryReason: switchState?.recoveryReason ?? null,
      organizationSwitchTargetSlug: switchState?.targetSlug ?? null,
      activateOrganization,
      startOrganizationSwitch,
      markOrganizationSwitchActivated,
      unblockOrganizationSwitch,
      finishOrganizationSwitch,
      cancelOrganizationSwitch,
      isOrganizationSwitchCurrent,
      getOrganizationSwitchTargetSlug,
      markOrganizationPathSettled,
      isOrganizationStateSettled,
    }),
    [
      activateOrganization,
      cancelOrganizationSwitch,
      finishOrganizationSwitch,
      getOrganizationSwitchTargetSlug,
      isOrganizationStateSettled,
      isOrganizationSwitchCurrent,
      markOrganizationPathSettled,
      markOrganizationSwitchActivated,
      settledOrganization,
      startOrganizationSwitch,
      switchState,
      unblockOrganizationSwitch,
    ]
  );

  return (
    <OrganizationSwitchContext.Provider value={value}>
      {children}
    </OrganizationSwitchContext.Provider>
  );
}

export function useOrganizationSwitch(): OrganizationSwitchContextValue {
  return (
    useContext(OrganizationSwitchContext) ??
    FALLBACK_ORGANIZATION_SWITCH_CONTEXT
  );
}
