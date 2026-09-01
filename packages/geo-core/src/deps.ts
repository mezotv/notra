import { Context } from "effect";

import type {
  GeoContentBillingServiceShape,
  GeoEntitlementServiceShape,
  GeoFeatureFlagServiceShape,
  GeoGenerationServiceShape,
  GeoWorkflowServiceShape,
} from "./types/deps";

/** Host-owned workflow starters used by GEO domain programs. */
export class GeoWorkflowService extends Context.Service<
  GeoWorkflowService,
  GeoWorkflowServiceShape
>()("@notra/geo-core/GeoWorkflowService") {}

/** Host-owned content billing gates and reservation settlement. */
export class GeoContentBillingService extends Context.Service<
  GeoContentBillingService,
  GeoContentBillingServiceShape
>()("@notra/geo-core/GeoContentBillingService") {}

/** Host-owned organization entitlement reads. */
export class GeoEntitlementService extends Context.Service<
  GeoEntitlementService,
  GeoEntitlementServiceShape
>()("@notra/geo-core/GeoEntitlementService") {}

/** Host-owned feature flag reads. */
export class GeoFeatureFlagService extends Context.Service<
  GeoFeatureFlagService,
  GeoFeatureFlagServiceShape
>()("@notra/geo-core/GeoFeatureFlagService") {}

/** Host-owned generation tracking and run-id generation. */
export class GeoGenerationService extends Context.Service<
  GeoGenerationService,
  GeoGenerationServiceShape
>()("@notra/geo-core/GeoGenerationService") {}
