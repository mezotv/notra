import { auth } from "@/lib/auth/server";
import { publicOAuthAuthorizationServerMetadata } from "@/utils/oauth-metadata";

export const GET = publicOAuthAuthorizationServerMetadata(auth);
