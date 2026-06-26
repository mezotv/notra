import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth/server";

export const GET = oauthProviderAuthServerMetadata(auth, {
  headers: {
    "Cache-Control": "public, max-age=3600",
  },
});
