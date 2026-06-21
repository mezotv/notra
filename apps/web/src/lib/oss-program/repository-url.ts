const GITHUB_REPO_PREFIX = "https://github.com/";

const REPO_PREFIX_REGEX = /^(https?:\/\/)?(www\.)?github\.com\//i;
const LEADING_SLASH_REGEX = /^\/+/;
const TRAILING_SLASH_REGEX = /\/+$/;

export function extractRepoSlug(input: string): string {
  return input
    .trim()
    .replace(REPO_PREFIX_REGEX, "")
    .replace(LEADING_SLASH_REGEX, "")
    .replace(TRAILING_SLASH_REGEX, "");
}

export function buildRepositoryUrl(input: string): string {
  const slug = extractRepoSlug(input);
  return slug ? `${GITHUB_REPO_PREFIX}${slug}` : "";
}
