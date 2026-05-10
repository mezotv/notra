"use client";

const TOAST_DEDUPE_STORAGE_KEY = "notra:deduped-toasts";
const TOAST_DEDUPE_LIMIT = 100;

const dedupedToastKeys = new Set<string>();

function loadDedupedToastKeys() {
  if (typeof window === "undefined" || dedupedToastKeys.size > 0) {
    return;
  }

  try {
    const stored = window.sessionStorage.getItem(TOAST_DEDUPE_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) {
      for (const toastKey of parsed) {
        if (typeof toastKey === "string") {
          dedupedToastKeys.add(toastKey);
        }
      }
    }
  } catch {
    window.sessionStorage.removeItem(TOAST_DEDUPE_STORAGE_KEY);
  }
}

export function hasShownToast(toastKey: string) {
  loadDedupedToastKeys();
  return dedupedToastKeys.has(toastKey);
}

export function markToastShown(toastKey: string) {
  loadDedupedToastKeys();
  dedupedToastKeys.add(toastKey);

  if (typeof window === "undefined") {
    return;
  }

  const recentToastKeys = Array.from(dedupedToastKeys).slice(
    -TOAST_DEDUPE_LIMIT
  );
  dedupedToastKeys.clear();
  for (const recentToastKey of recentToastKeys) {
    dedupedToastKeys.add(recentToastKey);
  }

  window.sessionStorage.setItem(
    TOAST_DEDUPE_STORAGE_KEY,
    JSON.stringify(recentToastKeys)
  );
}
