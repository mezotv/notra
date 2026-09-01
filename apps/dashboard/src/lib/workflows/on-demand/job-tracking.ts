import { redis } from "@notra/ai/utils/redis";
import {
  appendContentGenerationJobEvent,
  setContentGenerationJobStatus,
} from "@notra/content-generation/jobs";

import type { OnDemandJobEventInput } from "@/types/workflows/on-demand-generation";

export async function setTrackedJobStatus(
  jobId: string | undefined,
  status: "running" | "completed" | "failed" | "skipped",
  updates?: { postId?: string | null; error?: string | null }
) {
  if (!(jobId && redis)) {
    return;
  }
  await setContentGenerationJobStatus(redis, jobId, status, {
    ...(updates?.postId !== undefined ? { postId: updates.postId } : {}),
    ...(updates?.error !== undefined ? { error: updates.error } : {}),
  });
}

export async function appendTrackedJobEvent(
  jobId: string | undefined,
  type: OnDemandJobEventInput["type"],
  message: string,
  metadata?: Record<string, unknown> | null
) {
  if (!(jobId && redis)) {
    return;
  }
  await appendContentGenerationJobEvent(redis, {
    id: crypto.randomUUID(),
    jobId,
    type,
    message,
    createdAt: new Date().toISOString(),
    metadata: metadata ?? null,
  });
}
