import { Effect } from "effect";

import { GeoEntitlementService } from "../deps";
import type { GeoScanZdrPolicyFields, GeoZdrPolicy } from "../types/geo";
import { geoLogWarn } from "../utils/geo-log";

/**
 * Re-check the ZDR entitlement when a scan runs, not just when settings were
 * saved. Without the add-on no engine gets the ZDR flag; a stored "enforce"
 * flag from a lapsed add-on is dropped and logged. A billing outage keeps
 * enforcement so a paying organization never loses ZDR to a blip.
 */
export const resolveScanZdrPolicy = Effect.fn("geo.resolveZdrPolicy")(
  function* (
    organizationId: string,
    settings: GeoZdrPolicy,
    fields: GeoScanZdrPolicyFields
  ) {
    const entitlements = yield* GeoEntitlementService;
    const entitlement =
      yield* entitlements.resolveZdrEntitlement(organizationId);
    if (entitlement !== "not_entitled") {
      const policy: GeoZdrPolicy = {
        enforceZdr: settings.enforceZdr,
        nonZdrApprovedEngines: settings.nonZdrApprovedEngines,
      };
      return policy;
    }
    if (settings.enforceZdr) {
      yield* geoLogWarn({
        event: "geo.scan.zdr_unentitled",
        organizationId,
        ...fields,
      });
    }
    const unentitled: GeoZdrPolicy = {
      enforceZdr: false,
      nonZdrApprovedEngines: settings.nonZdrApprovedEngines,
      nonEnforcedMode: "none",
    };
    return unentitled;
  }
);
