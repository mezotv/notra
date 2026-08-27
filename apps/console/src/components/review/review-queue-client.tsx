"use client";

import {
  ArrowDown01Icon,
  Cancel01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { getMcpFaviconUrl } from "@/lib/integrations/chat-preview";
import { getIntegrationInitials } from "@/lib/integrations/form";
import {
  formatIntegrationDate,
  getAuthTypeLabel,
} from "@/lib/integrations/format";
import { consoleOrpc } from "@/lib/orpc/query";
import type {
  PendingReviewIntegration,
  PendingToolListProps,
} from "@/types/integrations";

const COLLAPSED_TOOL_COUNT = 5;

function ReviewIntegrationLogo({
  integration,
}: {
  integration: PendingReviewIntegration;
}) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const lightLogo = integration.logoLightUrl ?? integration.logoDarkUrl;
  const darkLogo = integration.logoDarkUrl ?? integration.logoLightUrl;

  if (lightLogo && darkLogo) {
    return (
      <>
        <Image
          alt={`${integration.name} logo`}
          className="size-10 shrink-0 rounded-lg border object-cover dark:hidden"
          height={40}
          src={lightLogo}
          width={40}
        />
        <Image
          alt={`${integration.name} logo`}
          className="hidden size-10 shrink-0 rounded-lg border object-cover dark:block"
          height={40}
          src={darkLogo}
          width={40}
        />
      </>
    );
  }

  const faviconUrl = getMcpFaviconUrl(integration.url);
  if (faviconUrl && !faviconFailed) {
    return (
      <Image
        alt={`${integration.name} logo`}
        className="bg-muted size-10 shrink-0 rounded-lg border object-contain p-1.5"
        height={40}
        onError={() => setFaviconFailed(true)}
        src={faviconUrl}
        unoptimized
        width={40}
      />
    );
  }

  return (
    <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border text-xs font-medium">
      {getIntegrationInitials(integration.name)}
    </div>
  );
}

function PendingToolList({ tools }: PendingToolListProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleTools = expanded ? tools : tools.slice(0, COLLAPSED_TOOL_COUNT);
  const hiddenCount = tools.length - visibleTools.length;

  if (tools.length === 0) {
    return (
      <p className="text-muted-foreground px-4 py-3 text-sm">
        No tools indexed yet.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {visibleTools.map((tool) => (
        <div className="grid min-w-0 gap-1 px-4 py-2.5" key={tool.id}>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <code className="bg-muted w-fit max-w-full truncate rounded-md px-1.5 py-0.5 font-mono text-xs">
              {tool.serverToolName}
            </code>
            {tool.actionPhrasePresent || tool.actionPhrasePast ? (
              <span className="text-muted-foreground min-w-0 truncate text-xs">
                {tool.actionPhrasePresent || "Running tool"} →{" "}
                {tool.actionPhrasePast || "Ran tool"}
              </span>
            ) : (
              <span className="text-muted-foreground/60 text-xs italic">
                No action phrases set
              </span>
            )}
          </div>
          {tool.description ? (
            <p className="text-muted-foreground/70 line-clamp-1 text-xs break-all">
              {tool.description}
            </p>
          ) : null}
        </div>
      ))}
      {hiddenCount > 0 ? (
        <button
          className="text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center gap-1.5 px-4 py-2.5 text-xs transition-colors"
          onClick={() => setExpanded(true)}
          type="button"
        >
          <HugeiconsIcon className="size-3.5" icon={ArrowDown01Icon} />
          Show {hiddenCount} more {hiddenCount === 1 ? "tool" : "tools"}
        </button>
      ) : null}
    </div>
  );
}

function PendingIntegrationCard({
  deciding,
  integration,
  onApprove,
  onReject,
}: {
  deciding: boolean;
  integration: PendingReviewIntegration;
  onApprove: () => void;
  onReject: (note: string) => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ReviewIntegrationLogo integration={integration} />
            <div className="min-w-0">
              <p className="truncate font-medium">{integration.name}</p>
              <p className="text-muted-foreground truncate text-sm">
                {integration.author ?? integration.organization.name} ·
                submitted {formatIntegrationDate(integration.submittedAt)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge className="font-normal" variant="outline">
              {getAuthTypeLabel(integration.authType)}
            </Badge>
            <Badge variant="secondary">
              {integration.tools.length}{" "}
              {integration.tools.length === 1 ? "tool" : "tools"}
            </Badge>
          </div>
        </div>

        {integration.description ? (
          <p className="text-muted-foreground text-sm">
            {integration.description}
          </p>
        ) : null}

        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <code className="bg-muted min-w-0 rounded-md px-2 py-1 font-mono break-all">
            {integration.url}
          </code>
          <span className="truncate">
            by {integration.createdByUser.name} (
            {integration.createdByUser.email})
          </span>
        </div>
      </div>

      <div className="border-t">
        <p className="text-muted-foreground/70 px-4 pt-3 text-[0.65rem] font-medium tracking-wider uppercase">
          Tools
        </p>
        <PendingToolList tools={integration.tools} />
      </div>

      <div className="bg-muted/30 flex justify-end gap-2 border-t px-4 py-3">
        <Button
          disabled={deciding}
          onClick={() => setRejectOpen(true)}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
          Reject
        </Button>
        <Button disabled={deciding} onClick={onApprove} size="sm">
          {deciding ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <HugeiconsIcon className="size-4" icon={Tick02Icon} />
          )}
          Approve
        </Button>
      </div>

      <ResponsiveDialog
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            setNote("");
          }
        }}
        open={rejectOpen}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              Reject {integration.name}?
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              The publisher sees this note and can resubmit after fixing it.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Textarea
            onChange={(event) => setNote(event.target.value)}
            placeholder="What needs to change before this can go live?"
            value={note}
          />
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              render={
                <Button disabled={deciding} type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button
              disabled={deciding || !note.trim()}
              onClick={() => {
                onReject(note.trim());
                setRejectOpen(false);
                setNote("");
              }}
              variant="destructive"
            >
              Reject
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}

export function ReviewQueueClient() {
  const queryClient = useQueryClient();
  const pendingQuery = useQuery(consoleOrpc.review.list.queryOptions({}));
  const [decidingIds, setDecidingIds] = useState<Set<string>>(new Set());

  const decideMutation = useMutation({
    mutationFn: (input: {
      serverId: string;
      action: "approve" | "reject";
      note?: string;
      submittedAt: string | null;
    }) => consoleOrpc.review.decide.call(input),
    onMutate: (variables) => {
      setDecidingIds((ids) => new Set(ids).add(variables.serverId));
    },
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: consoleOrpc.review.list.queryKey({}),
      });
      toast.success(
        variables.action === "approve"
          ? "Integration approved. It's live in the store."
          : "Integration rejected"
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: (_result, _error, variables) => {
      setDecidingIds((ids) => {
        const next = new Set(ids);
        next.delete(variables.serverId);
        return next;
      });
    },
  });

  const pending = pendingQuery.data ?? [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Integrations waiting for approval before they appear in the store.
        </p>
      </div>

      {pendingQuery.isPending ? (
        <div className="grid gap-4">
          {[0, 1].map((item) => (
            <Skeleton className="h-36 w-full rounded-xl" key={item} />
          ))}
        </div>
      ) : null}

      {pendingQuery.isError && pending.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <span>This list may be out of date. The last refresh failed.</span>
          <Button
            onClick={() => pendingQuery.refetch()}
            size="sm"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : null}

      {pendingQuery.isError && pending.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          <p>Could not load the review queue.</p>
          <Button
            className="mt-3"
            onClick={() => pendingQuery.refetch()}
            size="sm"
            variant="outline"
          >
            Try again
          </Button>
        </div>
      ) : null}

      {pendingQuery.data && !pendingQuery.isError && pending.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          Nothing waiting for review.
        </div>
      ) : null}

      {pending.map((integration) => (
        <PendingIntegrationCard
          deciding={decidingIds.has(integration.id)}
          integration={integration}
          key={integration.id}
          onApprove={() =>
            decideMutation.mutate({
              serverId: integration.id,
              action: "approve",
              submittedAt: integration.submittedAt,
            })
          }
          onReject={(note) =>
            decideMutation.mutate({
              serverId: integration.id,
              action: "reject",
              note,
              submittedAt: integration.submittedAt,
            })
          }
        />
      ))}
    </main>
  );
}
