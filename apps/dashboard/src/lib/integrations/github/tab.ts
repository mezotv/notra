export function openGitHubInstallTab(url: string) {
  const tab = window.open(url, "_blank", "noopener,noreferrer");

  if (!tab) {
    window.location.assign(url);
  }
}
