import { IRIS_CONTROLLER_LEASE_PREFIX } from "@notra/ai/constants/autonomy";

export const buildControllerLeaseName = (organizationId: string): string =>
  `${IRIS_CONTROLLER_LEASE_PREFIX}:${organizationId}`;
