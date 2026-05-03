"use client";

import { Alert02Icon, MailSend01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { MarketingChatSendResult } from "@/types/email/marketing-chat";

export function MarketingChatAdminClient() {
  const [results, setResults] = useState<MarketingChatSendResult[] | null>(
    null
  );
  const [confirming, setConfirming] = useState(false);

  const recipientsQuery = useQuery({
    ...dashboardOrpc.marketingChat.list.queryOptions({ input: undefined }),
  });

  const sendMutation = useMutation({
    mutationFn: () => dashboardOrpc.marketingChat.send.call(),
    onSuccess: (data) => {
      setResults(data.results);
      setConfirming(false);
      toast.success(`Sent ${data.sent}, failed ${data.failed}`);
    },
    onError: (err) => {
      setConfirming(false);
      toast.error(err instanceof Error ? err.message : "Failed to send");
    },
  });

  const recipients = recipientsQuery.data?.recipients ?? [];
  const isSending = sendMutation.isPending;

  const renderRecipients = () => {
    if (recipientsQuery.isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }
    if (recipientsQuery.error) {
      return (
        <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/5 p-3 text-red-700 text-sm dark:text-red-300">
          <HugeiconsIcon icon={Alert02Icon} size={16} />
          <span>
            {recipientsQuery.error instanceof Error
              ? recipientsQuery.error.message
              : "Failed to load recipients"}
          </span>
        </div>
      );
    }
    if (recipients.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">No opted-in recipients.</p>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipients.map((r) => (
            <TableRow key={`${r.email}:${r.organizationId}`}>
              <TableCell className="font-medium">{r.email}</TableCell>
              <TableCell>{r.organizationName}</TableCell>
              <TableCell className="text-muted-foreground">
                {r.organizationSlug}
              </TableCell>
              <TableCell className="text-right">
                {renderResultBadge(r.email, r.organizationSlug)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderResultBadge = (email: string, slug: string) => {
    if (!results) {
      return null;
    }
    const r = results.find(
      (x) => x.email === email && x.organizationSlug === slug
    );
    if (!r) {
      return null;
    }
    if (r.status === "sent") {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
          Sent
        </Badge>
      );
    }
    return (
      <Badge
        className="bg-red-500/15 text-red-700 dark:text-red-300"
        title={r.error}
      >
        Failed
      </Badge>
    );
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">
          Marketing Chat Email
        </h1>
        <p className="text-muted-foreground text-sm">
          Send the Content Chat announcement to every org owner who has
          marketing emails enabled. Each recipient gets a per-org link.
        </p>
      </div>

      <TitleCard heading="Recipients (org owners opted in)">
        <div>{renderRecipients()}</div>
      </TitleCard>

      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
        <div className="text-muted-foreground text-sm">
          {recipients.length} recipient{recipients.length === 1 ? "" : "s"} will
          receive the email. Sends are idempotent.
        </div>
        {confirming ? (
          <div className="flex items-center gap-2">
            <Button
              disabled={isSending}
              onClick={() => setConfirming(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isSending}
              onClick={() => sendMutation.mutate()}
              variant="destructive"
            >
              {isSending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>Confirm send to {recipients.length}</>
              )}
            </Button>
          </div>
        ) : (
          <Button
            disabled={recipients.length === 0 || recipientsQuery.isLoading}
            onClick={() => setConfirming(true)}
          >
            <HugeiconsIcon icon={MailSend01Icon} size={16} />
            Send to all
          </Button>
        )}
      </div>
    </div>
  );
}
