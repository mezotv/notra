import { DEFAULT_GITHUB_CONTENT_OUTPUT_ENABLED } from "@/constants/github";
import type { GitHubRepository } from "@/types/integrations";
import type { GitHubPublishContentType } from "@/types/integrations/github";

export function isGitHubContentPublishingEnabled(
  repository: GitHubRepository,
  contentType: GitHubPublishContentType
): boolean {
  const output = repository.outputs?.find(
    (candidate) => candidate.outputType === contentType
  );

  return output?.enabled ?? DEFAULT_GITHUB_CONTENT_OUTPUT_ENABLED[contentType];
}
