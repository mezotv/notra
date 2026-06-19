import {
  GITHUB_INSTALL_POPUP_HEIGHT,
  GITHUB_INSTALL_POPUP_WIDTH,
} from "@/constants/github";

export function openGitHubInstallPopup(url: string): boolean {
  const screenLeft = window.screenLeft ?? window.screenX;
  const screenTop = window.screenTop ?? window.screenY;
  const viewportWidth =
    window.outerWidth ?? document.documentElement.clientWidth ?? screen.width;
  const viewportHeight =
    window.outerHeight ??
    document.documentElement.clientHeight ??
    screen.height;

  const left =
    screenLeft + Math.max(0, (viewportWidth - GITHUB_INSTALL_POPUP_WIDTH) / 2);
  const top =
    screenTop + Math.max(0, (viewportHeight - GITHUB_INSTALL_POPUP_HEIGHT) / 2);

  const popup = window.open(
    url,
    `github-install-${crypto.randomUUID()}`,
    `popup=yes,noopener,noreferrer,width=${GITHUB_INSTALL_POPUP_WIDTH},height=${GITHUB_INSTALL_POPUP_HEIGHT},left=${left},top=${top}`
  );

  if (!popup) {
    window.location.assign(url);
  }

  return true;
}
