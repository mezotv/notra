"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@notra/ui/components/ui/alert-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Github,
  PanelsTopLeft,
  Server,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { consoleOrpc } from "@/lib/orpc/query";
import { AddMcpServerDialog } from "./add-mcp-server-dialog";

interface McpServer {
  id: string;
  name: string;
  url: string;
  description: string | null;
  authType: "none" | "headers" | "oauth";
  enabled: boolean;
  indexedToolCount: number;
}

function formatAuthType(authType: string) {
  if (authType === "none") {
    return "No auth";
  }
  if (authType === "oauth") {
    return "OAuth";
  }
  return "Headers";
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
      {children}
    </div>
  );
}

function McpServerCard({
  deleting,
  onDelete,
  server,
}: {
  deleting: boolean;
  onDelete: (serverId: string) => void;
  server: McpServer;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Server className="size-5" />
          </div>
          <CardTitle>{server.name}</CardTitle>
          <CardDescription className="truncate font-mono text-xs">
            {server.url}
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Badge variant={server.enabled ? "default" : "secondary"}>
              {server.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Button
              aria-label={`Delete ${server.name}`}
              disabled={deleting}
              onClick={() => setConfirmOpen(true)}
              size="icon-sm"
              variant="ghost"
            >
              <Trash2 />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          {server.description ? (
            <p className="line-clamp-2 text-muted-foreground text-sm">
              {server.description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{formatAuthType(server.authType)}</Badge>
            <Badge variant="secondary">
              {server.indexedToolCount}{" "}
              {server.indexedToolCount === 1 ? "tool" : "tools"}
            </Badge>
          </div>
        </CardContent>
      </Card>
      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MCP server?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes &quot;{server.name}&quot; from this
              organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={() => {
                onDelete(server.id);
                setConfirmOpen(false);
              }}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardHeader>
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function IntegrationsPageClient({
  organizationId,
  organizationName,
  organizationSlug,
}: {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
}) {
  const queryClient = useQueryClient();
  const [deletingServerId, setDeletingServerId] = useState<string | null>(null);
  const integrationsQuery = useQuery(
    consoleOrpc.integrations.list.queryOptions({
      input: { organizationId },
    })
  );

  const deleteMutation = useMutation({
    mutationFn: (serverId: string) => {
      setDeletingServerId(serverId);
      return consoleOrpc.integrations.mcp.delete.call({
        organizationId,
        serverId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: consoleOrpc.integrations.list.queryKey({
          input: { organizationId },
        }),
      });
      toast.success("MCP server deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setDeletingServerId(null);
    },
  });

  const data = integrationsQuery.data;
  const dashboardUrl = `https://app.usenotra.com/${organizationSlug}/integrations`;
  const connectedCount =
    (data?.github.length ?? 0) + (data?.linear.length ?? 0);

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Manage connections for {organizationName}.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-xl">MCP servers</h2>
            <p className="text-muted-foreground text-sm">
              Add custom MCP servers without a subscription.
            </p>
          </div>
          <AddMcpServerDialog organizationId={organizationId} />
        </div>

        {integrationsQuery.isPending ? <LoadingCards /> : null}
        {integrationsQuery.isError ? (
          <EmptyState>
            <p>Could not load integrations.</p>
            <Button
              className="mt-3"
              onClick={() => integrationsQuery.refetch()}
              size="sm"
              variant="outline"
            >
              Try again
            </Button>
          </EmptyState>
        ) : null}
        {data && data.mcpServers.length === 0 ? (
          <EmptyState>No MCP servers have been added yet.</EmptyState>
        ) : null}
        {data && data.mcpServers.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {data.mcpServers.map((server) => (
              <McpServerCard
                deleting={deletingServerId === server.id}
                key={server.id}
                onDelete={(serverId) => deleteMutation.mutate(serverId)}
                server={server}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-xl">Connected via dashboard</h2>
            <p className="text-muted-foreground text-sm">
              GitHub and Linear connections are read-only in the console.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={
              <a href={dashboardUrl} rel="noopener noreferrer" target="_blank">
                Manage in the Notra dashboard
                <ExternalLink />
              </a>
            }
            variant="outline"
          />
        </div>

        {integrationsQuery.isPending ? <LoadingCards /> : null}
        {data && connectedCount === 0 ? (
          <EmptyState>
            No GitHub or Linear integrations are connected. Add them from the
            Notra dashboard.
          </EmptyState>
        ) : null}
        {data && connectedCount > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {data.github.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Github className="size-5" />
                  </div>
                  <CardTitle>{integration.displayName}</CardTitle>
                  <CardDescription>GitHub</CardDescription>
                  <CardAction>
                    <Badge
                      variant={integration.enabled ? "default" : "secondary"}
                    >
                      {integration.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {integration.repositories
                      .map(
                        (repository) => `${repository.owner}/${repository.repo}`
                      )
                      .join(", ")}
                  </p>
                </CardContent>
              </Card>
            ))}
            {data.linear.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted">
                    <PanelsTopLeft className="size-5" />
                  </div>
                  <CardTitle>{integration.displayName}</CardTitle>
                  <CardDescription>Linear</CardDescription>
                  <CardAction>
                    <Badge
                      variant={integration.enabled ? "default" : "secondary"}
                    >
                      {integration.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </CardAction>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
