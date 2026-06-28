"use client";

import { useSyncExternalStore } from "react";
import { OAUTH_GRANT_QUERY_PARAM } from "@/constants/oauth";

const noop = () => undefined;

function subscribeToLocationChanges() {
  return noop;
}

function getOAuthQuerySnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  params.delete(OAUTH_GRANT_QUERY_PARAM);

  return params.toString();
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
