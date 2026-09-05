import { DITHER_MOBILE_QUERY } from "@/constants/dithering";

export function subscribeToDitherViewport(onChange: () => void) {
  const query = window.matchMedia(DITHER_MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function getDitherMobileSnapshot() {
  return window.matchMedia(DITHER_MOBILE_QUERY).matches;
}

export function subscribeToPageVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

export function getPageVisibleSnapshot() {
  return document.visibilityState === "visible";
}

export function getDitherEnvironmentServerSnapshot() {
  return false;
}
