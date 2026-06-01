const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog_post: "Blog post",
  changelog: "Changelog",
  investor_update: "Investor update",
  image: "Image",
  linkedin_post: "LinkedIn post",
  twitter_post: "Twitter post",
};

function ordinalSuffix(day: number) {
  if (day >= 11 && day <= 13) {
    return "th";
  }

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function getContentTypeLabel(contentType: string) {
  return (
    CONTENT_TYPE_LABELS[contentType] ??
    contentType
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export function formatPostCollectionDate(date: Date) {
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}${ordinalSuffix(day)} ${year}`;
}

export function buildPostCollectionName(
  contentTypes: string[],
  date = new Date()
) {
  const uniqueContentTypes = Array.from(new Set(contentTypes));
  const visibleLabels = uniqueContentTypes
    .slice(0, 2)
    .map((contentType) => getContentTypeLabel(contentType));
  const hiddenCount = uniqueContentTypes.length - visibleLabels.length;
  const contentLabel =
    hiddenCount > 0
      ? `${visibleLabels.join(", ")} + ${hiddenCount} more`
      : visibleLabels.join(", ");

  return `${contentLabel || "Content"} - ${formatPostCollectionDate(date)}`;
}
