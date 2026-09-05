import type { GitHubDirectoryEntry } from "@/types/integrations/github";

export function normalizeGitHubDirectorySegment(segment: string): string {
  return segment.trim().replace(/^\/+|\/+$/g, "");
}

export function joinGitHubDirectory(parent: string, segment: string): string {
  const normalizedParent = normalizeGitHubDirectorySegment(parent);
  const normalizedSegment = normalizeGitHubDirectorySegment(segment);

  if (!normalizedSegment) {
    return normalizedParent;
  }

  if (!normalizedParent) {
    return normalizedSegment;
  }

  return `${normalizedParent}/${normalizedSegment}`;
}

export function isGitHubCurrentFolderMissing(
  directory: string,
  rootDirectories: GitHubDirectoryEntry[],
  isSuccess: boolean
): boolean {
  if (!directory || directory.includes("/") || !isSuccess) {
    return false;
  }

  return !rootDirectories.some(
    (rootDirectory) => rootDirectory.path === directory
  );
}
