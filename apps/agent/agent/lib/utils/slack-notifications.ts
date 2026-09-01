import { postSlackNotification } from "@notra/ai/integrations/slack-workspace";
import { getConfiguredAppUrl } from "@notra/ai/utils/url";
import { getSessionAttribute } from "@notra/tools/utils/session";
import { Effect } from "effect";
import type { SessionContext } from "eve/context";

import { CHANNEL_NOT_ENABLED_MESSAGE } from "../constants/slack";
import { DRAFT_NOTIFICATION_LABELS } from "../constants/slack-notifications";

const SLACK_TEXT_ESCAPES: ReadonlyArray<readonly [RegExp, string]> = [
  [/&/gu, "&amp;"],
  [/</gu, "&lt;"],
  [/>/gu, "&gt;"],
];

function escapeSlackText(value: string): string {
  let escaped = value;
  for (const [pattern, replacement] of SLACK_TEXT_ESCAPES) {
    escaped = escaped.replace(pattern, replacement);
  }
  return escaped;
}

export async function notifySlackDraftCreated(
  ctx: SessionContext,
  toolName: string
): Promise<void> {
  const organizationId = getSessionAttribute(ctx, "organizationId");
  if (!organizationId) {
    return;
  }

  const label = DRAFT_NOTIFICATION_LABELS[toolName] ?? "post";
  const userName = getSessionAttribute(ctx, "user_name");
  const text = userName
    ? `:memo: New ${label} draft created from a conversation with ${escapeSlackText(userName)}.`
    : `:memo: New ${label} draft created.`;

  await Effect.runPromise(
    Effect.tryPromise({
      try: () => postSlackNotification(organizationId, text),
      catch: (cause) => cause,
    }).pipe(
      Effect.asVoid,
      Effect.catch((error) =>
        Effect.logWarning("[agent] Slack draft notification failed", error)
      )
    )
  );
}

export function getChannelNotEnabledMessage(installation: {
  organizationSlug: string | null;
}): string {
  const appUrl = getConfiguredAppUrl();
  if (appUrl && installation.organizationSlug) {
    return `The Notra agent is not enabled in this channel. <${appUrl}/${installation.organizationSlug}/integrations/slack|Enable it in your Slack integration settings>.`;
  }
  return CHANNEL_NOT_ENABLED_MESSAGE;
}
