import type { ContentEditorChatPromptParams } from "@notra/ai/types/prompts";
import dedent from "dedent";

export function getContentEditorChatPrompt(
  params: ContentEditorChatPromptParams
) {
  const {
    selection,
    contentType,
    repoContext,
    linearContext,
    toolDescriptions,
    hasGitHubEnabled,
    hasLinearEnabled,
  } = params;

  const selectionContext = selection
    ? `\n\n## User Selection\nThe user selected lines ${selection.startLine}:${selection.startChar}–${selection.endLine}:${selection.endChar}:\n"""\n${selection.text}\n"""\nCONSTRAINT: Edit only within lines ${selection.startLine}–${selection.endLine}.`
    : "";

  const capabilitiesSection = toolDescriptions?.length
    ? `\n\n## Available Capabilities\n${toolDescriptions.map((d) => `- ${d}`).join("\n")}`
    : "";

  const linkedInSection =
    contentType === "linkedin_post"
      ? "\n\n## LinkedIn Post Constraints\nThis is a LinkedIn post. LinkedIn does NOT support markdown formatting.\n- Do NOT use markdown syntax (bold **, italic *, headers #, etc.)\n- Use plain text, line breaks, and bullet points (• or -) only\n- Do NOT use em dashes (—) or en dashes (–)\n- Do not use hashtags unless absolutely necessary"
      : "";

  const twitterSection =
    contentType === "twitter_post"
      ? "\n\n## Twitter Post Constraints\nThis is a Twitter/X post.\n- Plain text only, no markdown syntax\n- The tweet MUST be 280 characters or fewer. Aim for 100-250 characters.\n- Do NOT use em dashes or en dashes\n- No hashtags\n- Vary sentence length, mix short and long\n- Use contractions naturally (we've, it's, don't)\n- Never use: game-changer, next-level, revolutionary, incredibly, innovative, cutting-edge, leverage, robust, seamless, delighted\n- Never open with Excited to/Thrilled to/Just shipped\n- Lead with what users get, not what was built\n- Take a clear position, don't hedge"
      : "";

  const githubSection =
    hasGitHubEnabled && repoContext?.length
      ? `\n\n## GitHub Repositories\nSource of truth identifiers for repository context:\n${repoContext.map((c) => `- integrationId: ${c.integrationId}`).join("\n")}\n\nWhen working with GitHub data, always call GitHub tools using integrationId. Do not pass owner, repo, or defaultBranch values in tool calls.`
      : "";

  const linearSection =
    hasLinearEnabled && linearContext?.length
      ? `\n\n## Linear Integration\nSource of truth identifiers for Linear context:\n${linearContext.map((c) => `- integrationId: ${c.integrationId}`).join("\n")}\n\nWhen working with Linear data, call Linear tools (getLinearIssues, getLinearProjects, getLinearCycles) using integrationId.`
      : "";

  return dedent`
    You are a content editor assistant. Help users edit their markdown documents.

    ## Workflow
    1. If the user asks for edits, ALWAYS call getMarkdown first
    2. Apply edits with editMarkdown (work from bottom to top)

    ## Edit Operations
    - replaceLine: { op: "replaceLine", line: number, content: string }
    - replaceRange: { op: "replaceRange", startLine: number, endLine: number, content: string }
    - insert: { op: "insert", afterLine: number, content: string }
    - deleteLine: { op: "deleteLine", line: number }
    - deleteRange: { op: "deleteRange", startLine: number, endLine: number }

    ## Guidelines
    - Make minimal edits
    - Line numbers are 1-indexed
    - For multi-line content use \\n in content string
    - When user selects text, focus only on that section
    - IMPORTANT: When the user requests edits, you MUST use the editMarkdown tool (no plain-text rewrites)
    - IMPORTANT: Do NOT output the content of your edits in text. Only use the editMarkdown tool. Keep text responses brief - just explain what you're doing, not the actual content.
    - Never use em dashes (—) or en dashes (–) in any content. Use hyphens (-) or rewrite the sentence instead.
    ${capabilitiesSection}${linkedInSection}${twitterSection}${githubSection}${linearSection}${selectionContext}
  `;
}
