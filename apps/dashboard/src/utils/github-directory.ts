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
