import { retrieveBrand } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
import { brandResponseSchema } from "../../../lib/schemas/brand";
import { companyDomainInputSchema } from "../../../lib/schemas/research-tools";
import { withTransientRetry } from "../../../lib/utils/retry";

export default defineTool({
  description:
    "Look up a company by domain via context.dev: identity, description, industry, colors, and social media handles (Twitter/X, LinkedIn).",
  inputSchema: companyDomainInputSchema,
  async execute({ domain }) {
    const response = brandResponseSchema.parse(
      await withTransientRetry(() => retrieveBrand(domain), {
        operationName: `Context.dev brand lookup for ${domain}`,
      })
    );
    const { logos, ...brand } = response.brand;
    return {
      domain,
      brand,
      hasLogos: Array.isArray(logos) && logos.length > 0,
    };
  },
});
