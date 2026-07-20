const GITHUB_HOST = /github\.com/i;
const SLUG_PART = /^[\w.-]+$/;
const PROTOCOL = /^https?:\/\//i;
const GIT_SUFFIX = /\.git$/i;

export function parseRepoInput(
  raw: string
): { owner: string; repo: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let ownerRepo = trimmed;

  if (GITHUB_HOST.test(trimmed)) {
    const withoutProtocol = trimmed.replace(PROTOCOL, "");
    const segments = withoutProtocol.split("/").filter(Boolean);
    const hostIndex = segments.findIndex((part) => GITHUB_HOST.test(part));
    ownerRepo = segments.slice(hostIndex + 1, hostIndex + 3).join("/");
  }

  const [owner, repo] = ownerRepo.split("/");
  if (!(owner && repo)) {
    return null;
  }

  const cleanRepo = repo.replace(GIT_SUFFIX, "");
  if (!(SLUG_PART.test(owner) && SLUG_PART.test(cleanRepo))) {
    return null;
  }

  return { owner, repo: cleanRepo };
}
