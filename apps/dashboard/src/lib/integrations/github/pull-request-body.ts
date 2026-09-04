import type {
  GitHubPublishContentType,
  OpenInNotraBadgeUrls,
} from "../../../types/integrations/github";

const OPEN_IN_NOTRA_BADGE_PATHS = {
  dark: "/badges/open-in-notra-dark.svg",
  light: "/badges/open-in-notra-light.svg",
} as const;

export type { OpenInNotraBadgeUrls };

export interface BuildContentPullRequestBodyParams {
  contentType: GitHubPublishContentType;
  /** Deep link to the content in the Notra dashboard. */
  contentUrl?: string;
  /** Absolute URLs of the "Open in Notra" badge images per color scheme. */
  badgeUrls?: OpenInNotraBadgeUrls;
}

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

/**
 * Resolves the public base URL of the Notra dashboard from the environment.
 * Returns `null` when no URL is configured so callers can omit deep links.
 */
export function resolveNotraBaseUrl(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const raw =
    env.APP_URL ?? env.NEXT_PUBLIC_SITE_URL ?? env.NEXT_PUBLIC_APP_URL ?? "";
  const trimmed = trimTrailingSlash(raw.trim());
  return trimmed.length > 0 ? trimmed : null;
}

export function buildOpenInNotraBadgeUrls(
  baseUrl: string
): OpenInNotraBadgeUrls {
  const base = trimTrailingSlash(baseUrl);
  return {
    dark: `${base}${OPEN_IN_NOTRA_BADGE_PATHS.dark}`,
    light: `${base}${OPEN_IN_NOTRA_BADGE_PATHS.light}`,
  };
}

/**
 * GitHub renders `<picture>` with `prefers-color-scheme` sources in Markdown,
 * so the badge follows the viewer's theme. The plain `<img>` is the fallback
 * for clients without `<picture>` support (e.g. notification emails).
 */
function renderOpenInNotraButton(
  contentUrl: string,
  badgeUrls: OpenInNotraBadgeUrls
) {
  return [
    `<a href="${contentUrl}"><picture>`,
    `<source media="(prefers-color-scheme: dark)" srcset="${badgeUrls.dark}">`,
    `<source media="(prefers-color-scheme: light)" srcset="${badgeUrls.light}">`,
    `<img src="${badgeUrls.light}" alt="Open in Notra" height="44">`,
    "</picture></a>",
  ].join("");
}

export function buildContentPullRequestBody({
  contentType,
  contentUrl,
  badgeUrls,
}: BuildContentPullRequestBodyParams) {
  const label = contentType === "changelog" ? "changelog" : "blog post";
  const summary = `Draft ${label} generated and published with Notra.`;

  if (!contentUrl) {
    return summary;
  }

  const button = badgeUrls
    ? renderOpenInNotraButton(contentUrl, badgeUrls)
    : `[Open in Notra](${contentUrl})`;

  return `${summary}\n\n${button}`;
}
