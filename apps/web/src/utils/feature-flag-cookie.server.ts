import { cookies } from "next/headers";
import { getFeatureFlagCookieName } from "./feature-flag-keys";

export async function getServerFlagVariant(
  key: string
): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(getFeatureFlagCookieName(key))?.value;
}
