export function selectGitHubAppInstallationForOwner<
  T extends { accountLogin: string },
>(installations: readonly T[], owner: string | null | undefined) {
  const normalizedOwner = owner?.trim().toLowerCase();
  if (!normalizedOwner) {
    return undefined;
  }

  return installations.find(
    (installation) =>
      installation.accountLogin.toLowerCase() === normalizedOwner
  );
}
