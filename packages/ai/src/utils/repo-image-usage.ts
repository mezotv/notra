import { repoImageCostSchema } from "@notra/ai/schemas/repo-image";
import type { GenerateRepoImageResult } from "@notra/ai/types/repo-image";
import type * as z from "zod";

type RepoImageCost = z.infer<typeof repoImageCostSchema>;
type RepoImageCostInputTokenDetails = NonNullable<
  RepoImageCost["inputTokenDetails"]
>;

export function extractRepoImageUsage(
  cost: unknown,
  modelId: string
): GenerateRepoImageResult["usage"] {
  const parsed = repoImageCostSchema.safeParse(cost);
  if (!parsed.success) {
    return undefined;
  }

  const normalizedCost = parsed.data;
  const inputTokens =
    normalizedCost.inputTokens ??
    normalizedCost.input_tokens ??
    normalizedCost.input ??
    0;
  const outputTokens =
    normalizedCost.outputTokens ??
    normalizedCost.output_tokens ??
    normalizedCost.output ??
    0;
  const cacheReadTokens =
    normalizedCost.cacheReadTokens ??
    normalizedCost.cacheReadInputTokens ??
    normalizedCost.cachedInputTokens ??
    normalizedCost.cache_read_tokens ??
    normalizedCost.cache_read_input_tokens ??
    normalizedCost.cached_input_tokens ??
    readInputTokenDetailsCacheReadTokens(normalizedCost.inputTokenDetails) ??
    readInputTokenDetailsCacheReadTokens(normalizedCost.input_token_details) ??
    0;
  const cacheWriteTokens =
    normalizedCost.cacheWriteTokens ??
    normalizedCost.cacheWriteInputTokens ??
    normalizedCost.cacheCreationInputTokens ??
    normalizedCost.cache_write_tokens ??
    normalizedCost.cache_write_input_tokens ??
    normalizedCost.cache_creation_input_tokens ??
    readInputTokenDetailsCacheWriteTokens(normalizedCost.inputTokenDetails) ??
    readInputTokenDetailsCacheWriteTokens(normalizedCost.input_token_details) ??
    0;
  const computeMs = normalizedCost.computeMs ?? normalizedCost.compute_ms;
  const totalUsd = normalizedCost.totalUsd ?? normalizedCost.total_usd;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    modelId,
    ...(computeMs === 0 ? {} : { computeMs }),
    ...(totalUsd === 0 ? {} : { totalUsd }),
    raw: cost,
  };
}

function readInputTokenDetailsCacheReadTokens(
  details?: RepoImageCostInputTokenDetails
) {
  return details?.cacheReadTokens ?? details?.cache_read_tokens;
}

function readInputTokenDetailsCacheWriteTokens(
  details?: RepoImageCostInputTokenDetails
) {
  return (
    details?.cacheWriteTokens ??
    details?.cacheCreationInputTokens ??
    details?.cache_write_tokens ??
    details?.cache_creation_input_tokens
  );
}
