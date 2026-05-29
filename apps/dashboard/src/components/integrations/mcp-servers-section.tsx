"use client";

import { CpuIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@notra/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { McpServersSectionProps } from "@/types/integrations/mcp";
import { AddMcpServerDialog } from "./add-mcp-server-dialog";
import { McpServerCard } from "./mcp-server-card";

export function McpServersSection({
  className,
  organizationId,
}: McpServersSectionProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const queryInput = { organizationId };

  const { data, error, isError, isPending } = useQuery(
    dashboardOrpc.integrations.mcp.list.queryOptions({
      input: queryInput,
      enabled: Boolean(organizationId),
    })
  );

  const servers = data?.servers ?? [];

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) =>
      dashboardOrpc.integrations.mcp.update.call({
        organizationId,
        serverId: id,
        enabled,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.mcp.list.queryKey({
          input: queryInput,
        }),
      });
      toast.success(
        variables.enabled ? "MCP server enabled" : "MCP server disabled"
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      dashboardOrpc.integrations.mcp.delete.call({
        organizationId,
        serverId: id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.mcp.list.queryKey({
          input: queryInput,
        }),
      });
      toast.success("MCP server deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <section className={cn(className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg">Custom MCP Servers</h2>
          <p className="text-muted-foreground text-sm">
            Add your own Model Context Protocol servers to bring custom tools
            and context into Notra
          </p>
        </div>
        <Button
          className="shrink-0"
          onClick={() => setDialogOpen(true)}
          size="sm"
        >
          <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
          Add Server
        </Button>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
          {error.message || "Could not load MCP servers"}
        </div>
      ) : null}

      {!isPending && !isError && servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/80 border-dashed bg-muted/40 px-6 py-12 text-center">
          <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <HugeiconsIcon className="size-5" icon={CpuIcon} />
          </span>
          <p className="font-medium text-sm">No custom servers yet</p>
          <p className="mt-1 max-w-sm text-muted-foreground text-sm">
            Connect a custom MCP server to extend Notra with tools and data from
            your own systems.
          </p>
          <Button
            className="mt-4"
            onClick={() => setDialogOpen(true)}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Add MCP Server
          </Button>
        </div>
      ) : null}

      {servers.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {servers.map((server) => (
            <McpServerCard
              key={server.id}
              onDelete={(id) => deleteMutation.mutate(id)}
              onToggle={(id, enabled) => toggleMutation.mutate({ id, enabled })}
              server={server}
            />
          ))}
        </div>
      ) : null}

      <AddMcpServerDialog
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: dashboardOrpc.integrations.mcp.list.queryKey({
              input: queryInput,
            }),
          });
        }}
        open={dialogOpen}
        organizationId={organizationId}
      />
    </section>
  );
}
