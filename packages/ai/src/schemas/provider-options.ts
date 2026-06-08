// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

export const gatewayOptionsSchema = z
  .object({
    models: z.array(z.string()).optional(),
  })
  .catchall(z.json());

export type GatewayOptions = z.infer<typeof gatewayOptionsSchema> & {
  caching: "auto";
  models: string[];
};
