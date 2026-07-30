import { retrieveBrand } from "@notra/ai/utils/context-dev";
import { defineTool } from "eve/tools";
import { companyDomainInputSchema } from "../schemas/research-tools";
import { brandSocialsResponseSchema } from "../schemas/socials";
import { withTransientRetry } from "../utils/retry";
import { extractHandleFromUrl } from "../utils/socials";

export function createFindCompanySocialsTool() {
  return defineTool({
    description:
      "Find a company's social media accounts by domain via context.dev: X/Twitter, LinkedIn, GitHub, YouTube, Instagram, TikTok, and more, with normalized handles.",
    inputSchema: companyDomainInputSchema,
    async execute({ domain }) {
      const response = brandSocialsResponseSchema.parse(
        await withTransientRetry(() => retrieveBrand(domain), {
          operationName: `Context.dev social lookup for ${domain}`,
        })
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
}
