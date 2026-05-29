"use client";

import { CpuIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { MCP_ACCENT_COLOR } from "@/lib/integrations/mcp";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { McpIntegrationCardProps } from "@/types/integrations/mcp";
import { AddMcpServerDialog } from "./add-mcp-server-dialog";

export function McpIntegrationCard({
  organizationId,
  organizationSlug,
}: McpIntegrationCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isPending } = useQuery(
    dashboardOrpc.integrations.mcp.list.queryOptions({
      input: { organizationId },
      enabled: Boolean(organizationId),
    })
  );

  const activeCount = data?.servers.length ?? 0;
  const href = `/${organizationSlug}/integrations/mcp`;

  return (
    <>
      <Link
        className="h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={href}
      >
        <TitleCard
          accentColor={MCP_ACCENT_COLOR}
          action={
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isPending && <Skeleton className="h-5 w-8 rounded-full" />}
              {!isPending && activeCount > 0 && (
                <Badge className="text-xs" variant="default">
                  {activeCount}
                </Badge>
              )}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDialogOpen(true);
                }}
                size="sm"
                variant="outline"
              >
                Connect
              </Button>
            </div>
          }
          className="h-full cursor-pointer transition-colors hover:bg-muted/80"
          heading="MCP"
          icon={<HugeiconsIcon icon={CpuIcon} />}
        >
          <p className="line-clamp-2 text-muted-foreground text-sm">
            Bring your own tools and context into Notra with custom Model
            Context Protocol servers
          </p>
        </TitleCard>
      </Link>
      <AddMcpServerDialog
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        organizationId={organizationId}
      />
    </>
  );
}
