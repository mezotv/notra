import type { SessionContext } from "eve/context";

import { generationConfigSchema } from "../schemas/generation-config";
import type { GenerationConfig } from "../types/github-tools";
import { getJsonSessionAttribute } from "./session";

export function getGenerationConfig(ctx: SessionContext): GenerationConfig {
  return (
    getJsonSessionAttribute(ctx, "generationConfig", (value) =>
      generationConfigSchema.parse(value)
    ) ?? {}
  );
}

export function assertPullRequestAllowed(
  config: GenerationConfig,
  integrationId: string,
  pullNumber: number
): void {
  const allowed =
    config.selectionFilters?.allowedPullRequestNumbersByIntegrationId?.[
      integrationId
    ];
  if (allowed && !allowed.includes(pullNumber)) {
    throw new Error(
      `Pull request #${String(pullNumber)} is outside the selected item filter for integration ${integrationId}.`
    );
  }
}

export function assertReleaseTagAllowed(
  config: GenerationConfig,
  integrationId: string,
  tag: string
): void {
  const filters = config.selectionFilters;
  const hasFilter =
    filters?.allowedReleaseTagsByIntegrationId !== undefined ||
    filters?.allowedReleaseTagsGlobal !== undefined;
  if (!hasFilter) {
    return;
  }

  const normalizedTag = tag.trim().toLowerCase();
  const allowedForIntegration = (
    filters.allowedReleaseTagsByIntegrationId?.[integrationId] ?? []
  ).map((value) => value.trim().toLowerCase());
  const allowedGlobally = (filters.allowedReleaseTagsGlobal ?? []).map(
    (value) => value.trim().toLowerCase()
  );

  if (
    !(
      allowedForIntegration.includes(normalizedTag) ||
      allowedGlobally.includes(normalizedTag)
    )
  ) {
    throw new Error(
      `Release tag "${tag}" is outside the selected item filter for integration ${integrationId}.`
    );
  }
}

export function getAllowedCommitShaSet(
  config: GenerationConfig
): Set<string> | undefined {
  const shas = config.selectionFilters?.allowedCommitShas;
  if (shas === undefined) {
    return undefined;
  }
  return new Set(
    shas
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0)
  );
}
