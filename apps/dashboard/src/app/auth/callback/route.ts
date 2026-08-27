import { handleAuth } from "@workos-inc/authkit-nextjs";
import { Effect } from "effect";

import { syncAuthenticatedUser } from "@/lib/auth/sync";

export const GET = handleAuth({
  returnPathname: "/callback",
  onSuccess: async ({ user, oauthTokens, authenticationMethod }) => {
    await Effect.runPromise(
      syncAuthenticatedUser({
        workosUser: user,
        oauthTokens,
        authenticationMethod,
      })
    );
  },
});
