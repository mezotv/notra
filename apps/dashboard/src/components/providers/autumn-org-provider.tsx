"use client";

import { AutumnProvider } from "autumn-js/react";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import type { AutumnOrgProviderProps } from "@/types/components/providers";

const INITIAL_PROVIDER_KEY = "initial-organization";
const NO_ORGANIZATION_BASELINE = "no-organization";

export function AutumnOrgProvider({ children }: AutumnOrgProviderProps) {
  const { data: session, isPending } = authClient.useSession();
  const sessionOrganizationId = session?.session.activeOrganizationId ?? null;

  const [lastKnownOrganizationId, setLastKnownOrganizationId] = useState<
    string | null
  >(null);
  const [baselineOrganizationId, setBaselineOrganizationId] = useState<
    string | null
  >(null);

  if (
    sessionOrganizationId &&
    sessionOrganizationId !== lastKnownOrganizationId
  ) {
    setLastKnownOrganizationId(sessionOrganizationId);
  }

  if (baselineOrganizationId === null && !isPending) {
    setBaselineOrganizationId(
      sessionOrganizationId ?? NO_ORGANIZATION_BASELINE
    );
  }

  const effectiveOrganizationId =
    sessionOrganizationId ?? lastKnownOrganizationId;
  const hasSwitchedOrganization =
    effectiveOrganizationId !== null &&
    baselineOrganizationId !== null &&
    effectiveOrganizationId !== baselineOrganizationId;
  const providerKey = hasSwitchedOrganization
    ? effectiveOrganizationId
    : INITIAL_PROVIDER_KEY;

  return (
    <AutumnProvider includeCredentials key={providerKey}>
      {children}
    </AutumnProvider>
  );
}
