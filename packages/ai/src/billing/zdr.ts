import type { ZdrEntitlement, ZdrMode } from "@notra/ai/types/router";

import { autumn } from "./autumn";
import { FEATURES } from "./features";

/**
 * Look up the zero data retention entitlement. Without Autumn only
 * non-production environments count as entitled; a billing outage answers
 * `unknown` so each caller can decide how to fail.
 */
export async function resolveZdrEntitlement(
  organizationId: string
): Promise<ZdrEntitlement> {
  if (!autumn) {
    return process.env.NODE_ENV === "production" ? "not_entitled" : "entitled";
  }
  try {
    const data = await autumn.check({
      customerId: organizationId,
      featureId: FEATURES.ZDR,
    });
    return data.allowed === true ? "entitled" : "not_entitled";
  } catch {
    return "unknown";
  }
}

/**
 * Router default for callers that do not pick a ZDR mode. Entitled
 * organizations fail closed; organizations without the add-on do not get
 * the ZDR flag at all. A billing outage keeps ZDR strict so a paying
 * organization never loses it to a blip.
 */
export async function resolveOrganizationZdrMode(
  organizationId: string
): Promise<ZdrMode> {
  const entitlement = await resolveZdrEntitlement(organizationId);
  return entitlement === "not_entitled" ? "none" : "required";
}
