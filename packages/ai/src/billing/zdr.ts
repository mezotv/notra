import { autumn } from "./autumn";
import { FEATURES } from "./features";

/**
 * Whether the organization is entitled to zero data retention. Mirrors the
 * dashboard check: without Autumn only non-production environments count as
 * entitled, and a billing outage counts as not entitled so gates fail closed.
 */
export async function hasZdrEntitlement(
  organizationId: string
): Promise<boolean> {
  if (!autumn) {
    return process.env.NODE_ENV !== "production";
  }
  try {
    const data = await autumn.check({
      customerId: organizationId,
      featureId: FEATURES.ZDR,
    });
    return data.allowed === true;
  } catch {
    return false;
  }
}
