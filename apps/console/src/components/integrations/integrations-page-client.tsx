"use client";

import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Confetti } from "@neoconfetti/react";
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
import { buttonVariants } from "@notra/ui/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { SUBMITTED_CONFETTI_COLORS } from "@/lib/integrations/constants";
import { getIntegrationInitials } from "@/lib/integrations/form";
import {
  formatDashboardConnectionsLabel,
  formatIntegrationDate,
  getStoreStatusBadge,
} from "@/lib/integrations/format";
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
  const statusBadge = getStoreStatusBadge(server);

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
          {server.author ?? "n/a"}
        </TableCell>
        <TableCell onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            {server.storeStatus === "live" ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex">
                      <Switch
                        aria-label={
                          server.enabled
                            ? `Hide ${server.name} from the store`
                            : `Show ${server.name} in the store`
                        }
                        checked={server.enabled}
                        disabled={toggling}
                        onCheckedChange={onToggleEnabled}
                      />
                    </span>
                  }
                />
                <TooltipContent>
                  {server.enabled
                    ? "Shown in the integration store"
                    : "Hidden from the integration store"}
                </TooltipContent>
              </Tooltip>
            ) : null}
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
  const [celebrating, setCelebrating] = useState(false);
  const submittedParamHandledRef = useRef(false);

  useEffect(() => {
    if (submittedParamHandledRef.current) {
      return;
    }
    submittedParamHandledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get("submitted") !== "true") {
      return;
    }
    params.delete("submitted");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`
    );
    setCelebrating(true);
  }, []);

  useHotkey("C", () => router.push(newIntegrationHref));

  const integrationsQuery = useQuery(
    consoleOrpc.integrations.list.queryOptions({
      input: { organizationId },
    })
  );

  const listQueryKey = consoleOrpc.integrations.list.queryKey({
    input: { organizationId },
  });

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const deleteMutation = useMutation({
    mutationFn: (serverId: string) =>
      consoleOrpc.integrations.mcp.delete.call({
        organizationId,
        serverId,
      }),
    onMutate: (serverId) => {
      setDeletingIds((ids) => new Set(ids).add(serverId));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: listQueryKey });
      toast.success("Integration deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: (_result, _error, serverId) => {
      setDeletingIds((ids) => {
        const next = new Set(ids);
        next.delete(serverId);
        return next;
      });
    },
  });

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const toggleMutation = useMutation({
    mutationFn: (input: { serverId: string; enabled: boolean }) =>
      consoleOrpc.integrations.mcp.setEnabled.call({
        organizationId,
        serverId: input.serverId,
        enabled: input.enabled,
      }),
    onMutate: (variables) => {
      setTogglingIds((ids) => new Set(ids).add(variables.serverId));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: (_result, _error, variables) => {
      setTogglingIds((ids) => {
        const next = new Set(ids);
        next.delete(variables.serverId);
        return next;
      });
    },
  });

  const data = integrationsQuery.data;
  const servers = data?.mcpServers ?? [];
  const githubCount = data?.github.length ?? 0;
  const linearCount = data?.linear.length ?? 0;
  const dashboardConnectionCount = githubCount + linearCount;
  const dashboardUrl = `https://app.usenotra.com/${slug}/integrations`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      {celebrating ? (
        <div className="-translate-x-1/2 pointer-events-none fixed top-0 left-1/2 z-50">
          <Confetti
            colors={SUBMITTED_CONFETTI_COLORS}
            duration={4000}
            force={0.6}
            particleCount={200}
            particleShape="mix"
            particleSize={10}
            stageHeight={1000}
            stageWidth={1600}
          />
        </div>
      ) : null}
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
                  deleting={deletingIds.has(server.id)}
                  editHref={`/${slug}/integrations/${server.id}`}
                  key={server.id}
                  onDelete={() => deleteMutation.mutate(server.id)}
                  onToggleEnabled={(enabled) =>
                    toggleMutation.mutate({ serverId: server.id, enabled })
                  }
                  server={server}
                  toggling={togglingIds.has(server.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {dashboardConnectionCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
          <div>
            <p className="font-medium text-sm">
              {formatDashboardConnectionsLabel(githubCount, linearCount)}
            </p>
            <p className="text-muted-foreground text-sm">
              These are managed in the Notra dashboard.
            </p>
          </div>
          <a
            className={buttonVariants({ variant: "outline" })}
            href={dashboardUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open dashboard
          </a>
        </div>
      ) : null}
    </main>
  );
}
