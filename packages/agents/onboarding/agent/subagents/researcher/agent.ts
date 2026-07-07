import { defineAgent } from "eve";
import { GPT_5_5_CONTEXT_WINDOW_TOKENS } from "../../lib/constants/models";
import { researchBriefSchema } from "../../lib/schemas/research-brief";
import { createAgentModel } from "../../lib/utils/model";

export default defineAgent({
  description:
    "Fetches and condenses public company data: brand lookup, website pages, sitemap, web search, tweets, and GitHub. Returns a compact evidence brief with quotes and sources, never raw content.",
  model: createAgentModel("openai/gpt-5.5"),
  modelContextWindowTokens: GPT_5_5_CONTEXT_WINDOW_TOKENS,
  reasoning: "medium",
  outputSchema: researchBriefSchema,
});
