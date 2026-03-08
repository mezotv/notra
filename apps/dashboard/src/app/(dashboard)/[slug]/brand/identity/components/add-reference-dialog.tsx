"use client";

import {
  Add01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  InformationCircleIcon,
  Link04Icon,
  NewTwitterIcon,
  TextIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Textarea } from "@notra/ui/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useCustomer } from "autumn-js/react";
import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FEATURES } from "@/constants/features";
import {
  type ConnectedAccount,
  useConnectedAccounts,
  useConnectTwitter,
  useDisconnectAccount,
} from "@/lib/hooks/use-connected-accounts";
import type {
  AddReferenceDialogProps,
  ApplicablePlatform,
} from "@/types/hooks/brand-references";
import {
  useCreateReference,
  useFetchTweet,
  useImportTweets,
} from "../../../../../../lib/hooks/use-brand-references";

type Step = "source" | "tweet-url" | "import-x" | "custom";

function useReferenceBalance() {
  const { check, customer } = useCustomer();
  return useMemo(() => {
    if (!customer) {
      return {
        remaining: null,
        usage: null,
        included: null,
        overageAllowed: false,
        unlimited: false,
      };
    }
    const data = check({ featureId: FEATURES.REFERENCES }).data;
    if (!data) {
      return {
        remaining: null,
        usage: null,
        included: null,
        overageAllowed: false,
        unlimited: false,
      };
    }
    if (data.unlimited) {
      return {
        remaining: null,
        usage: null,
        included: null,
        overageAllowed: false,
        unlimited: true,
      };
    }
    const usage = typeof data.usage === "number" ? data.usage : 0;
    const included =
      typeof data.included_usage === "number" ? data.included_usage : 0;
    const overages = Math.max(0, usage - included);
    return {
      remaining: typeof data.balance === "number" ? data.balance : null,
      usage,
      included,
      overages,
      overageAllowed: data.overage_allowed === true,
      unlimited: false,
    };
  }, [check, customer]);
}

function ReferenceUsageInfo({ afterCount }: { afterCount: number }) {
  const { remaining, included, overages, overageAllowed, unlimited } =
    useReferenceBalance();

  if (unlimited || remaining === null) {
    return null;
  }

  if (remaining === 0) {
    return (
      <p className="text-destructive text-xs">
        No references remaining. Upgrade your plan to add more.
      </p>
    );
  }

  const afterRemaining = Math.max(0, remaining - afterCount);

  return (
    <p className="text-muted-foreground text-xs">
      You have {remaining} remaining · after this you will have {afterRemaining}{" "}
      left
      {overageAllowed && included !== null && (
        <span className="text-muted-foreground/70">
          {" "}
          · {included} included
          {typeof overages === "number" && overages > 0 && (
            <>
              , {overages} overage{overages === 1 ? "" : "s"}
            </>
          )}
        </span>
      )}
    </p>
  );
}

export function AddReferenceDialog({
  open,
  onOpenChange,
  organizationId,
  voiceId,
  initialStep,
}: AddReferenceDialogProps) {
  const [step, setStep] = useState<Step>(initialStep ?? "source");

  useEffect(() => {
    if (open && initialStep) {
      setStep(initialStep);
    }
  }, [open, initialStep]);

  const handleClose = () => {
    setStep("source");
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog onOpenChange={handleClose} open={open}>
      <ResponsiveDialogContent>
        {step === "source" && <SourceStep onSelect={setStep} />}
        {step === "tweet-url" && (
          <TweetUrlStep
            onBack={() => setStep("source")}
            onClose={handleClose}
            organizationId={organizationId}
            voiceId={voiceId}
          />
        )}
        {step === "import-x" && (
          <ImportXStep
            onBack={() => setStep("source")}
            onClose={handleClose}
            organizationId={organizationId}
            voiceId={voiceId}
          />
        )}
        {step === "custom" && (
          <CustomTextStep
            onBack={() => setStep("source")}
            onClose={handleClose}
            organizationId={organizationId}
            voiceId={voiceId}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function SourceStep({ onSelect }: { onSelect: (step: Step) => void }) {
  const sources = [
    {
      step: "tweet-url" as Step,
      icon: Link04Icon,
      title: "Tweet URL",
      description: "Paste a link to a specific tweet",
    },
    {
      step: "import-x" as Step,
      icon: NewTwitterIcon,
      title: "Import from X",
      description: "Bulk import recent posts from an account",
    },
    {
      step: "custom" as Step,
      icon: TextIcon,
      title: "Custom text",
      description: "Write or paste your own text",
    },
  ];

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Add Reference</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Choose a source to add writing style references.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <div className="grid gap-3 py-4">
        {sources.map((source) => (
          <button
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
            key={source.step}
            onClick={() => onSelect(source.step)}
            type="button"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <HugeiconsIcon className="size-5" icon={source.icon} />
            </div>
            <div>
              <p className="font-medium text-sm">{source.title}</p>
              <p className="text-muted-foreground text-xs">
                {source.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function TweetUrlStep({
  organizationId,
  voiceId,
  onBack,
  onClose,
}: {
  organizationId: string;
  voiceId: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const fetchTweet = useFetchTweet(organizationId, voiceId);
  const createReference = useCreateReference(organizationId, voiceId);
  const isPending = fetchTweet.isPending || createReference.isPending;
  const { remaining } = useReferenceBalance();

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      return;
    }

    try {
      const tweet = await fetchTweet.mutateAsync(trimmed);
      await createReference.mutateAsync({
        type: "twitter_post",
        content: tweet.content,
        metadata: {
          tweetId: tweet.tweetId,
          authorHandle: tweet.authorHandle,
          authorName: tweet.authorName,
          url: tweet.url,
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies,
          profileImageUrl: tweet.profileImageUrl,
          createdAt: tweet.createdAt,
        },
        note: null,
      });
      toast.success("Reference added");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add tweet"
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isPending) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Add Tweet</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Paste a tweet URL to add it as a writing style reference.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="space-y-2 py-4">
        <Input
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://x.com/user/status/..."
          value={url}
        />
        <ReferenceUsageInfo afterCount={1} />
      </div>

      <ResponsiveDialogFooter>
        <Button onClick={onBack} variant="outline">
          <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
          Back
        </Button>
        <Button
          disabled={isPending || !url.trim() || remaining === 0}
          onClick={handleSubmit}
        >
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Reference"
          )}
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}

function ImportXStep({
  organizationId,
  voiceId,
  onBack,
  onClose,
}: {
  organizationId: string;
  voiceId: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const { data, isLoading } = useConnectedAccounts(organizationId);
  const connectTwitter = useConnectTwitter(organizationId);
  const disconnectAccount = useDisconnectAccount(organizationId);
  const importTweets = useImportTweets(organizationId, voiceId);
  const [selectedAccount, setSelectedAccount] =
    useState<ConnectedAccount | null>(null);
  const [maxResults, setMaxResults] = useState(20);
  const { remaining } = useReferenceBalance();

  const effectiveMax =
    remaining !== null ? Math.min(maxResults, remaining) : maxResults;

  useEffect(() => {
    if (remaining !== null && remaining < maxResults) {
      setMaxResults(Math.max(1, Math.min(20, remaining)));
    }
  }, [remaining, maxResults]);

  const twitterAccounts =
    data?.accounts.filter((a) => a.provider === "twitter") ?? [];

  const handleConnect = async () => {
    try {
      const result = await connectTwitter.mutateAsync(
        window.location.pathname + window.location.search
      );
      window.location.href = result.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to connect X account"
      );
    }
  };

  const handleDisconnect = async (account: ConnectedAccount) => {
    try {
      await disconnectAccount.mutateAsync(account.id);
      toast.success(`Disconnected @${account.username}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect account"
      );
    }
  };

  const handleImport = async (account: ConnectedAccount) => {
    setSelectedAccount(account);
    try {
      const result = await importTweets.mutateAsync({
        accountId: account.id,
        maxResults: effectiveMax,
      });
      if (result.count > 0) {
        toast.success(
          `Imported ${result.count} post${result.count === 1 ? "" : "s"} from @${account.username}`
        );
        onClose();
      } else {
        toast.info(
          "No new posts to import — all recent posts are already added."
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import tweets"
      );
    }
  };

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Import from X</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Select a connected account to import recent posts, or connect a new
          one.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="space-y-3 py-4">
        {!isLoading && twitterAccounts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <Label
                  className="whitespace-nowrap text-xs"
                  htmlFor="max-results"
                >
                  Amount of posts to import:
                </Label>
                <Tooltip>
                  <TooltipTrigger className="cursor-help text-muted-foreground">
                    <HugeiconsIcon
                      className="size-3.5"
                      icon={InformationCircleIcon}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximum 20 posts per import</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                className="h-7 w-16 text-center text-xs"
                id="max-results"
                max={remaining !== null ? Math.min(20, remaining) : 20}
                min={1}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) {
                    const cap =
                      remaining !== null ? Math.min(20, remaining) : 20;
                    setMaxResults(Math.min(cap, Math.max(1, val)));
                  }
                }}
                type="number"
                value={maxResults}
              />
            </div>
            <ReferenceUsageInfo afterCount={maxResults} />
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && twitterAccounts.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <HugeiconsIcon className="size-6" icon={NewTwitterIcon} />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">No X accounts connected</p>
              <p className="text-muted-foreground text-xs">
                Connect an X account to import recent posts.
              </p>
            </div>
          </div>
        )}

        {!isLoading &&
          twitterAccounts.map((account) => {
            const isImporting =
              importTweets.isPending && selectedAccount?.id === account.id;
            const didImport =
              importTweets.isSuccess && selectedAccount?.id === account.id;

            return (
              <div
                className="flex items-center gap-3 rounded-lg border p-3"
                key={account.id}
              >
                <Avatar
                  className="size-9 rounded-full after:rounded-full"
                  size="sm"
                >
                  {account.profileImageUrl && (
                    <AvatarImage src={account.profileImageUrl} />
                  )}
                  <AvatarFallback>
                    {account.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {account.displayName}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    @{account.username}
                  </p>
                </div>
                <Button
                  className="cursor-pointer"
                  disabled={importTweets.isPending || remaining === 0}
                  onClick={() => handleImport(account)}
                  size="sm"
                  variant={didImport ? "outline" : "default"}
                >
                  {isImporting && (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin" />
                      Importing...
                    </>
                  )}
                  {!isImporting && didImport && "Imported"}
                  {!isImporting && !didImport && "Import"}
                </Button>
                <button
                  className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  disabled={disconnectAccount.isPending}
                  onClick={() => handleDisconnect(account)}
                  type="button"
                >
                  <HugeiconsIcon className="size-3.5" icon={Cancel01Icon} />
                </button>
              </div>
            );
          })}

        {!isLoading && (
          <button
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-left transition-colors hover:bg-muted/50"
            disabled={connectTwitter.isPending}
            onClick={handleConnect}
            type="button"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              {connectTwitter.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <HugeiconsIcon className="size-4" icon={Add01Icon} />
              )}
            </div>
            <p className="font-medium text-muted-foreground text-sm">
              {twitterAccounts.length === 0
                ? "Connect an X account"
                : "Connect another X account"}
            </p>
          </button>
        )}
      </div>

      <ResponsiveDialogFooter>
        <Button onClick={onBack} variant="outline">
          <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
          Back
        </Button>
        {importTweets.isSuccess && <Button onClick={onClose}>Done</Button>}
      </ResponsiveDialogFooter>
    </>
  );
}

const PLATFORM_OPTIONS = [
  { value: "all", label: "All platforms" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "blog", label: "Blog & Changelog" },
] as const;

function CustomTextStep({
  organizationId,
  voiceId,
  onBack,
  onClose,
}: {
  organizationId: string;
  voiceId: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [applicableTo, setApplicableTo] = useState<ApplicablePlatform[]>([
    "all",
  ]);

  const createReference = useCreateReference(organizationId, voiceId);

  const togglePlatform = (value: ApplicablePlatform) => {
    if (value === "all") {
      setApplicableTo(["all"]);
      return;
    }
    const withoutAll = applicableTo.filter(
      (v): v is Exclude<ApplicablePlatform, "all"> => v !== "all"
    );
    const updated = withoutAll.includes(value)
      ? withoutAll.filter((v) => v !== value)
      : [...withoutAll, value];
    setApplicableTo(updated.length === 0 ? ["all"] : updated);
  };

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("Please enter some text");
      return;
    }

    try {
      await createReference.mutateAsync({
        type: "custom",
        content: trimmed,
        metadata: null,
        note: note.trim() || null,
        applicableTo,
      });
      toast.success("Reference added");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save reference"
      );
    }
  };

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Add Custom Reference</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Paste or write text that represents your writing style.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="custom-content">Content</Label>
          <Textarea
            id="custom-content"
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or write text that represents your writing style..."
            rows={5}
            value={content}
          />
        </div>

        <div className="space-y-2">
          <Label>Use for</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((option) => (
              <button
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                  applicableTo.includes(option.value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
                key={option.value}
                onClick={() => togglePlatform(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-note">Note (optional)</Label>
          <Textarea
            id="custom-note"
            onChange={(e) => setNote(e.target.value)}
            placeholder="When should the AI use this as reference?"
            rows={2}
            value={note}
          />
        </div>
      </div>

      <ResponsiveDialogFooter>
        <Button onClick={onBack} variant="outline">
          <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
          Back
        </Button>
        <Button
          disabled={createReference.isPending || !content.trim()}
          onClick={handleSave}
        >
          {createReference.isPending ? "Saving..." : "Save Reference"}
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}
