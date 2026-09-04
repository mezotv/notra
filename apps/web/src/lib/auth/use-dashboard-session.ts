"use client";

import { useEffect, useState } from "react";

import { APP_URL } from "@/utils/urls";

const SESSION_ENDPOINT =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api/session"
    : `${APP_URL}/api/session`;

export interface DashboardSessionState {
  isAuthenticated: boolean;
  isResolved: boolean;
}

export function useDashboardSession(): DashboardSessionState {
  const [state, setState] = useState<DashboardSessionState>({
    isAuthenticated: false,
    isResolved: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(SESSION_ENDPOINT, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setState({
          isAuthenticated: Boolean(data),
          isResolved: true,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState({
          isAuthenticated: false,
          isResolved: true,
        });
      });

    return () => controller.abort();
  }, []);

  return state;
}
