import { normalizeTwitterProfileImageUrl } from "@/constants/twitter";
import type {
  ResolvedTwitterAccount,
  TwitterUserByUsernameResponse,
} from "@/types/analytics";
import { twitterAppFetch } from "@/utils/twitter-fetcher";

const TWITTER_RESOLVE_USER_FIELDS =
  "name,profile_image_url,public_metrics,verified,verified_type";
const LEADING_AT_REGEX = /^@/;

export async function resolveTwitterAccount(
  username: string
): Promise<ResolvedTwitterAccount | null> {
  const handle = username.trim().replace(LEADING_AT_REGEX, "");
  if (handle.length === 0) {
    return null;
  }

  const params = new URLSearchParams({
    "user.fields": TWITTER_RESOLVE_USER_FIELDS,
  });
  const response = await twitterAppFetch(
    `https://api.x.com/2/users/by/username/${encodeURIComponent(handle)}?${params.toString()}`
  );
  if (!response.ok) {
    return null;
  }

  const json: TwitterUserByUsernameResponse = await response.json();
  const user = json.data;
  if (!user?.id) {
    return null;
  }

  const verifiedType = user.verified_type ?? "none";
  return {
    providerAccountId: user.id,
    username: user.username,
    displayName: user.name ?? null,
    profileImageUrl: user.profile_image_url
      ? normalizeTwitterProfileImageUrl(user.profile_image_url)
      : null,
    verified: user.verified === true || verifiedType !== "none",
    verifiedType,
    followersCount: user.public_metrics?.followers_count ?? null,
  };
}
