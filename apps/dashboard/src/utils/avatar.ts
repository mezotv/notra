const DICEBEAR_GLASS_URL = "https://api.dicebear.com/9.x/glass/svg";

export function getUserAvatarUrl(
  image: string | null | undefined,
  seed: string
): string {
  return image ?? `${DICEBEAR_GLASS_URL}?seed=${encodeURIComponent(seed)}`;
}
