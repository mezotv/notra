import type { GitHubSelectionFilters } from "@notra/ai/types/tools";
import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { FEATURES } from "@/constants/features";
import { autumn } from "@/lib/billing/autumn";
import type { SelectedItems } from "@/schemas/content";

export async function resolveBrandVoiceForManualGeneration(
  organizationId: string,
  brandVoiceId?: string
) {
  if (brandVoiceId) {
    const explicitVoice = await db.query.brandSettings.findFirst({
      where: and(
        eq(brandSettings.id, brandVoiceId),
        eq(brandSettings.organizationId, organizationId)
      ),
    });

    if (!explicitVoice) {
      return { brand: null, invalidRequestedVoice: true } as const;
    }

    return { brand: explicitVoice, invalidRequestedVoice: false } as const;
  }

  const defaultVoice = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.organizationId, organizationId),
      eq(brandSettings.isDefault, true)
    ),
  });

  if (defaultVoice) {
    return { brand: defaultVoice, invalidRequestedVoice: false } as const;
  }

  const latestVoice = await db.query.brandSettings.findFirst({
    where: eq(brandSettings.organizationId, organizationId),
    orderBy: [desc(brandSettings.updatedAt)],
  });

  return { brand: latestVoice ?? null, invalidRequestedVoice: false } as const;
}

export function hasSelectedItemsOutsideTargets(
  selectedItems: SelectedItems,
  targetRepositoryIds: Set<string>
) {
  if (!selectedItems) {
    return false;
  }

  if (
    selectedItems.pullRequestNumbers?.some(
      (item) => !targetRepositoryIds.has(item.repositoryId)
    )
  ) {
    return true;
  }

  if (
    selectedItems.releaseTagNames?.some(
      (item) =>
        typeof item !== "string" && !targetRepositoryIds.has(item.repositoryId)
    )
  ) {
    return true;
  }

  return false;
}

export function buildSelectionFilters(
  selectedItems: SelectedItems,
  targetRepositoryIds: Set<string>,
  dataPoints: {
    includePullRequests: boolean;
    includeCommits: boolean;
    includeReleases: boolean;
  }
): GitHubSelectionFilters | undefined {
  if (!selectedItems) {
    return undefined;
  }

  const hasPullRequestSelection =
    dataPoints.includePullRequests &&
    (selectedItems.pullRequestNumbers?.length ?? 0) > 0;
  const hasReleaseSelection =
    dataPoints.includeReleases &&
    (selectedItems.releaseTagNames?.length ?? 0) > 0;
  const hasCommitSelection =
    dataPoints.includeCommits && (selectedItems.commitShas?.length ?? 0) > 0;

  if (!hasPullRequestSelection && !hasReleaseSelection && !hasCommitSelection) {
    return undefined;
  }

  const pullRequestByIntegrationId: Record<string, number[]> = {};
  if (hasPullRequestSelection) {
    for (const repositoryId of targetRepositoryIds) {
      pullRequestByIntegrationId[repositoryId] = [];
    }
    for (const item of selectedItems.pullRequestNumbers ?? []) {
      if (!targetRepositoryIds.has(item.repositoryId)) {
        continue;
      }
      pullRequestByIntegrationId[item.repositoryId]?.push(item.number);
    }
  }

  const releaseTagsByIntegrationId: Record<string, string[]> = {};
  const globalReleaseTags: string[] = [];
  if (hasReleaseSelection) {
    for (const repositoryId of targetRepositoryIds) {
      releaseTagsByIntegrationId[repositoryId] = [];
    }
    for (const item of selectedItems.releaseTagNames ?? []) {
      if (typeof item === "string") {
        globalReleaseTags.push(item);
        continue;
      }

      if (!targetRepositoryIds.has(item.repositoryId)) {
        continue;
      }

      releaseTagsByIntegrationId[item.repositoryId]?.push(item.tagName);
    }
  }

  const commitShas =
    (hasCommitSelection ? selectedItems.commitShas : undefined)
      ?.map((sha) => sha.trim())
      .filter((sha) => sha.length > 0) ?? [];

  return {
    allowedPullRequestNumbersByIntegrationId: hasPullRequestSelection
      ? pullRequestByIntegrationId
      : undefined,
    allowedReleaseTagsByIntegrationId: hasReleaseSelection
      ? releaseTagsByIntegrationId
      : undefined,
    allowedReleaseTagsGlobal:
      hasReleaseSelection && globalReleaseTags.length > 0
        ? globalReleaseTags
        : undefined,
    allowedCommitShas: hasCommitSelection ? commitShas : undefined,
  };
}

export function buildSelectedItemsInstructions(
  selectedItems: SelectedItems
): string | null {
  if (!selectedItems) {
    return null;
  }

  const parts: string[] = [];

  if (selectedItems.commitShas && selectedItems.commitShas.length > 0) {
    parts.push(
      `Focus ONLY on these specific commits (by SHA): ${selectedItems.commitShas.join(", ")}`
    );
  }

  if (
    selectedItems.pullRequestNumbers &&
    selectedItems.pullRequestNumbers.length > 0
  ) {
    const prList = selectedItems.pullRequestNumbers
      .map((pr) => `#${pr.number} (repo: ${pr.repositoryId})`)
      .join(", ");
    parts.push(`Focus ONLY on these specific pull requests: ${prList}`);
  }

  if (
    selectedItems.releaseTagNames &&
    selectedItems.releaseTagNames.length > 0
  ) {
    const releaseList = selectedItems.releaseTagNames
      .map((release) =>
        typeof release === "string"
          ? release
          : `${release.tagName} (repo: ${release.repositoryId})`
      )
      .join(", ");
    parts.push(`Focus ONLY on these specific releases: ${releaseList}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return `Selected items filter (IMPORTANT — only include content about these specific items, ignore all others):\n${parts.join("\n")}\nNote: The PR numbers, commit SHAs, and release tags above are internal references for fetching data. Never include raw PR numbers (e.g. "PR 195"), commit SHAs, or release tags in titles. Its fine in the main content but EXCLUDE short form content like tweets or linkedin posts.`;
}

export function buildDataPointRestrictionInstructions(dataPoints: {
  includePullRequests: boolean;
  includeCommits: boolean;
  includeReleases: boolean;
  includeLinearIssues: boolean;
}) {
  const restrictions: string[] = [];

  if (!dataPoints.includePullRequests) {
    restrictions.push(
      "- Exclude pull request data entirely. Do not mention PR numbers, PR titles, PR authors, or PR-based summaries."
    );
  }

  if (!dataPoints.includeCommits) {
    restrictions.push(
      "- Exclude commit data entirely. Do not mention commit hashes, commit counts, or commit-level changes."
    );
  }

  if (!dataPoints.includeReleases) {
    restrictions.push(
      "- Exclude release data entirely. Do not mention release tags, release names, or release-based summaries."
    );
  }

  if (!dataPoints.includeLinearIssues) {
    restrictions.push(
      "- Exclude Linear issue data entirely. Do not mention issue IDs, titles, statuses, or issue-based summaries."
    );
  }

  if (restrictions.length === 0) {
    return null;
  }

  return `Strict data-point restrictions:\n${restrictions.join("\n")}`;
}

export async function refundReservedAiCredit(
  organizationId: string,
  reserved: boolean
) {
  if (!reserved || !autumn) {
    return;
  }

  try {
    await autumn.track({
      customerId: organizationId,
      featureId: FEATURES.AI_CREDITS,
      value: 0,
    });
  } catch (error) {
    console.error("[OnDemandContent] Failed to refund AI credit", {
      organizationId,
      error,
    });
  }
}
