"use client";

import { useSyncExternalStore } from "react";

const noop = () => undefined;

function subscribeToLocationChanges() {
  return noop;
}

function getOAuthQuerySnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : window.location.search;
}

function getServerOAuthQuerySnapshot() {
  return "";
}

export function OAuthQueryInput() {
  const oauthQuery = useSyncExternalStore(
    subscribeToLocationChanges,
    getOAuthQuerySnapshot,
    getServerOAuthQuerySnapshot
  );

  return <input name="oauth_query" readOnly type="hidden" value={oauthQuery} />;
}
