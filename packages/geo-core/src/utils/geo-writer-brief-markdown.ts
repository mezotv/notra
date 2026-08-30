import type { GeoContentBrief } from "@notra/ai/types/geo-writer";

export function geoBriefToMarkdown(brief: GeoContentBrief): string {
  const sections = brief.sections
    .map((section) => {
      const claims =
        section.claims.length > 0
          ? section.claims.map((claim) => `- ${claim}`).join("\n")
          : "- (no required claims)";
      return `## ${section.heading}\n\n${section.goal}\n\n${claims}`;
    })
    .join("\n\n");
  const questions =
    brief.questionsToAnswer.length > 0
      ? brief.questionsToAnswer.map((question) => `- ${question}`).join("\n")
      : "- (none listed)";
  const links =
    brief.internalLinks.length > 0
      ? brief.internalLinks
          .map((link) => `- [${link.anchor}](${link.url}): ${link.why}`)
          .join("\n")
      : "- (none listed)";
  const checklist =
    brief.acceptanceChecklist.length > 0
      ? brief.acceptanceChecklist.map((item) => `- ${item}`).join("\n")
      : "- (follow the GEO writing rules)";

  return [
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
