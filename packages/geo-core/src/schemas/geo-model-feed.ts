import { array, enum as enumType, number, object, string, union } from "zod";

export const geoGatewayModelSchema = object({
  id: string().min(1),
  name: string().min(1),
  owned_by: string().min(1),
  type: string(),
  zdr: enumType(["all", "some", "none"]),
  released: number(),
  deprecated_at: union([number(), string()]).nullish(),
  tags: array(string()).optional(),
});

export const geoModelFeedSchema = object({
  data: array(geoGatewayModelSchema),
});
