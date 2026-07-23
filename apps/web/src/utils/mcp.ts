export function formatMcpHeroSubhead(toolCount: number): string {
  return `${toolCount} tools over MCP. Your agent drafts changelogs, launch posts, and social updates from the editor it already lives in.`;
}

export function formatMcpMoreToolsLabel(hiddenCount: number): string {
  return `+ ${hiddenCount} more tools`;
}

export function formatMcpWhatsNewDiscovery(toolCount: number): string {
  return `notra MCP · ${toolCount} tools discovered automatically`;
}
