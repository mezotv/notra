import { APIError } from "better-auth/api";
import { hasAdminRole } from "@/lib/auth/role";
import type { AssertImpersonationTargetAllowedParams } from "@/types/auth";

export function assertImpersonationTargetAllowed({
  actorUserId,
  target,
}: AssertImpersonationTargetAllowedParams) {
  if (target.id === actorUserId) {
    throw new APIError("BAD_REQUEST", {
      message: "You cannot impersonate your own account",
    });
  }

  if (target.banned) {
    throw new APIError("FORBIDDEN", {
      message: "Banned users cannot be impersonated",
    });
  }

  if (hasAdminRole(target.role)) {
    throw new APIError("FORBIDDEN", {
      message: "Admin users cannot be impersonated",
    });
  }
}
