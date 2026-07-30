import { defineTool } from "eve/tools";
import { addReferencesInputSchema } from "../schemas/onboarding-tools";
import { requireOrganizationId } from "../utils/organization";
import { addBrandReferences } from "../utils/references";

export function createAddReferencesTool() {
  return defineTool({
    description:
      "Save strong examples of the company's own writing as brand references in one replay-safe, deduplicated operation. There is no count cap, but only save substantive samples: complete tweets and self-contained owned-blog excerpts with canonical source URLs, never one-line quotes or fragments. Include author, title, publish date, and engagement metadata when known, and preserve any private full-Markdown snapshot descriptors returned by research tools.",
    inputSchema: addReferencesInputSchema,
    async execute({ references }, ctx) {
      return addBrandReferences(requireOrganizationId(ctx), references);
    },
  });
}
