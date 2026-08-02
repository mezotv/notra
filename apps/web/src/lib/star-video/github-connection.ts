import { GITHUB_CONNECTED_COOKIE } from "./github-cookies";

export function subscribeToGithubConnection(): () => void {
  return () => undefined;
}

export function isGithubConnected(): boolean {
  return document.cookie.split("; ").includes(`${GITHUB_CONNECTED_COOKIE}=1`);
}

export function getServerGithubConnected(): boolean {
  return false;
}

export function buildGithubConnectHref(repoParam: string | null): string {
  if (!repoParam) {
    return "/api/star-video/github/authorize";
  }
  return `/api/star-video/github/authorize?repo=${encodeURIComponent(repoParam)}`;
}
