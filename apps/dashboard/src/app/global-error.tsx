"use client";

import "@/styles/globals.css";
import { ErrorContent } from "@/components/error-content";
import type { RouteErrorProps } from "@/types/components/error";

export default function GlobalError({ error, reset }: RouteErrorProps) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorContent className="min-h-[100svh]" error={error} reset={reset} />
      </body>
    </html>
  );
}
