import "zod/compile";
import { geoOrganizationInputSchema } from "@notra/geo-core/schemas/geo";
import { z } from "zod";

import { GEO_SCAN_TRIGGERS } from "@/constants/geo-analytics";

export const geoScanTriggerSchema = z.enum(GEO_SCAN_TRIGGERS);

export const geoScanStartInputSchema = geoOrganizationInputSchema.extend({
  trigger: geoScanTriggerSchema.optional(),
});
