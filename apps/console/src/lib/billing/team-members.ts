import "server-only";

import { checkTeamMembersLimit } from "@notra/ai/billing/team-members";
import {
  TEAM_MEMBER_LIMIT_CHECK_UNAVAILABLE_MESSAGE,
  TEAM_MEMBER_LIMIT_ERROR_MESSAGE,
} from "@notra/ai/constants/billing-limits";

export async function enforceTeamMembersLimit(organizationId?: string | null) {
  const status = await checkTeamMembersLimit(organizationId);

  if (status === "check-unavailable") {
    throw new Error(TEAM_MEMBER_LIMIT_CHECK_UNAVAILABLE_MESSAGE);
  }

  if (status === "limit-reached") {
    throw new Error(TEAM_MEMBER_LIMIT_ERROR_MESSAGE);
  }
}
