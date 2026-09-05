"use client";

import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@notra/ui/components/ui/alert";

import { GITHUB_RECOVERY_COPY } from "@/constants/github";
import type { GitHubPublishRecoveryAlertProps } from "@/types/content/detail";

export function GitHubPublishRecoveryAlert({
  publishRecovery,
}: GitHubPublishRecoveryAlertProps) {
  const recoveryCopy = GITHUB_RECOVERY_COPY[publishRecovery.code];

  return (
    <Alert variant="destructive">
      <HugeiconsIcon icon={AlertCircleIcon} />
      <AlertTitle>{recoveryCopy.title}</AlertTitle>
      <AlertDescription>
        <p>{recoveryCopy.description}</p>
        {publishRecovery.publishingPaused ? (
          <p>
            Publishing was also paused after three failures. Resume it in the
            GitHub integration after fixing this.
          </p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
