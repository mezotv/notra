"use client";

import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import type { NotificationRecipientsProps } from "@/types/settings/notifications";

export function NotificationRecipients({
  emails,
  isLoading,
}: NotificationRecipientsProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-muted/40 px-4 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
        <HugeiconsIcon className="size-4" icon={Mail01Icon} />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-medium text-sm">Sent to</p>
        {isLoading ? (
          <Skeleton className="h-4 w-48" />
        ) : (
          <RecipientList emails={emails} />
        )}
      </div>
    </div>
  );
}

function RecipientList({ emails }: { emails: string[] }) {
  if (emails.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        No organization owners found
      </p>
    );
  }

  if (emails.length === 1) {
    return (
      <p className="truncate text-muted-foreground text-xs">{emails[0]}</p>
    );
  }

  const [first, ...rest] = emails;
  return (
    <p className="truncate text-muted-foreground text-xs">
      {first} and {rest.length} other {rest.length === 1 ? "owner" : "owners"}
    </p>
  );
}
