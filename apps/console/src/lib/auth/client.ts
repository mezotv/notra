import {
  inferAdditionalFields,
  inferOrgAdditionalFields,
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./server";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
    lastLoginMethodClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
