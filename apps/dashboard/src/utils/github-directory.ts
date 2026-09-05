export function joinGitHubDirectory(parent: string, segment: string): string {
  const normalizedParent = parent.replace(/^\/+|\/+$/g, "");
  const normalizedSegment = segment.trim().replace(/^\/+|\/+$/g, "");

  if (!normalizedSegment) {
    return normalizedParent;
  }

  if (!normalizedParent) {
    return normalizedSegment;
  }

  return `${normalizedParent}/${normalizedSegment}`;
}
