"use client";

import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { STORE_STATUS_LABELS } from "@/lib/integrations/constants";
import { getIntegrationInitials } from "@/lib/integrations/form";
import { formatIntegrationDate } from "@/lib/integrations/format";
import { consoleOrpc } from "@/lib/orpc/query";
import type { McpServer } from "@/types/integrations";

function IntegrationLogo({ server }: { server: McpServer }) {
  const lightLogo = server.logoLightUrl ?? server.logoDarkUrl;
  const darkLogo = server.logoDarkUrl ?? server.logoLightUrl;

  if (lightLogo && darkLogo) {
    return (
      <>
        <Image
          alt={`${server.name} logo`}
          className="size-9 shrink-0 rounded-lg border object-cover dark:hidden"
          height={36}
          src={lightLogo}
          width={36}
        />
        <Image
          alt={`${server.name} logo`}
          className="hidden size-9 shrink-0 rounded-lg border object-cover dark:block"
          height={36}
          src={darkLogo}
          width={36}
        />
      </>
    );
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted font-medium text-muted-foreground text-xs">
      {getIntegrationInitials(server.name)}
    </div>
  );
}

function getStatusBadgeVariant(server: McpServer) {
  if (server.storeStatus === "live" && server.enabled) {
    return "default";
  }
  if (server.storeStatus === "rejected") {
    return "destructive";
  }
  return "secondary";
}

function IntegrationRow({
  deleting,
  editHref,
  onDelete,
  onToggleEnabled,
  server,
  toggling,
}: {
  deleting: boolean;
  editHref: string;
  onDelete: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  server: McpServer;
  toggling: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => router.push(editHref)}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <IntegrationLogo server={server} />
            <div className="min-w-0">
              <Link
                className="block truncate font-medium hover:underline"
                href={editHref}
                onClick={(event) => event.stopPropagation()}
              >
                {server.name}
              </Link>
              {server.description ? (
                <p className="max-w-[24rem] truncate text-muted-foreground text-sm">
                  {server.description}
                </p>
              ) : null}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {server.author ?? "—"}
        </TableCell>
        <TableCell onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center gap-2">
            <Switch
              aria-label={`Toggle ${server.name}`}
              checked={server.enabled}
              disabled={toggling}
              onCheckedChange={onToggleEnabled}
            />
            <Badge variant={getStatusBadgeVariant(server)}>
              {STORE_STATUS_LABELS[server.storeStatus]}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatIntegrationDate(server.createdAt)}
        </TableCell>
        <TableCell onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={`Actions for ${server.name}`}
                  size="icon-sm"
                  variant="ghost"
                >
                  <HugeiconsIcon className="size-4" icon={MoreVerticalIcon} />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={editHref} />}>
                <HugeiconsIcon className="size-4" icon={PencilEdit02Icon} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={deleting}
                onClick={() => setConfirmOpen(true)}
                variant="destructive"
              >
                <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <ResponsiveAlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete integration?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This permanently removes &quot;{server.name}&quot; and takes it
              out of the integration store.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={deleting}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              disabled={deleting}
              onClick={() => {
                onDelete();
                setConfirmOpen(false);
              }}
              variant="destructive"
            >
              Delete
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
}

function LoadingTable() {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      {[0, 1, 2].map((item) => (
        <div className="flex items-center gap-3" key={item}>
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function IntegrationsPageClient({
  organizationId,
  slug,
}: {
  organizationId: string;
  slug: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const newIntegrationHref = `/${slug}/integrations/new`;

  useHotkey("C", () => router.push(newIntegrationHref));

  const integrationsQuery = useQuery(
    consoleOrpc.integrations.list.queryOptions({
      input: { organizationId },
    })
  );

  const listQueryKey = consoleOrpc.integrations.list.queryKey({
    input: { organizationId },
  });

  const deleteMutation = useMutation({
    mutationFn: (serverId: string) =>
      consoleOrpc.integrations.mcp.delete.call({
        organizationId,
        serverId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: listQueryKey });
      toast.success("Integration deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (input: { serverId: string; enabled: boolean }) =>
      consoleOrpc.integrations.mcp.setEnabled.call({
        organizationId,
        serverId: input.serverId,
        enabled: input.enabled,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const data = integrationsQuery.data;
  const servers = data?.mcpServers ?? [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            My Integrations
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            MCP servers you&apos;ve registered for the Notra integration store.
          </p>
        </div>
        <Button
          className="gap-1.5"
          nativeButton={false}
          render={<Link href={newIntegrationHref} />}
        >
          <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
          New integration
          <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
        </Button>
      </div>

      {integrationsQuery.isPending ? <LoadingTable /> : null}
      {integrationsQuery.isError ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
          <p>Could not load integrations.</p>
          <Button
            className="mt-3"
            onClick={() => integrationsQuery.refetch()}
            size="sm"
            variant="outline"
          >
            Try again
          </Button>
        </div>
      ) : null}
      {data && servers.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No integrations yet</p>
          <p className="mt-1 text-muted-foreground text-sm">
            Register an MCP server to get it into the integration store.
          </p>
          <Button
            className="mt-4"
            nativeButton={false}
            render={<Link href={newIntegrationHref} />}
            variant="outline"
          >
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            New integration
          </Button>
        </div>
      ) : null}
      {servers.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integration</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.map((server) => (
                <IntegrationRow
                  deleting={
                    deleteMutation.isPending &&
                    deleteMutation.variables === server.id
                  }
                  editHref={`/${slug}/integrations/${server.id}`}
                  key={server.id}
                  onDelete={() => deleteMutation.mutate(server.id)}
                  onToggleEnabled={(enabled) =>
                    toggleMutation.mutate({ serverId: server.id, enabled })
                  }
                  server={server}
                  toggling={
                    toggleMutation.isPending &&
                    toggleMutation.variables?.serverId === server.id
                  }
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </main>
  );
}
