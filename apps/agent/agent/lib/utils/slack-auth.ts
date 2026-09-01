import {
  defaultSlackAuth,
  type SlackContext,
  type SlackMessage,
} from "eve/channels/slack";

import type { ResolvedSlackInstallation } from "../types/slack";

export function buildNotraSlackAuth(
  ctx: SlackContext,
  message: SlackMessage,
  installation: ResolvedSlackInstallation
) {
  const auth = defaultSlackAuth(message, ctx);
  if (!auth) {
    return null;
  }

  return {
    ...auth,
    attributes: {
      ...auth.attributes,
      organizationId: installation.organizationId,
      surface: "standalone-chat",
    },
  };
}
