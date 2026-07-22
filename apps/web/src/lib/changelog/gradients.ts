import { CHANGELOG_ROW_GRADIENTS } from "@/constants/changelog";

export function getChangelogRowGradient(index: number) {
  const gradient =
    CHANGELOG_ROW_GRADIENTS[index % CHANGELOG_ROW_GRADIENTS.length];
  return gradient ?? CHANGELOG_ROW_GRADIENTS[0];
}
