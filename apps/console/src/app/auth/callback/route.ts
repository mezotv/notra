import { handleAuth } from "@workos-inc/authkit-nextjs";
import { Effect } from "effect";

import { ensureLocalUser } from "@/lib/auth/sync";

export const GET = handleAuth({
  returnPathname: "/dashboard",
  onSuccess: async ({ user }) => {
    await Effect.runPromise(ensureLocalUser(user));
  },
});
