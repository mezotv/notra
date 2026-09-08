export function selectGitHubAppInstallationForOwner<
  T extends { accountLogin: string },
>(installations: readonly T[], owner: string | null | undefined) {
  if (installations.length === 0) {
    return undefined;
  }

  const normalizedOwner = owner?.trim().toLowerCase();
  if (!normalizedOwner) {
    return installations[0];
  }

  return (
    installations.find(
      (installation) =>
        installation.accountLogin.toLowerCase() === normalizedOwner
    ) ?? installations[0]
  );
}
