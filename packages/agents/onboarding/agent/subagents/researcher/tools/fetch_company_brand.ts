import { retrieveBrand } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { brandResponseSchema } from "../../../lib/schemas/brand";

export default defineTool({
  description:
    "Look up a company by domain via context.dev: identity, description, industry, colors, and social media handles (Twitter/X, LinkedIn).",
  inputSchema: z.object({
    domain: z.string().min(1),
  }),
  async execute({ domain }) {
    const response = brandResponseSchema.parse(await retrieveBrand(domain));
    const { logos, ...brand } = response.brand;
    return { domain, brand, hasLogos: Boolean(logos) };
  },
});
