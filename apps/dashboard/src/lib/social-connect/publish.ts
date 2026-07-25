import { db } from "@notra/db/drizzle";
import { connectedSocialAccounts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import {
  getSocialConnectClient,
  isSocialConnectConfigured,
} from "@/lib/social-connect/client";
import {
  SocialConnectConfigError,
  SocialConnectRequestError,
} from "@/lib/social-connect/errors";
import type {
  PublishSocialPostParams,
  SocialConnectPostGetResult,
  SocialConnectPublishedPost,
  SocialConnectPublishResult,
} from "@/types/services/social-connect";

export const publishSocialPost = Effect.fn("publishSocialPost")(function* (
  params: PublishSocialPostParams
) {
  if (!isSocialConnectConfigured()) {
    return yield* Effect.fail(
      new SocialConnectConfigError({
        message: "Social account linking is not configured",
      })
    );
  }

  const account = yield* Effect.tryPromise({
    try: () =>
      db.query.connectedSocialAccounts.findFirst({
        columns: { provider: true, providerAccountId: true, username: true },
        where: and(
          eq(connectedSocialAccounts.id, params.accountId),
          eq(connectedSocialAccounts.organizationId, params.organizationId)
        ),
      }),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to load connected account",
        cause,
      }),
  });

  if (!account) {
    return yield* Effect.fail(
      new SocialConnectRequestError({
        message: "Connected account not found",
        cause: null,
      })
    );
  }

  const { data } = yield* Effect.tryPromise({
    try: (): Promise<SocialConnectPublishResult> =>
      getSocialConnectClient().posts.createPost({
        body: {
          content: params.content,
          platforms: [
            {
              platform: account.provider,
              accountId: account.providerAccountId,
            },
          ],
          publishNow: true,
        },
      }),
    catch: (cause) =>
      new SocialConnectRequestError({
        message: "Failed to publish post",
        cause,
      }),
  });

  const postId = data?.post?._id ?? null;
  let platformPostId = getPlatformPostId(data?.post);

  if (!platformPostId && postId) {
    yield* Effect.sleep("2 seconds");
    const refreshed = yield* Effect.tryPromise({
      try: (): Promise<SocialConnectPostGetResult> =>
        getSocialConnectClient().posts.getPost({ path: { postId } }),
      catch: (cause) =>
        new SocialConnectRequestError({
          message: "Failed to load published post",
          cause,
        }),
    }).pipe(Effect.catch(() => Effect.succeed(null)));
    platformPostId = getPlatformPostId(refreshed?.data?.post);
  }

  const postUrl = getPublishedPostUrl(
    account.provider,
    account.username,
    platformPostId
  );

  return {
    postId,
    platformPostId,
    postUrl,
    username: account.username,
    platform: account.provider,
  };
});

function getPublishedPostUrl(
  provider: string,
  username: string,
  platformPostId: string | null
): string | null {
  if (!platformPostId) {
    return null;
  }
  if (provider === "twitter") {
    return `https://x.com/${username}/status/${platformPostId}`;
  }
  if (provider === "linkedin") {
    const urn = platformPostId.startsWith("urn:")
      ? platformPostId
      : `urn:li:share:${platformPostId}`;
    return `https://www.linkedin.com/feed/update/${urn}/`;
  }
  return null;
}

function getPlatformPostId(
  post: SocialConnectPublishedPost | undefined
): string | null {
  const platformPostId = post?.platforms?.at(0)?.platformPostId;
  return platformPostId ?? null;
}
