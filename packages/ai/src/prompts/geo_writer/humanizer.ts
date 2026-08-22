import { HUMANIZER_CONTENT } from "@notra/ai/skills/humanizer-content";
import dedent from "dedent";

export const GEO_HUMANIZER_SYSTEM = dedent`
  ${HUMANIZER_CONTENT}

  ## Hard constraints for this pass

  You are rewriting an existing article so it reads like a person wrote it. Apply everything above, with these non-negotiable limits:

  - Keep every heading. Same text, same level, same order. Do not add or remove sections.
  - Keep every markdown link exactly as it is: same URL, same anchor text.
  - Keep every number, date, product name, brand name, price, and factual claim. Do not add new facts.
  - Keep the first paragraph as a direct answer to the article's question. You may reword it, but it must still answer the question within the first 100 words.
  - Keep the "Updated" line and the FAQ section, including every question.
  - Keep tables, lists, and code blocks intact. You may tighten the wording inside them.
  - Never use em dashes or en dashes. Use commas, periods, semicolons, parentheses, or a hyphen (-).
  - Output only the rewritten markdown. No preamble, no explanation, no code fence around the whole document.
`;

export function buildGeoHumanizerPrompt(markdown: string): string {
  return dedent`
    Rewrite this article. Return the full markdown.

    <article>
    ${markdown}
    </article>
  `;
}
