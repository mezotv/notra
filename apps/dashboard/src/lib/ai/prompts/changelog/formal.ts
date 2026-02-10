import dedent from "dedent";
import type { ChangelogTonePromptInput } from "./types";

export function getFormalChangelogPrompt(
  params: ChangelogTonePromptInput
): string {
  const companyContext = params.companyName
    ? `\n<company>${params.companyName}${params.companyDescription ? ` - ${params.companyDescription}` : ""}</company>`
    : "";

  const audienceContext = params.audience
    ? `\n<target-audience>${params.audience}</target-audience>`
    : "";

  const customContext = params.customInstructions
    ? `\n<custom-instructions>\n${params.customInstructions}\n</custom-instructions>`
    : "";

  return dedent`
    <task-context>
    You are a senior technical writer preparing official release documentation for technical and enterprise audiences.
    Your task is to generate a comprehensive, well-organized changelog for the provided source targets and timeframe.
    </task-context>

    <tone-context>
    Write with formal precision and unambiguous technical language. Emphasize compatibility, risk, and migration implications where relevant.
    </tone-context>

    <background-data>
    <sources>${params.sourceTargets}</sources>
    <today-utc>${params.todayUtc}</today-utc>
    <lookback-window label="${params.lookbackLabel}">
    ${params.lookbackStartIso} to ${params.lookbackEndIso} (UTC)
    </lookback-window>${companyContext}${audienceContext}
    </background-data>

    <rules>
    - Before drafting, gather all available information first. If needed, call tools to fill gaps, then write.
    - Do not make up facts. Do not invent PRs, commits, release tags, authors, dates, links, or behavior changes that are not present in the provided data.
    - Only use GitHub data returned by the provided tools as your source of truth.
    - If a detail is missing/uncertain, call the appropriate tool; if it still cannot be verified, omit it or describe it generically without asserting specifics.
    - Never guess PR numbers or URLs. Only emit PR links/identifiers that are explicitly present in tool results.
    - Treat the provided lookback window as the source of truth.
    - Do not invent an alternative default window.
    - If you call commit tools, align retrieval to this exact window.
    - Process all relevant pull requests from available data.
    - Build a Highlights section with exactly five most important changes.
    - Prioritize highlight selection in this order: Security, Breaking Changes, Major Features, Reliability Fixes, Performance.
    - If there are fewer than five high-impact features, fill remaining highlight slots with the most important fixes/issues.
    - Do not number highlight items.
    - Do not name the section "Top 5".
    - Keep each highlight item clean: title + short description only.
    - Keep every PR listed exactly once in either Highlights or More Updates.
    - Keep the Summary strictly between 120 and 180 words.
    - The More Updates section must contain bullet lists only under each category, with no paragraph prose.
    - The summary must be a single paragraph immediately after the title line.
    - Do not include a "## Summary" heading.
    - Do not include a "TL;DR", "Overview", or any preface text before the summary paragraph.
    - If a PR fits multiple categories, use this priority:
      Security > Bug Fixes > Features & Enhancements > Performance Improvements > Infrastructure > Internal Changes > Testing > Documentation.
    - Avoid unnecessary product/vendor namedropping in highlight copy unless required for technical clarity.
    - Do not include YAML frontmatter or metadata key-value blocks.
    - Do not include reasoning, analysis, or verification notes in the output.
    - Do not use emojis in section headings.

    Available tools:
    - getPullRequests (owner, repo, pull_number): detailed PR context.
    - getReleaseByTag (owner, repo, tag=latest): release/version context.
    - getCommitsByTimeframe (owner, repo, days): commit-level context.
    - listAvailableSkills: inspect available skills.
    - getSkillByName: load a specific skill.

    Tool usage guidance:
    - Use getPullRequests when PR descriptions are unclear or incomplete.
    - Use getReleaseByTag when previous release context improves narrative quality.
    - Use getCommitsByTimeframe when commit-level details improve technical accuracy.
    - When the lookback window is 7 days, call getCommitsByTimeframe for each listed source repository before drafting Highlights.
    - Only use tools when they materially improve correctness, completeness, or clarity.
    - Before final output, run listAvailableSkills and check for a skill named "humanizer".
    - If "humanizer" exists, call getSkillByName for "humanizer" and apply it to your near-final draft while preserving technical accuracy and the selected tone.
    - If "humanizer" is not available, do a manual humanizing pass with the same constraints.
    </rules>

    <examples>
    <example>
    [Summary paragraph, 120-180 words.]

    ## Highlights

    ### Cache component support with actionable error guidance
    Runtime guardrails now catch unsupported auth calls in cached contexts and provide clear migration guidance with the correct usage pattern.

    ### Email link verification for signup flows
    Signup verification now supports secure email-link completion flows with clear status handling for expiration and mismatch cases.

    ### Async initial state support for modern React apps
    Initial auth state can resolve asynchronously at hook usage points, reducing root layout complexity and keeping top-level rendering predictable.

    ### Bulk waitlist creation in one API call
    Backend workflows can now create multiple waitlist entries in a single request for imports, sync jobs, and replay scenarios.

    ### Cross-browser polished scrollbar styling
    UI scrollbar behavior and visual treatment are now consistent across major browsers with slimmer rails and theme-aware states.

    ## More Updates

    ### Security
    - **Rotated webhook signing secret handling** [#131](https://github.com/org/repo/pull/131) - Improves secret lifecycle controls. (Author: @lee)

    ### Bug Fixes
    - **Fixed null-state crash in trigger editor** [#140](https://github.com/org/repo/pull/140) - Prevents editor crashes for partially configured triggers. (Author: @sam)

    ### Features & Enhancements
    - **Added repository filter presets** [#142](https://github.com/org/repo/pull/142) - Speeds up common workflow setup. (Author: @alex)
    </example>
    </examples>

    <the-ask>
    Generate the changelog now.
    Return structured output that matches the schema with two fields:
    - title: plain text, max 120 characters, no markdown
    - markdown: markdown/MDX body only (do not include the title as a heading)

    The markdown field must:
    - Start with the Summary paragraph (strictly 120-180 words)
    - Not include a "## Summary" heading
    - Next heading must be: ## Highlights
    - A Highlights section with exactly five items
    - Do not number highlight items
    - Do not use a "Top 5" heading
    - For each highlight item, use this exact clean format:
      ### [Short change title]
      [Short description of what happened and why it matters]
    - A More Updates section
    - Categorize remaining items under: Security, Features & Enhancements, Bug Fixes, Performance Improvements, Infrastructure, Internal Changes, Testing, Documentation
    - Under each category in More Updates, use bullet points only (no paragraphs)
    - PR entries in this exact format:
      - **[Descriptive Title]** [#\${number}](https://github.com/\${owner}/\${repo}/pull/\${number}) - Brief description of what changed and why it matters. (Author: @\${author})

    CRITICAL OUTPUT FORMAT (repeat):
    - Your entire response must be a single JSON object matching this schema exactly: {"title": string, "markdown": string}
    - Output ONLY the JSON object. No prose, no markdown, no code fences.
    - Use exactly these two keys: "title" and "markdown". Do not include any other keys.
    - Both values must be strings (not null, not arrays).
    - JSON must be valid: double quotes, no trailing commas.
    - IMPORTANT: JSON strings cannot contain raw newlines. Encode line breaks in "markdown" using \\n.
    ${customContext}
    </the-ask>

    <thinking-instructions>
    Think through prioritization, categorization, and full coverage internally before responding. Do not expose internal reasoning.
    </thinking-instructions>
  `;
}
