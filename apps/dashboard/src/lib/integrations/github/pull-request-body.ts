import {
  GITHUB_PULL_REQUEST_BODY_MAX_LENGTH,
  GITHUB_PULL_REQUEST_BODY_SECTION_END,
  GITHUB_PULL_REQUEST_BODY_SECTION_START,
} from "@/constants/github";

import type {
  GitHubPublishContentType,
  OpenInNotraBadgeUrls,
} from "../../../types/integrations/github";

const OPEN_IN_NOTRA_BADGE_PATHS = {
  dark: "/badges/open-in-notra-dark.svg",
  light: "/badges/open-in-notra-light.svg",
} as const;

const PULL_REQUEST_BODY_TRUNCATION_NOTICE =
  "_Truncated to fit GitHub's pull request description limit. The full draft is in the committed file._";

const LEADING_HEADING_REGEX = /^#\s+\S/;

export type { OpenInNotraBadgeUrls };

export interface BuildContentPullRequestBodyParams {
  contentType: GitHubPublishContentType;
  /** Deep link to the content in the Notra dashboard. */
  contentUrl?: string;
  /** Absolute URLs of the "Open in Notra" badge images per color scheme. */
  badgeUrls?: OpenInNotraBadgeUrls;
  /** Draft markdown committed to the pull request. */
  markdown?: string;
  /** Content title, used as an H1 when the markdown body has none. */
  title?: string;
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

function draftSummary(contentType: GitHubPublishContentType) {
  const label = contentType === "changelog" ? "changelog" : "blog post";
  return `Draft ${label} generated and published with Notra.`;
}

function renderOpenInNotraLink(params: BuildContentPullRequestBodyParams) {
  if (!params.contentUrl) {
    return "";
  }

  return params.badgeUrls
    ? renderOpenInNotraButton(params.contentUrl, params.badgeUrls)
    : `[Open in Notra](${params.contentUrl})`;
}

function joinParagraphs(parts: string[]) {
  return parts.filter((part) => part.length > 0).join("\n\n");
}

/**
 * Older pull requests only had this summary (and later the Open in Notra
 * button). Keep generating it so republishing can still find and replace
 * unmarked legacy bodies.
 */
function buildManagedIntro(params: BuildContentPullRequestBodyParams) {
  return joinParagraphs([
    draftSummary(params.contentType),
    renderOpenInNotraLink(params),
  ]);
}

function neutralizeManagedSectionMarkers(markdown: string) {
  return markdown
    .replaceAll(
      GITHUB_PULL_REQUEST_BODY_SECTION_START,
      "<!-- notra-content:start -->"
    )
    .replaceAll(
      GITHUB_PULL_REQUEST_BODY_SECTION_END,
      "<!-- notra-content:end -->"
    );
}

function formatContentForPullRequest(
  params: BuildContentPullRequestBodyParams
) {
  const body = neutralizeManagedSectionMarkers(params.markdown?.trim() ?? "");
  if (!body) {
    return "";
  }

  const title = params.title?.replace(/\s+/g, " ").trim() ?? "";
  const firstLine = body.split(/\r?\n/, 1)[0] ?? "";
  if (!title || LEADING_HEADING_REGEX.test(firstLine)) {
    return body;
  }

  return `# ${title}\n\n${body}`;
}

function wrapManagedSection(managedContent: string) {
  return [
    GITHUB_PULL_REQUEST_BODY_SECTION_START,
    managedContent,
    GITHUB_PULL_REQUEST_BODY_SECTION_END,
  ].join("\n");
}

function buildManagedContent(params: BuildContentPullRequestBodyParams) {
  const article = formatContentForPullRequest(params);
  if (!article) {
    return buildManagedIntro(params);
  }

  return joinParagraphs([renderOpenInNotraLink(params), article]);
}

function clampPullRequestBody(body: string) {
  if (body.length <= GITHUB_PULL_REQUEST_BODY_MAX_LENGTH) {
    return body;
  }

  const endMarker = `\n${GITHUB_PULL_REQUEST_BODY_SECTION_END}`;
  const notice = `\n\n${PULL_REQUEST_BODY_TRUNCATION_NOTICE}`;
  const maxPrefixLength =
    GITHUB_PULL_REQUEST_BODY_MAX_LENGTH - notice.length - endMarker.length;

  if (maxPrefixLength <= GITHUB_PULL_REQUEST_BODY_SECTION_START.length) {
    return body.slice(0, GITHUB_PULL_REQUEST_BODY_MAX_LENGTH);
  }

  return `${body.slice(0, maxPrefixLength).trimEnd()}${notice}${endMarker}`;
}

export function buildContentPullRequestBody(
  params: BuildContentPullRequestBodyParams
) {
  return clampPullRequestBody(wrapManagedSection(buildManagedContent(params)));
}

export function mergeContentPullRequestBody(
  currentBody: string | null | undefined,
  params: BuildContentPullRequestBodyParams
) {
  const existingBody = currentBody ?? "";
  const managedBody = buildContentPullRequestBody(params);
  const sectionStart = existingBody.indexOf(
    GITHUB_PULL_REQUEST_BODY_SECTION_START
  );
  const sectionEnd = existingBody.indexOf(
    GITHUB_PULL_REQUEST_BODY_SECTION_END,
    sectionStart + GITHUB_PULL_REQUEST_BODY_SECTION_START.length
  );

  if (sectionStart >= 0 && sectionEnd >= sectionStart) {
    return `${existingBody.slice(0, sectionStart)}${managedBody}${existingBody.slice(
      sectionEnd + GITHUB_PULL_REQUEST_BODY_SECTION_END.length
    )}`;
  }

  const legacyManagedContents = [buildManagedIntro(params)];
  if (params.contentUrl && params.badgeUrls) {
    legacyManagedContents.push(
      buildManagedIntro({ ...params, badgeUrls: undefined })
    );
  }

  const legacySummary = draftSummary(params.contentType);

  for (const legacyManagedContent of legacyManagedContents) {
    if (legacyManagedContent === legacySummary) {
      continue;
    }

    const legacySectionStart = existingBody.indexOf(legacyManagedContent);
    if (legacySectionStart < 0) {
      continue;
    }

    const legacySectionEnd = legacySectionStart + legacyManagedContent.length;
    const startsAtParagraphBoundary =
      legacySectionStart === 0 || existingBody[legacySectionStart - 1] === "\n";
    const endsAtParagraphBoundary =
      legacySectionEnd === existingBody.length ||
      existingBody[legacySectionEnd] === "\n";

    if (startsAtParagraphBoundary && endsAtParagraphBoundary) {
      return `${existingBody.slice(0, legacySectionStart)}${managedBody}${existingBody.slice(
        legacySectionEnd
      )}`;
    }
  }

  if (
    existingBody.trim() === legacySummary ||
    legacyManagedContents.includes(existingBody.trim())
  ) {
    return managedBody;
  }

  if (!existingBody.trim()) {
    return managedBody;
  }

  return `${existingBody.trimEnd()}\n\n${managedBody}`;
}
