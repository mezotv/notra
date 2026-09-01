import { serializeBrandIdentity } from "@notra/ai/utils/organization";
import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { desc, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";

import { listBrandIdentitiesInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createListBrandIdentitiesTool() {
  return defineTool({
    description:
      "Lists the organization's brand identities, including which one is the default. Returns a summary for each brand identity with id, name, default status, website, company name, tone, and language.",
    inputSchema: listBrandIdentitiesInputSchema,
    async execute(_input, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const identities = await db.query.brandSettings.findMany({
        where: eq(brandSettings.organizationId, organizationId),
        orderBy: [desc(brandSettings.isDefault), desc(brandSettings.createdAt)],
      });

      return {
        brandIdentities: identities.map((identity) =>
          serializeBrandIdentity(identity)
        ),
        count: identities.length,
      };
    },
  });
}
