"use client";

import { ErrorContent } from "@/components/error-content";
import type { RouteErrorProps } from "@/types/components/error";

export default function RouteError({ error, reset }: RouteErrorProps) {
  return (
    <ErrorContent className="min-h-[100svh]" error={error} reset={reset} />
  );
}
