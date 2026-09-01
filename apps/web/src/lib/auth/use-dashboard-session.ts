"use client";

import { useEffect, useState } from "react";

import { APP_URL } from "@/utils/urls";

const SESSION_ENDPOINT =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api/session"
    : `${APP_URL}/api/session`;

export function useDashboardSession() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(SESSION_ENDPOINT, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setIsAuthenticated(Boolean(data)))
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return isAuthenticated;
}
