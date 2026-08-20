"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { GeoIngestSetupDialog } from "@/components/geo/geo-ingest-setup-dialog";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import type { CitationsEmptyProps } from "@/types/geo";

export function CitationsEmpty({ organizationId }: CitationsEmptyProps) {
  const [setupOpen, setSetupOpen] = useState(false);

  return (
    <>
      <EmptyState
        actionLabel="Install tracker"
        description="Install the GEO tracker on your site. When ChatGPT, Claude, Perplexity, or another agent fetches a page, the request shows up here live."
        onActionClick={() => setSetupOpen(true)}
        preview={
          <EmptyStateTablePreview
            columns={EMPTY_STATE_TABLE_COLUMNS.citations}
            rows={EMPTY_STATE_TABLE_ROWS}
          />
        }
        title="No crawler visits yet"
      />
      <GeoIngestSetupDialog
        onOpenChange={setSetupOpen}
        open={setupOpen}
        organizationId={organizationId}
      />
    </>
  );
}
