import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { webOrpcClient } from "./client";

export const webOrpc = createTanstackQueryUtils(webOrpcClient, {
  path: ["web"],
});
