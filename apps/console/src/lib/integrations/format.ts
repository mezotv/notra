const createdDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatIntegrationDate(iso: string | null) {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return createdDateFormatter.format(date);
}

export function formatDashboardConnectionsLabel(
  githubCount: number,
  linearCount: number
) {
  const parts: string[] = [];
  if (githubCount > 0) {
    parts.push(
      githubCount === 1
        ? "1 GitHub connection"
        : `${githubCount} GitHub connections`
    );
  }
  if (linearCount > 0) {
    parts.push(
      linearCount === 1
        ? "1 Linear connection"
        : `${linearCount} Linear connections`
    );
  }
  return parts.join(" and ");
}
