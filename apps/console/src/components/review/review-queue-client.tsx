"use client";

import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
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
import { getIntegrationInitials } from "@/lib/integrations/form";
import { formatIntegrationDate } from "@/lib/integrations/format";
import { consoleOrpc } from "@/lib/orpc/query";
import type { PendingReviewIntegration } from "@/types/integrations";

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
    <div className="grid gap-4 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {(integration.logoLightUrl ?? integration.logoDarkUrl) ? (
            <>
              <Image
                alt={`${integration.name} logo`}
                className="size-10 shrink-0 rounded-lg border object-cover dark:hidden"
                height={40}
                src={integration.logoLightUrl ?? integration.logoDarkUrl ?? ""}
                width={40}
              />
              <Image
                alt={`${integration.name} logo`}
                className="hidden size-10 shrink-0 rounded-lg border object-cover dark:block"
                height={40}
                src={integration.logoDarkUrl ?? integration.logoLightUrl ?? ""}
                width={40}
              />
            </>
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted font-medium text-muted-foreground text-xs">
              {getIntegrationInitials(integration.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{integration.name}</p>
            <p className="truncate text-muted-foreground text-sm">
              {integration.author ?? integration.organization.name} · submitted{" "}
              {formatIntegrationDate(integration.submittedAt)}
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {integration.indexedToolCount}{" "}
          {integration.indexedToolCount === 1 ? "tool" : "tools"}
        </Badge>
      </div>

      {integration.description ? (
        <p className="text-muted-foreground text-sm">
          {integration.description}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
        <code className="rounded-md bg-muted px-2 py-1 font-mono">
          {integration.url}
        </code>
        <span>auth: {integration.authType}</span>
        <span>
          by {integration.createdByUser.name} ({integration.createdByUser.email}
          )
        </span>
      </div>

      <div className="flex justify-end gap-2">
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

      <ResponsiveDialog onOpenChange={setRejectOpen} open={rejectOpen}>
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
          ? "Integration approved — it's live"
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
        <h1 className="font-semibold text-2xl tracking-tight">Review Queue</h1>
        <p className="mt-1 text-muted-foreground text-sm">
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

      {pendingQuery.isError && pending.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
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

      {pendingQuery.data && pending.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">
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
            })
          }
          onReject={(note) =>
            decideMutation.mutate({
              serverId: integration.id,
              action: "reject",
              note,
            })
          }
        />
      ))}
    </main>
  );
}
