import { os } from "@orpc/server";
import type { ORPCContext } from "./context";

export const baseProcedure = os.$context<ORPCContext>();
