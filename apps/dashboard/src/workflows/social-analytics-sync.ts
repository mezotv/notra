import { flattenError } from "zod";

import { socialAnalyticsSyncPayloadSchema } from "@/schemas/analytics";
import type {
  SocialAnalyticsSyncPayload,
  SocialAnalyticsSyncResult,
} from "@/types/analytics";

import {
  listSyncableAccounts,
  snapshotAccountDimensions,
  syncTwitterAnalytics,
} from "./steps/social-analytics-steps";

export async function socialAnalyticsSyncWorkflow(
  payload: SocialAnalyticsSyncPayload
): Promise<SocialAnalyticsSyncResult> {
  "use workflow";

  const parseResult = socialAnalyticsSyncPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error(
      "[Social Analytics] Invalid payload:",
      flattenError(parseResult.error)
    );
    return { status: "invalid_payload" };
  }

  const accounts = await listSyncableAccounts(parseResult.data.organizationId);
  if (accounts.length === 0) {
    return { status: "completed", syncedAccounts: 0, syncedPosts: 0 };
  }

  const syncedAccounts = await snapshotAccountDimensions(accounts);
  const twitterResult = await syncTwitterAnalytics(accounts);

  return {
    status: "completed",
    syncedAccounts,
    syncedPosts: twitterResult.posts,
  };
}
