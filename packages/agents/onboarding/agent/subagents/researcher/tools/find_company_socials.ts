import { retrieveBrand } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { brandSocialsResponseSchema } from "../../../lib/schemas/socials";
import { extractHandleFromUrl } from "../../../lib/utils/socials";

export default defineTool({
  description:
    "Find a company's social media accounts by domain via context.dev: X/Twitter, LinkedIn, GitHub, YouTube, Instagram, TikTok, and more, with normalized handles.",
  inputSchema: z.object({
    domain: z.string().min(1),
  }),
  async execute({ domain }) {
    const response = brandSocialsResponseSchema.parse(
      await retrieveBrand(domain)
    );

    return {
      domain: response.brand.domain ?? domain,
      socials: response.brand.socials.map((social) => ({
        type: social.type,
        url: social.url,
        handle: extractHandleFromUrl(social.url),
      })),
    };
  },
});
