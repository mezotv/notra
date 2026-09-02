import { geoContentBriefSchema } from "@notra/ai/schemas/geo-writer";
import type {
  GeoBriefInternalLink,
  GeoBriefSection,
  GeoContentBrief,
  GeoContentSubtype,
} from "@notra/ai/types/geo-writer";

const EMPTY_CLAIMS = "(no required claims)";
const EMPTY_LIST = "(none listed)";
const EMPTY_CHECKLIST = "(follow the GEO writing rules)";
const HEADER_PREFIXES = [
  "working title",
  "target prompt",
  "intent",
  "type",
  "audience",
  "job to be done",
] as const;
const FAQ_HEADING = "faq";
const LINKS_HEADING = "internal links";
const CHECKLIST_HEADING = "acceptance checklist";
const TYPE_LINE_REGEX = /^blog post\s*\(([^)]+)\)\s*$/i;
const BULLET_LINE_REGEX = /^- (.+)$/;
const HEADING_REGEX = /^##\s+(.+)$/;

function escapeMarkdownLinkUrl(url: string): string {
  return url
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function unescapeMarkdownLinkUrl(url: string): string {
  return url.replaceAll(/\\([\\()])/g, "$1");
}

function escapeMarkdownLinkLabel(label: string): string {
  return label
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
}

function unescapeMarkdownLinkLabel(label: string): string {
  return label.replaceAll(/\\([\\[\]])/g, "$1");
}

function formatListItem(value: string, emptyToken: string): string {
  return `- ${value === emptyToken ? `\\${value}` : value}`;
}

export function geoBriefToMarkdown(brief: GeoContentBrief): string {
  const sections = brief.sections
    .map((section) => {
      const claims =
        section.claims.length > 0
          ? section.claims
              .map((claim) => formatListItem(claim, EMPTY_CLAIMS))
              .join("\n")
          : `- ${EMPTY_CLAIMS}`;
      return `## ${section.heading}\n\n${section.goal}\n\n${claims}`;
    })
    .join("\n\n");
  const questions =
    brief.questionsToAnswer.length > 0
      ? brief.questionsToAnswer
          .map((question) => formatListItem(question, EMPTY_LIST))
          .join("\n")
      : `- ${EMPTY_LIST}`;
  const links =
    brief.internalLinks.length > 0
      ? brief.internalLinks
          .map(
            (link) =>
              `- [${escapeMarkdownLinkLabel(link.anchor)}](${escapeMarkdownLinkUrl(link.url)}): ${link.why}`
          )
          .join("\n")
      : `- ${EMPTY_LIST}`;
  const checklist =
    brief.acceptanceChecklist.length > 0
      ? brief.acceptanceChecklist
          .map((item) => formatListItem(item, EMPTY_CHECKLIST))
          .join("\n")
      : `- ${EMPTY_CHECKLIST}`;

  return [
    `Working title: ${brief.workingTitle}`,
    `Target prompt: ${brief.targetPrompt}`,
    `Intent: ${brief.intent}`,
    `Type: blog post (${brief.contentSubtype})`,
    `Audience: ${brief.audience}`,
    `Job to be done: ${brief.jobToBeDone}`,
    "",
    sections,
    "",
    "## FAQ",
    "",
    questions,
    "",
    "## Internal links",
    "",
    links,
    "",
    "## Acceptance checklist",
    "",
    checklist,
  ].join("\n");
}

export function markdownToGeoBrief(
  markdown: string,
  fallback: Pick<GeoContentBrief, "workingTitle" | "contentSubtype">
): GeoContentBrief | null {
  const blocks = splitMarkdownBlocks(markdown);
  if (!blocks) {
    return null;
  }

  const parsed = geoContentBriefSchema.safeParse({
    targetPrompt: blocks.headers.get("target prompt") ?? "",
    intent: blocks.headers.get("intent") ?? "",
    contentSubtype: parseContentSubtype(
      blocks.headers.get("type"),
      fallback.contentSubtype
    ),
    workingTitle: blocks.headers.get("working title") ?? fallback.workingTitle,
    audience: blocks.headers.get("audience") ?? "",
    jobToBeDone: blocks.headers.get("job to be done") ?? "",
    sections: blocks.sections,
    questionsToAnswer: blocks.questionsToAnswer,
    internalLinks: blocks.internalLinks,
    acceptanceChecklist: blocks.acceptanceChecklist,
  });

  return parsed.success ? parsed.data : null;
}

function parseContentSubtype(
  typeLine: string | undefined,
  fallback: GeoContentSubtype
): GeoContentSubtype {
  if (!typeLine) {
    return fallback;
  }
  const match = TYPE_LINE_REGEX.exec(typeLine.trim());
  if (!match?.[1]) {
    return fallback;
  }
  const candidate = match[1].trim().toLowerCase();
  const parsed =
    geoContentBriefSchema.shape.contentSubtype.safeParse(candidate);
  return parsed.success ? parsed.data : fallback;
}

function splitMarkdownBlocks(markdown: string): {
  headers: Map<string, string>;
  sections: GeoBriefSection[];
  questionsToAnswer: string[];
  internalLinks: GeoBriefInternalLink[];
  acceptanceChecklist: string[];
} | null {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const headers = new Map<string, string>();
  const headingIndexes: Array<{ heading: string; index: number }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }
    const heading = HEADING_REGEX.exec(line.trim());
    if (heading?.[1]) {
      headingIndexes.push({ heading: heading[1].trim(), index });
      continue;
    }
    if (headingIndexes.length > 0) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator <= 0) {
      continue;
    }
    const label = line.slice(0, separator).trim().toLowerCase();
    if (!HEADER_PREFIXES.includes(label as (typeof HEADER_PREFIXES)[number])) {
      continue;
    }
    headers.set(label, line.slice(separator + 1).trim());
  }

  const checklistIndex = headingIndexes.findLastIndex(
    (item) => item.heading.toLowerCase() === CHECKLIST_HEADING
  );
  const linksIndex = headingIndexes.findLastIndex(
    (item, index) =>
      index < checklistIndex && item.heading.toLowerCase() === LINKS_HEADING
  );
  const faqIndex = headingIndexes.findLastIndex(
    (item, index) =>
      index < linksIndex && item.heading.toLowerCase() === FAQ_HEADING
  );
  if (
    faqIndex < 0 ||
    linksIndex !== faqIndex + 1 ||
    checklistIndex !== linksIndex + 1 ||
    checklistIndex !== headingIndexes.length - 1
  ) {
    return null;
  }

  const faqHeading = headingIndexes[faqIndex];
  const linksHeading = headingIndexes[linksIndex];
  const checklistHeading = headingIndexes[checklistIndex];
  if (!faqHeading || !linksHeading || !checklistHeading) {
    return null;
  }

  const outlineHeadings = headingIndexes.slice(0, faqIndex);
  const sections: GeoBriefSection[] = [];
  for (const [outlineIndex, item] of outlineHeadings.entries()) {
    const start = item.index + 1;
    const nextHeading = outlineHeadings[outlineIndex + 1] ?? faqHeading;
    const end = nextHeading.index;
    const body = lines.slice(start, end).map((line) => line.trim());
    const bullets = body.filter((line) => BULLET_LINE_REGEX.test(line));
    const goal = body
      .filter((line) => line.length > 0 && !BULLET_LINE_REGEX.test(line))
      .join(" ")
      .trim();
    if (!goal) {
      return null;
    }
    const claims = parseListItems(bullets, EMPTY_CLAIMS);
    if (!claims) {
      return null;
    }
    sections.push({
      heading: item.heading,
      goal,
      claims,
    });
  }

  const faq = parseListItems(
    linesBetween(lines, faqHeading, linksHeading),
    EMPTY_LIST
  );
  const links = parseInternalLinks(
    linesBetween(lines, linksHeading, checklistHeading)
  );
  const checklist = parseListItems(
    lines.slice(checklistHeading.index + 1),
    EMPTY_CHECKLIST
  );
  if (!(faq && links && checklist)) {
    return null;
  }

  return {
    headers,
    sections,
    questionsToAnswer: faq,
    internalLinks: links,
    acceptanceChecklist: checklist,
  };
}

function linesBetween(
  lines: string[],
  start: { index: number },
  end: { index: number }
): string[] {
  return lines.slice(start.index + 1, end.index);
}

function parseListItems(lines: string[], emptyToken: string): string[] | null {
  const content = lines.map((line) => line.trim()).filter(Boolean);
  if (content.length === 0) {
    return [];
  }
  if (content.length === 1 && content[0] === `- ${emptyToken}`) {
    return [];
  }

  const items: string[] = [];
  for (const line of content) {
    const match = BULLET_LINE_REGEX.exec(line.trim());
    if (!match?.[1]) {
      return null;
    }
    const value = match[1].trim();
    if (value === emptyToken) {
      return null;
    }
    items.push(value === `\\${emptyToken}` ? emptyToken : value);
  }
  return items;
}

function parseInternalLinks(lines: string[]): GeoBriefInternalLink[] | null {
  const content = lines.map((line) => line.trim()).filter(Boolean);
  if (content.length === 0) {
    return [];
  }
  if (content.length === 1 && content[0] === `- ${EMPTY_LIST}`) {
    return [];
  }

  const links: GeoBriefInternalLink[] = [];
  for (const line of content) {
    const link = parseInternalLink(line);
    if (!link) {
      return null;
    }
    links.push(link);
  }
  return links;
}

function parseInternalLink(line: string): GeoBriefInternalLink | null {
  if (!line.startsWith("- [")) {
    return null;
  }
  let anchorEnd = -1;
  for (let index = 3; index < line.length - 1; index += 1) {
    if (line[index] === "\\") {
      index += 1;
      continue;
    }
    if (line[index] === "]" && line[index + 1] === "(") {
      anchorEnd = index;
      break;
    }
  }
  if (anchorEnd < 0) {
    return null;
  }
  const anchor = unescapeMarkdownLinkLabel(line.slice(3, anchorEnd).trim());
  const urlStart = anchorEnd + 2;
  let depth = 0;
  for (let index = urlStart; index < line.length; index += 1) {
    const character = line[index];
    if (character === "\\" && index + 1 < line.length) {
      index += 1;
      continue;
    }
    if (character === "(") {
      depth += 1;
      continue;
    }
    if (character !== ")") {
      continue;
    }
    if (depth > 0) {
      depth -= 1;
      continue;
    }
    if (line[index + 1] !== ":") {
      return null;
    }
    const url = unescapeMarkdownLinkUrl(line.slice(urlStart, index).trim());
    const why = line.slice(index + 2).trim();
    if (!(anchor && url && why)) {
      return null;
    }
    return { anchor, url, why };
  }
  return null;
}
