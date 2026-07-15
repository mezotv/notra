"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/button";
import { IntegrationForm } from "@/components/integrations/integration-form";
import { consoleOrpc } from "@/lib/orpc/query";

function LoadingForm() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </main>
  );
}

export function IntegrationEditClient({
  organizationId,
  serverId,
  slug,
}: {
  organizationId: string;
  serverId: string;
  slug: string;
}) {
  const integrationQuery = useQuery(
    consoleOrpc.integrations.mcp.get.queryOptions({
      input: { organizationId, serverId },
    })
  );

  if (integrationQuery.isPending) {
    return <LoadingForm />;
  }

  if (!integrationQuery.data) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center lg:px-6">
        <p className="font-medium">Could not load this integration.</p>
        <Button
          onClick={() => integrationQuery.refetch()}
          size="sm"
          variant="outline"
        >
          Try again
        </Button>
      </main>
    );
  }

  return (
    <IntegrationForm
      key={`${integrationQuery.data.integration.id}:${integrationQuery.data.integration.updatedAt ?? ""}`}
      organizationId={organizationId}
      server={integrationQuery.data.integration}
      slug={slug}
      tools={integrationQuery.data.tools}
    />
  );
}
