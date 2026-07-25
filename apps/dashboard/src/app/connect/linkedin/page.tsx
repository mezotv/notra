"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Notra } from "@notra/ui/components/ui/svgs/notra";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/button";
import { useConnectSocialAccount } from "@/lib/hooks/use-connected-accounts";
import {
  useCompleteLinkedInSelection,
  useLinkedInSelectionOptions,
} from "@/lib/hooks/use-linkedin-selection";
import { cn } from "@/lib/utils";
import type { SelectionShellProps } from "@/types/components/linkedin-connect";

function buildConnectedPath(callbackPath: string): string {
  const safePath =
    callbackPath.startsWith("/") && !callbackPath.startsWith("//")
      ? callbackPath
      : "/";
  const separator = safePath.includes("?") ? "&" : "?";
  return `${safePath}${separator}linkedinConnected=true`;
}

function LinkedInConnectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = searchParams.get("state") ?? "";
  const token = searchParams.get("token") ?? "";
  const { data, isLoading, isError, error } = useLinkedInSelectionOptions(
    state,
    token
  );
  const completeMutation = useCompleteLinkedInSelection();
  const restartMutation = useConnectSocialAccount(
    data?.organizationId ?? "",
    "linkedin"
  );
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const handleRestart = async () => {
    if (!data) {
      return;
    }
    try {
      const result = await restartMutation.mutateAsync(data.callbackPath);
      window.location.href = result.url;
    } catch (restartError) {
      toast.error(
        restartError instanceof Error && restartError.message
          ? restartError.message
          : "Failed to restart the connection"
      );
    }
  };

  const handleSelect = (
    accountType: "personal" | "organization",
    organizationId?: string
  ) => {
    if (completeMutation.isPending) {
      return;
    }
    setSelectingId(organizationId ?? "personal");
    completeMutation.mutate(
      { state, accountType, organizationId },
      {
        onSuccess: (result) => {
          router.replace(buildConnectedPath(result.callbackPath));
        },
        onError: (mutationError) => {
          setSelectingId(null);
          toast.error(
            mutationError instanceof Error && mutationError.message
              ? mutationError.message
              : "Failed to connect the LinkedIn account"
          );
        },
      }
    );
  };

  if (!(state && token)) {
    return (
      <SelectionShell>
        <p className="text-destructive text-sm">
          This connection link is invalid. Please start the connection again.
        </p>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
          Back to dashboard
        </Link>
      </SelectionShell>
    );
  }

  if (isLoading) {
    return (
      <SelectionShell>
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </SelectionShell>
    );
  }

  if (isError || !data) {
    return (
      <SelectionShell>
        <p className="text-destructive text-sm">
          {error instanceof Error && error.message
            ? error.message
            : "Failed to load your LinkedIn profile. Please start the connection again."}
        </p>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/">
          Back to dashboard
        </Link>
      </SelectionShell>
    );
  }

  const { personal, organizations } = data.options;

  return (
    <SelectionShell>
      <div className="space-y-3">
        <button
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          disabled={completeMutation.isPending}
          onClick={() => handleSelect("personal")}
          type="button"
        >
          <Avatar className="size-10 rounded-full">
            {personal.profilePicture && (
              <AvatarImage
                alt={personal.displayName}
                src={personal.profilePicture}
              />
            )}
            <AvatarFallback>
              {personal.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">
              {personal.displayName}
            </p>
            <p className="text-muted-foreground text-xs">Post as yourself</p>
          </div>
          {selectingId === "personal" && (
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          )}
        </button>

        {organizations.map((organization) => (
          <button
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            disabled={completeMutation.isPending}
            key={organization.id}
            onClick={() => handleSelect("organization", organization.id)}
            type="button"
          >
            <Avatar className="size-10 rounded-md">
              {organization.logoUrl && (
                <AvatarImage
                  alt={organization.name}
                  src={organization.logoUrl}
                />
              )}
              <AvatarFallback className="rounded-md">
                {organization.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">
                {organization.name}
              </p>
              <p className="text-muted-foreground text-xs">
                Post as organization
              </p>
            </div>
            {selectingId === organization.id && (
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-muted-foreground text-xs">Not your account?</p>
        <button
          className="cursor-pointer font-medium text-primary text-xs hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          disabled={restartMutation.isPending || completeMutation.isPending}
          onClick={handleRestart}
          type="button"
        >
          {restartMutation.isPending
            ? "Redirecting..."
            : "Use a different LinkedIn login"}
        </button>
      </div>
    </SelectionShell>
  );
}

function SelectionShell({ children }: SelectionShellProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <Notra className="mb-8 size-10" />
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <div className="mb-5 space-y-1">
          <h1 className="font-bold text-lg">Where should we post from?</h1>
          <p className="text-muted-foreground text-sm">
            Pick yourself or one of your LinkedIn pages.
          </p>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export default function LinkedInConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LinkedInConnectContent />
    </Suspense>
  );
}
