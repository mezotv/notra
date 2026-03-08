import dedent from "dedent";
import type { BlogPostTonePromptInput } from "@/types/ai/prompts";

export function getBlogPostUserPrompt(params: BlogPostTonePromptInput): string {
  const companyContext = params.companyName
    ? `\n<company>${params.companyName}${params.companyDescription ? ` - ${params.companyDescription}` : ""}</company>`
    : "";

  const audienceContext = params.audience
    ? `\n<target-audience>${params.audience}</target-audience>`
    : "";

  const languageContext = params.language
    ? `\n<language>${params.language}</language>`
    : "";

  const customContext = params.customInstructions
    ? `\n<custom-instructions>\n${params.customInstructions}\n</custom-instructions>`
    : "";

  return dedent`
    Use this context when generating the blog post:
    CRITICAL LANGUAGE RULE: IF <language> IS PRESENT, WRITE THE FINAL BLOG POST PRIMARILY IN THAT LANGUAGE. ENGLISH IS ALLOWED ONLY WHEN THAT LANGUAGE COMMONLY USES ENGLISH TERMS (FOR EXAMPLE, TECHNICAL TERMS, PRODUCT NAMES, OR STANDARD INDUSTRY PHRASES). DO NOT SWITCH FULL SENTENCES OR PARAGRAPHS TO ENGLISH UNLESS <language> IS ENGLISH, EVEN IF OTHER INSTRUCTIONS OR EXAMPLES ARE IN ENGLISH.

    <background-data>
    <sources>${params.sourceTargets}</sources>
    <today-utc>${params.todayUtc}</today-utc>
    <lookback-window label="${params.lookbackLabel}">
    ${params.lookbackStartIso} to ${params.lookbackEndIso} (UTC)
    </lookback-window>${companyContext}${audienceContext}${languageContext}
    </background-data>${customContext}
  `;
}
