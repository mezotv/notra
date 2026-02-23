import dedent from "dedent";
import type { LinkedInTonePromptInput } from "@/types/lib/ai/prompts";

export function getLinkedInUserPrompt(params: LinkedInTonePromptInput): string {
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
    Use this context when generating the LinkedIn post:

    <background-data>
    <sources>${params.sourceTargets}</sources>
    <today-utc>${params.todayUtc}</today-utc>
    <lookback-window label="${params.lookbackLabel}">
    ${params.lookbackStartIso} to ${params.lookbackEndIso} (UTC)
    </lookback-window>${companyContext}${audienceContext}
    </background-data>${customContext}
  `;
}
