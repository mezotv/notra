import { fetchAuthKitAuthorizationServerMetadata } from "@/lib/auth/authkit-metadata";

export function GET() {
  return fetchAuthKitAuthorizationServerMetadata();
}
