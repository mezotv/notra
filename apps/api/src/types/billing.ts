interface GeoEntitlementCheckInput {
  organizationId: string;
  secretKey: string;
}

export type GeoEntitlementChecker = (
  input: GeoEntitlementCheckInput
) => Promise<boolean>;

export interface GeoEntitlementMiddlewareOptions {
  checkEntitlement?: GeoEntitlementChecker;
}
