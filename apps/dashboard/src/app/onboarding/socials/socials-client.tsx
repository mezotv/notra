"use client";

import {
  CheckmarkCircle02Icon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { useImportTweets } from "@/lib/hooks/use-brand-references";
import {
  type ConnectedAccount,
  useConnectTwitter,
} from "@/lib/hooks/use-connected-accounts";

interface SocialsClientProps {
  organizationId: string;
  voiceId: string | null;
  initialAccount: ConnectedAccount | null;
}

function ImportButtonContent({
  isPending,
  isSuccess,
}: {
  isPending: boolean;
  isSuccess: boolean;
}) {
  if (isPending) {
    return (
      <>
        <Loader2Icon className="size-4 animate-spin" />
        Importing tweets...
      </>
    );
  }
  if (isSuccess) {
    return (
      <>
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
        Tweets imported
      </>
    );
  }
  return "Import recent tweets";
}

export function SocialsClient({
  organizationId,
  voiceId,
  initialAccount,
}: SocialsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("twitterConnected") === "true";

  const connectTwitter = useConnectTwitter(organizationId);
  const importTweets = useImportTweets(organizationId, voiceId ?? "");

  useEffect(() => {
    if (justConnected) {
      toast.success("X account connected");
    }
  }, [justConnected]);

  async function handleConnect() {
    try {
      const { url } = await connectTwitter.mutateAsync("/onboarding/socials");
      window.location.href = url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to connect X account"
      );
    }
  }

  async function handleImport() {
    if (!(initialAccount && voiceId)) {
      return;
    }
    try {
      const result = await importTweets.mutateAsync({
        accountId: initialAccount.id,
        maxResults: 20,
      });
      toast.success(`Imported ${result.count} tweets into your brand voice`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to import tweets"
      );
    }
  }

  function handleContinue() {
    router.push("/onboarding/pricing");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6">
        <OnboardingProgress current={2} />
      </div>

      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">
          Connect your accounts
        </h1>
        <p className="text-muted-foreground text-sm">
          Pull in your recent posts so Notra can write in your voice from day
          one.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-foreground text-background">
              <HugeiconsIcon icon={NewTwitterIcon} size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">X (Twitter)</p>
              {initialAccount ? (
                <p className="flex items-center gap-1 text-muted-foreground text-xs">
                  <HugeiconsIcon
                    className="text-emerald-500"
                    icon={CheckmarkCircle02Icon}
                    size={12}
                  />
                  Connected as @{initialAccount.username}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Connect to import your tweets
                </p>
              )}
            </div>
            {initialAccount ? null : (
              <Button
                disabled={connectTwitter.isPending}
                onClick={handleConnect}
                size="sm"
                variant="outline"
              >
                {connectTwitter.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Connect"
                )}
              </Button>
            )}
          </div>

          {initialAccount && voiceId ? (
            <div className="mt-4 border-t pt-4">
              <Button
                className="w-full"
                disabled={importTweets.isPending || importTweets.isSuccess}
                onClick={handleImport}
                size="sm"
                variant="secondary"
              >
                <ImportButtonContent
                  isPending={importTweets.isPending}
                  isSuccess={importTweets.isSuccess}
                />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button className="w-full" onClick={handleContinue} type="button">
          Continue
        </Button>
        <button
          className="text-center text-muted-foreground text-sm hover:text-foreground"
          onClick={handleContinue}
          type="button"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
