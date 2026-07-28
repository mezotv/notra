"use client";

import { AutumnProvider } from "autumn-js/react";
import { useRef } from "react";
import { authClient } from "@/lib/auth/client";
import type { AutumnOrgProviderProps } from "@/types/components/providers";

const INITIAL_PROVIDER_KEY = "initial-organization";
const NO_ORGANIZATION_BASELINE = "no-organization";

export function AutumnOrgProvider({ children }: AutumnOrgProviderProps) {
  const { data: session, isPending } = authClient.useSession();
  const sessionOrganizationId = session?.session.activeOrganizationId ?? null;

  const lastKnownOrganizationIdRef = useRef<string | null>(null);
  const baselineOrganizationIdRef = useRef<string | null>(null);

  if (sessionOrganizationId) {
    lastKnownOrganizationIdRef.current = sessionOrganizationId;
  }

  if (baselineOrganizationIdRef.current === null && !isPending) {
    baselineOrganizationIdRef.current =
      sessionOrganizationId ?? NO_ORGANIZATION_BASELINE;
  }

  const effectiveOrganizationId =
    sessionOrganizationId ?? lastKnownOrganizationIdRef.current;
  const hasSwitchedOrganization =
    effectiveOrganizationId !== null &&
    baselineOrganizationIdRef.current !== null &&
    effectiveOrganizationId !== baselineOrganizationIdRef.current;
  const providerKey = hasSwitchedOrganization
    ? effectiveOrganizationId
    : INITIAL_PROVIDER_KEY;

  return (
    <AutumnProvider includeCredentials key={providerKey}>
      {children}
    </AutumnProvider>
  );
}
