import { serializeBrandIdentity } from "@notra/ai/utils/organization";
import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { getBrandIdentityInputSchema } from "../schemas/assistant-tools";
import { requireOrganizationId } from "../utils/organization";

export function createGetBrandIdentityTool() {
  return defineTool({
    description:
      'Gets one brand identity by id, or the default brand identity if requested. Pass a brandIdentityId from list_brand_identities, or pass "default" to fetch the default brand identity.',
    inputSchema: getBrandIdentityInputSchema,
    async execute({ brandIdentityId }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const identity =
        brandIdentityId === "default"
          ? await db.query.brandSettings.findFirst({
              where: eq(brandSettings.organizationId, organizationId),
              orderBy: [
                desc(brandSettings.isDefault),
                desc(brandSettings.createdAt),
              ],
            })
          : await db.query.brandSettings.findFirst({
              where: and(
                eq(brandSettings.organizationId, organizationId),
                eq(brandSettings.id, brandIdentityId)
              ),
            });

      return {
        brandIdentity: identity ? serializeBrandIdentity(identity) : null,
        found: Boolean(identity),
      };
    },
  });
}
