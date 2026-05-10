"use client";

import { Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { NotificationFooterProps } from "@/types/settings/notifications";

export function NotificationFooter({ emails }: NotificationFooterProps) {
  return (
    <div className="flex items-center gap-2 border-border/60 border-t pt-4 text-muted-foreground text-xs">
      <HugeiconsIcon className="size-3.5 shrink-0" icon={Mail01Icon} />
      <span className="flex min-w-0 items-center gap-1.5 truncate">
        <RecipientLine emails={emails} />
      </span>
    </div>
  );
}

function RecipientLine({ emails }: { emails: string[] }) {
  if (emails.length === 0) {
    return <>No organization owners to receive notifications.</>;
  }

  if (emails.length === 1) {
    return (
      <>
        Notifications are sent to{" "}
        <span className="truncate text-foreground">{emails[0]}</span>
      </>
    );
  }

  const [first, ...rest] = emails;
  const others = `${rest.length} other ${rest.length === 1 ? "owner" : "owners"}`;

  return (
    <>
      Notifications are sent to{" "}
      <span className="truncate text-foreground">{first}</span> and {others}
    </>
  );
}
