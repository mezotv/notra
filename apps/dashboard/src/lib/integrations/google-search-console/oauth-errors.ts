import { GSC_OAUTH_ERROR_BY_STATUS } from "@/constants/google-search-console";

export function gscOAuthErrorParam(
  status: number,
  fallback = "gsc_auth_failed"
): string {
  return GSC_OAUTH_ERROR_BY_STATUS.get(status) ?? fallback;
}
