import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import PostForMe from "post-for-me";
import type { SocialPostResult } from "post-for-me/resources/social-post-results";
import {
  SOCIAL_PUBLISH_POLL_ATTEMPTS,
  SOCIAL_PUBLISH_POLL_DELAY,
} from "../constants/social";
import { SocialPublishError } from "../schemas/social";
import type {
  PublishTwitterPostParams,
  PublishTwitterPostResult,
} from "../types/social";

let cachedClient: { apiKey: string; client: PostForMe } | null = null;

function getTwitterPublishClient(): PostForMe | null {
  const apiKey =
    process.env.POST_FOR_ME_API_KEY_TWITTER ||
    process.env.POST_FOR_ME_API_KEY ||
    null;
  if (!apiKey) {
    return null;
  }
  if (cachedClient?.apiKey === apiKey) {
    return cachedClient.client;
  }
  const client = new PostForMe({ apiKey });
  cachedClient = { apiKey, client };
  return client;
}

function getResultErrorMessage(result: SocialPostResult): string {
  const { error } = result;
  if (typeof error === "string" && error) {
    return error;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }
  return "The platform rejected the post";
}

export function publishTwitterPost(
  params: PublishTwitterPostParams
): Effect.Effect<PublishTwitterPostResult, SocialPublishError> {
  return Effect.gen(function* () {
    const client = getTwitterPublishClient();
    if (!client) {
      return yield* Effect.fail(
        new SocialPublishError({
          cause: null,
          message: "Social publishing is not configured",
        })
      );
    }

    const account = yield* Effect.tryPromise({
      try: () =>
        db.query.connectedSocialAccounts.findFirst({
          columns: { providerAccountId: true, username: true },
          where: and(
            eq(connectedSocialAccounts.id, params.accountId),
            eq(connectedSocialAccounts.organizationId, params.organizationId),
            eq(connectedSocialAccounts.provider, "twitter")
          ),
        }),
      catch: (cause) =>
        new SocialPublishError({
          cause,
          message: "Failed to load the connected account",
        }),
    });

    if (!account) {
      return yield* Effect.fail(
        new SocialPublishError({
          cause: null,
          message: "Connected account not found",
        })
      );
    }

    const post = yield* Effect.tryPromise({
      try: () =>
        client.socialPosts.create({
          caption: params.content,
          social_accounts: [account.providerAccountId],
        }),
      catch: (cause) =>
        new SocialPublishError({ cause, message: "Failed to publish post" }),
    });

    let postResult: SocialPostResult | null = null;
    for (let attempt = 0; attempt < SOCIAL_PUBLISH_POLL_ATTEMPTS; attempt++) {
      yield* Effect.sleep(SOCIAL_PUBLISH_POLL_DELAY);
      const results = yield* Effect.tryPromise({
        try: () => client.socialPostResults.list({ post_id: [post.id] }),
        catch: (cause) =>
          new SocialPublishError({
            cause,
            message: "Failed to load the published post",
          }),
      }).pipe(Effect.catch(() => Effect.succeed(null)));

      postResult = results?.data.at(0) ?? null;
      if (postResult) {
        break;
      }
    }

    if (postResult && !postResult.success) {
      return yield* Effect.fail(
        new SocialPublishError({
          cause: null,
          message: getResultErrorMessage(postResult),
        })
      );
    }

    const platformPostId = postResult?.platform_data?.id ?? null;
    const platformPostUrl = postResult?.platform_data?.url ?? null;
    const postUrl =
      platformPostUrl ??
      (platformPostId
        ? `https://x.com/${account.username}/status/${platformPostId}`
        : null);

    return {
      postUrl,
      username: account.username,
      confirmed: postResult !== null,
    };
  });
}
