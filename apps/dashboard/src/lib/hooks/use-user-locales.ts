"use client";

import { useSyncExternalStore } from "react";

const EMPTY_LOCALES: readonly string[] = [];

let cachedKey = "";
let cachedLocales: readonly string[] = EMPTY_LOCALES;

function subscribe(onChange: () => void) {
  window.addEventListener("languagechange", onChange);
  return () => window.removeEventListener("languagechange", onChange);
}

function getSnapshot(): readonly string[] {
  const locales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  const key = locales.join(",");

  if (key !== cachedKey) {
    cachedKey = key;
    cachedLocales = locales;
  }

  return cachedLocales;
}

function getServerSnapshot(): readonly string[] {
  return EMPTY_LOCALES;
}

export function useUserLocales(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
