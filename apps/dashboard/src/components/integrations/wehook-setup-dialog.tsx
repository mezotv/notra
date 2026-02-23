"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import type React from "react";
import { isValidElement, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  WebhookConfig,
  WebhookSetupDialogProps,
} from "@/types/integrations";
import { QUERY_KEYS } from "@/utils/query-keys";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not supported");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Button
      className="shrink-0"
      onClick={handleCopy}
      size="icon"
      type="button"
      variant="outline"
    >
      {copied ? (
        <CheckIcon className="size-4" />
      ) : (
        <CopyIcon className="size-4" />
      )}
    </Button>
  );
}

export function WebhookSetupDialog({
  repositoryId,
  organizationId,
  owner,
  repo,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: WebhookSetupDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();

  const {
    data: webhookConfig,
    isLoading: loadingConfig,
    isFetched,
  } = useQuery<WebhookConfig | null>({
    queryKey: QUERY_KEYS.INTEGRATIONS.webhookConfig(repositoryId),
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/repositories/${repositoryId}/webhook`
      );
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch webhook config");
      }
      return response.json();
    },
    enabled: open,
  });

  const generateMutation = useMutation<WebhookConfig, Error, void>({
    mutationFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/repositories/${repositoryId}/webhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate webhook secret");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INTEGRATIONS.webhookConfig(repositoryId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Auto-generate webhook secret when dialog opens and no config exists
  const { isPending, isSuccess, isError, mutate } = generateMutation;
  useEffect(() => {
    if (
      open &&
      isFetched &&
      !webhookConfig &&
      !isPending &&
      !isSuccess &&
      !isError
    ) {
      mutate();
    }
  }, [open, isFetched, webhookConfig, isPending, isSuccess, isError, mutate]);

  const githubWebhooksUrl = `https://github.com/${owner}/${repo}/settings/hooks/new`;

  const triggerElement =
    trigger !== undefined && isValidElement(trigger) ? (
      <ResponsiveDialogTrigger render={trigger as React.ReactElement} />
    ) : trigger === undefined ? null : (
      <ResponsiveDialogTrigger>
        <Button size="sm" variant="outline">
          Setup Webhook
        </Button>
      </ResponsiveDialogTrigger>
    );

  return (
    <ResponsiveDialog onOpenChange={setOpen} open={open}>
      {triggerElement}
      <ResponsiveDialogContent className="overflow-hidden sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-2xl">
            Setup Webhook
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Add these values in GitHub, then confirm once saved.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          {loadingConfig || isPending ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ) : webhookConfig ? (
            <>
              <fieldset className="space-y-1.5">
                <p className="font-medium text-sm">Payload URL</p>
                <div className="flex gap-2">
                  <Input
                    className="font-mono text-xs"
                    readOnly
                    value={webhookConfig.webhookUrl}
                  />
                  <CopyButton label="URL" value={webhookConfig.webhookUrl} />
                </div>
              </fieldset>

              <fieldset className="space-y-1.5">
                <p className="font-medium text-sm">Secret</p>
                <div className="flex gap-2">
                  <Input
                    className="font-mono text-xs"
                    readOnly
                    type={secretRevealed ? "text" : "password"}
                    value={webhookConfig.webhookSecret}
                  />
                  <Button
                    className="shrink-0"
                    onClick={() => setSecretRevealed(!secretRevealed)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    {secretRevealed ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </Button>
                  <CopyButton
                    label="Secret"
                    value={webhookConfig.webhookSecret}
                  />
                </div>
              </fieldset>

              <p className="text-muted-foreground text-xs">
                Set content type to{" "}
                <span className="rounded bg-muted px-1 text-[11px]">
                  application/json
                </span>
                .{" "}
                <a
                  className="text-primary text-xs hover:underline"
                  href={githubWebhooksUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open GitHub settings
                </a>
                .
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center">
                <p className="font-medium text-destructive text-sm">
                  Failed to load webhook configuration
                </p>
                {generateMutation.error ? (
                  <p className="mt-1 text-muted-foreground text-xs">
                    {generateMutation.error.message}
                  </p>
                ) : null}
              </div>
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() => mutate()}
                type="button"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          )}
        </div>

        <ResponsiveDialogFooter className="gap-2">
          <ResponsiveDialogClose
            className="h-9"
            render={<Button variant="outline" />}
          >
            Skip for now
          </ResponsiveDialogClose>
          <Button
            className="h-9"
            disabled={!webhookConfig}
            onClick={() => setOpen(false)}
            type="button"
          >
            I've added the webhook
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
