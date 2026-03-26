import { os } from "@orpc/server";
import { assertAuthenticated } from "@/lib/auth/organization";
import type { ORPCContext } from "./context";

export const baseProcedure = os.$context<ORPCContext>();

export const authorizedProcedure = baseProcedure.use(
  async ({ context, next }) => {
    const auth = await assertAuthenticated({ headers: context.headers });

    return next({
      context: {
        ...context,
        session: auth.session,
        user: auth.user,
      },
    });
  }
);
