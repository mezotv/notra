import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { consoleOrpcClient } from "./client";

export const consoleOrpc = createTanstackQueryUtils(consoleOrpcClient, {
  path: ["console"],
});
