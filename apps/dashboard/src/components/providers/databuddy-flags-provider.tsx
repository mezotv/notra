"use client";

import { FlagsProvider } from "@databuddy/sdk/react";
import type { ReactNode } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { authClient } from "@/lib/auth/client";

const databuddyClientId =
  process.env.NEXT_PUBLIC_DATABUDDY_DASHBOARD_WEBSITE_ID ?? "";

export function DatabuddyFlagsProvider({ children }: { children: ReactNode }) {
  const { activeOrganization } = useOrganizationsContext();
  const { data: session, isPending } = authClient.useSession();

  return (
    <FlagsProvider
      cacheTtl={5 * 60 * 1000}
      clientId={databuddyClientId}
      disabled={!databuddyClientId}
      isPending={isPending}
      skipStorage
      staleTime={5 * 60 * 1000}
      user={
        session?.user
          ? {
              userId: session.user.id,
              email: session.user.email,
              organizationId: activeOrganization?.id,
              properties: activeOrganization?.id
                ? { organizationId: activeOrganization.id }
                : undefined,
            }
          : undefined
      }
    >
      {children}
    </FlagsProvider>
  );
}
