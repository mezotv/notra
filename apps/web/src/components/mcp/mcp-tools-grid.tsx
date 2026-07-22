"use client";

import { useState } from "react";
import { MCP_VISIBLE_TOOL_COUNT } from "@/constants/mcp";
import type { McpToolCard, McpToolsGridProps } from "@/types/mcp";
import { formatMcpMoreToolsLabel } from "@/utils/mcp";

const CARD_CLASSNAME =
  "flex flex-col gap-1 rounded-2xl px-5.5 py-4.5 [box-shadow:#ECECEC_0rem_0rem_0rem_0.0625rem] dark:[box-shadow:#FFFFFF14_0rem_0rem_0rem_0.0625rem]";

function ToolCard({ tool }: { tool: McpToolCard }) {
  return (
    <div className={CARD_CLASSNAME}>
      <span className="font-medium font-mono text-[#1E1E1E] text-[0.875rem] leading-[1.36] dark:text-white">
        {tool.name}
      </span>
      <span className="font-sans text-[#1E1E1EA6] text-[0.8125rem] leading-[1.46] dark:text-white/60">
        {tool.description}
      </span>
    </div>
  );
}

export function McpToolsGrid({ tools }: McpToolsGridProps) {
  const [showAllTools, setShowAllTools] = useState(false);

  const visibleTools = tools.slice(0, MCP_VISIBLE_TOOL_COUNT);
  const hiddenTools = tools.slice(MCP_VISIBLE_TOOL_COUNT);

  return (
    <section className="flex w-full flex-col gap-5">
      <h2 className="font-display font-medium text-[#1E1E1E] text-[1.75rem] leading-[1.21] tracking-[-0.02em] dark:text-white">
        What your agent can do
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {visibleTools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
        {showAllTools ? (
          hiddenTools.map((tool) => <ToolCard key={tool.name} tool={tool} />)
        ) : (
          <button
            className="flex cursor-pointer items-center justify-center rounded-2xl border border-[#E4E4E7] border-dashed px-5.5 py-4.5 outline-none transition-colors hover:border-[#D4D4D8] focus-visible:ring-2 focus-visible:ring-ring dark:border-white/15 dark:hover:border-white/25"
            onClick={() => setShowAllTools(true)}
            type="button"
          >
            <span className="font-medium font-sans text-[#1E1E1E80] text-[0.875rem] leading-[1.36] dark:text-white/50">
              {formatMcpMoreToolsLabel(hiddenTools.length)}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
