"use client";

import { UserSwitchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import type { ImpersonationBannerProps } from "@/types/auth";

export function ImpersonationBanner({ email, name }: ImpersonationBannerProps) {
  const invalidateSession = authClient.useSessionInvalidation();
  const stopImpersonating = useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: () => {
      invalidateSession();
    },
    onError: () => {
      toast.error("Failed to stop impersonating");
    },
  });

  return (
    <output className="flex h-(--impersonation-banner-height) shrink-0 items-center justify-center gap-3 border-amber-300 border-b bg-amber-50 px-4 py-1.5 text-amber-950 text-sm dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
      <HugeiconsIcon className="size-4 shrink-0" icon={UserSwitchIcon} />
      <span className="min-w-0 truncate">
        Impersonating <span className="font-medium">{name}</span> ({email})
      </span>
      <Button
        className="h-7 border-amber-400 bg-transparent hover:bg-amber-100 dark:border-amber-800 dark:bg-transparent dark:hover:bg-amber-900"
        disabled={stopImpersonating.isPending}
        onClick={() => stopImpersonating.mutate()}
        size="sm"
        variant="outline"
      >
        {stopImpersonating.isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : null}
        {stopImpersonating.isPending ? "Signing out..." : "Stop impersonating"}
      </Button>
    </output>
  );
}
