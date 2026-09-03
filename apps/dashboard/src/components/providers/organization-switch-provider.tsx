"use client";

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
import { useActivateOrganization } from "@/lib/hooks/use-activate-organization";
import type {
  OrganizationSwitchOutcome,
  OrganizationSwitchContextValue,
  OrganizationSwitchProviderProps,
  OrganizationSwitchState,
} from "@/types/dashboard";
import { getOrganizationSlugFromPathname } from "@/utils/organization-pathname";
import {
  markOrganizationSwitchStateActivated,
  unblockOrganizationSwitchState,
} from "@/utils/organization-switch-state";

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
  const activateOrganization = useActivateOrganization({
    cancelOrganizationSwitch,
    isOrganizationSwitchCurrent,
    markOrganizationSwitchActivated,
    startOrganizationSwitch,
    unblockOrganizationSwitch,
  });

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
