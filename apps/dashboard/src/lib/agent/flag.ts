export function isAgentChatEnabled(): boolean {
  return (
    process.env.NOTRA_AGENT_CHAT === "1" &&
    Boolean(process.env.EVE_NOTRA_AGENT_URL)
  );
}

export function isAgentContentGenerationEnabled(): boolean {
  return (
    process.env.NOTRA_AGENT_CONTENT === "1" &&
    Boolean(process.env.EVE_NOTRA_AGENT_URL)
  );
}
