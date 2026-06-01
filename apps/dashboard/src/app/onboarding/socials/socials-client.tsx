"use client";

import { ArrowDown01Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { ImportButtonContent } from "@/components/onboarding/socials/import-button-content";
import { ImportedTweetCard } from "@/components/onboarding/socials/imported-tweet-card";
import { ONBOARDING_IMPORT_COUNT } from "@/constants/onboarding";
import {
  useDeleteReference,
  useImportTweets,
} from "@/lib/hooks/use-brand-references";
import { useConnectTwitter } from "@/lib/hooks/use-connected-accounts";
import type { SocialsClientProps } from "@/types/components/socials-onboarding";
import type { BrandReference } from "@/types/hooks/brand-references";

export function SocialsClient({
  organizationId,
  voiceId,
  initialAccount,
}: SocialsClientProps) {
  const router = useRouter();

  const connectTwitter = useConnectTwitter(organizationId);
  const importTweets = useImportTweets(organizationId, voiceId ?? "");
  const deleteReference = useDeleteReference(organizationId, voiceId ?? "");
  const [importedReferences, setImportedReferences] = useState<
    BrandReference[]
  >([]);
  const [deletingReferenceId, setDeletingReferenceId] = useState<string | null>(
    null
  );
  const [importsExpanded, setImportsExpanded] = useState(true);

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
        maxResults: ONBOARDING_IMPORT_COUNT,
      });
      setImportedReferences(result.references);
      toast.success(`Imported ${result.count} tweets into your brand voice`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to import tweets"
      );
    }
  }

  async function handleDeleteImportedTweet(reference: BrandReference) {
    setDeletingReferenceId(reference.id);

    try {
      await deleteReference.mutateAsync(reference.id);
      setImportedReferences((current) =>
        current.filter((item) => item.id !== reference.id)
      );
      toast.success("Tweet removed from your brand voice");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove tweet"
      );
    } finally {
      setDeletingReferenceId(null);
    }
  }

  function handleContinue() {
    router.push("/onboarding/pricing");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-12">
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
                  {initialAccount.profileImageUrl ? (
                    <Avatar
                      className="size-4 rounded-full after:rounded-full"
                      size="sm"
                    >
                      <AvatarImage src={initialAccount.profileImageUrl} />
                      <AvatarFallback>
                        {initialAccount.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
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
              <p className="mb-3 text-muted-foreground text-xs">
                Import up to {ONBOARDING_IMPORT_COUNT} recent tweets to seed
                your brand voice.
              </p>
              <Button
                className="w-full"
                disabled={importTweets.isPending}
                onClick={handleImport}
                size="sm"
                variant="secondary"
              >
                <ImportButtonContent
                  importedCount={importedReferences.length}
                  isPending={importTweets.isPending}
                />
              </Button>

              {importedReferences.length > 0 ? (
                <Collapsible
                  className="mt-4"
                  defaultOpen
                  onOpenChange={setImportsExpanded}
                  open={importsExpanded}
                >
                  <CollapsibleTrigger
                    className="group/trigger flex w-full cursor-pointer items-center justify-between gap-3 rounded-md py-1 text-left hover:opacity-80"
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <HugeiconsIcon
                        className="size-4 text-muted-foreground transition-transform group-data-[panel-open]/trigger:rotate-180"
                        icon={ArrowDown01Icon}
                      />
                      <span className="font-medium text-sm">
                        Imported tweets ({importedReferences.length})
                      </span>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Remove any you do not want to use.
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                    <div className="columns-1 gap-3 space-y-3 sm:columns-2">
                      {importedReferences.map((reference) => (
                        <ImportedTweetCard
                          isDeleting={deletingReferenceId === reference.id}
                          key={reference.id}
                          onDelete={handleDeleteImportedTweet}
                          reference={reference}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
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
