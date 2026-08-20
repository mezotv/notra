"use client";

import { useState } from "react";
import { ApiKeyRevealField } from "@/components/api-keys/api-key-reveal-field";
import { CodeSnippet } from "@/components/geo/code-snippet";
import {
  GEO_INGEST_DEFAULT_FRAMEWORK,
  GEO_INGEST_FRAMEWORK_OPTIONS,
  GEO_INGEST_INSTALL_COMMAND,
  GEO_INGEST_TOKEN_ENV,
} from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { GeoIngestSetupPanelProps } from "@/types/geo";
import { geoIngestSnippet } from "@/utils/geo-ingest";

export function GeoIngestSetup({ setup, className }: GeoIngestSetupPanelProps) {
  const [framework, setFramework] = useState(GEO_INGEST_DEFAULT_FRAMEWORK);
  const snippet = geoIngestSnippet(setup, framework);
  const file =
    GEO_INGEST_FRAMEWORK_OPTIONS.find((option) => option.value === framework)
      ?.file ?? "proxy.ts";
  const token = setup?.token ?? "";

  return (
    <div className={cn("space-y-5", className)}>
      <section className="space-y-2">
        <h3 className="font-medium text-sm">Install the package</h3>
        <CodeSnippet code={GEO_INGEST_INSTALL_COMMAND} variant="command" />
      </section>
      <section className="space-y-2">
        <h3 className="font-medium text-sm">Add the proxy</h3>
        <CodeSnippet
          code={snippet}
          filename={file}
          headerEnd={
            <fieldset className="m-0 flex shrink-0 items-center border-0 p-0">
              <legend className="sr-only">Framework</legend>
              {GEO_INGEST_FRAMEWORK_OPTIONS.map((option) => {
                const selected = option.value === framework;
                return (
                  <button
                    aria-pressed={selected}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 font-medium text-xs transition-colors",
                      selected
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    key={option.value}
                    onClick={() => setFramework(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </fieldset>
          }
        />
      </section>
      {token ? (
        <section className="space-y-2">
          <h3 className="font-medium text-sm">Set your token</h3>
          <p className="text-muted-foreground text-xs">
            Add this as {GEO_INGEST_TOKEN_ENV} in your site's environment
            variables.
          </p>
          <ApiKeyRevealField value={token} />
        </section>
      ) : null}
    </div>
  );
}
