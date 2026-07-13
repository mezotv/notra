import { defineTool } from "eve/tools";
import { addReferencesInputSchema } from "../lib/schemas/onboarding-tools";
import { requireOrganizationId } from "../lib/utils/organization";
import { addBrandReferences } from "../lib/utils/references";

export default defineTool({
  description:
    "Save up to 50 strong examples of the company's own writing as brand references in one replay-safe, deduplicated operation. Prefer complete tweets and concise owned-blog excerpts with canonical source URLs. Preserve any private full-Markdown snapshot descriptors returned by research tools.",
  inputSchema: addReferencesInputSchema,
  async execute({ references }, ctx) {
    return addBrandReferences(requireOrganizationId(ctx), references);
  },
});
