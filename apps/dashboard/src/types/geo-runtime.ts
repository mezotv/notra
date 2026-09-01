import type {
  GeoContentBillingService,
  GeoEntitlementService,
  GeoFeatureFlagService,
  GeoGenerationService,
  GeoWorkflowService,
} from "@notra/geo-core/deps";

export type GeoDashboardRuntime =
  | GeoContentBillingService
  | GeoEntitlementService
  | GeoFeatureFlagService
  | GeoGenerationService
  | GeoWorkflowService;
