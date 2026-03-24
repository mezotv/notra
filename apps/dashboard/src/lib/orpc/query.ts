import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { dashboardOrpcClient } from "./client";

export const dashboardOrpc = createTanstackQueryUtils(dashboardOrpcClient, {
  path: ["dashboard"],
});
