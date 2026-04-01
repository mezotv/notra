import { os } from "@orpc/server";
import type { WebORPCContext } from "./context";

export const baseProcedure = os.$context<WebORPCContext>();
