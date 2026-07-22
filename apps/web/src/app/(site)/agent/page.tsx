import type { Metadata } from "next";
import { apiUrl, buildAgentJson, siteUrl } from "@/utils/agent-metadata";

export const metadata: Metadata = {
  title: "Notra Agent Interface",
  description:
    "Machine-readable Notra discovery view for agents, API clients, and MCP integrations.",
};

export default function AgentPage() {
  const agent = buildAgentJson();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-28 antialiased [font-synthesis:none]">
      <div className="flex flex-col gap-4">
        <h1 className="font-display font-medium text-[#1E1E1E] text-[2.25rem] leading-[1.1] tracking-[-0.02em] sm:text-[3rem] dark:text-white">
          Notra <span className="text-primary">Agent</span> Interface
        </h1>
        <p className="max-w-2xl font-medium font-sans text-[#1E1E1EBF] text-base leading-7 dark:text-white/70">
          Notra turns shipped product work into changelogs, launch posts, blog
          drafts, marketing assets, and social updates in a saved brand voice.
          Agents should use this view for discovery instead of parsing the
          marketing homepage.
        </p>
      </div>
      <section className="grid gap-4 text-sm md:grid-cols-2">
        <div className="rounded-3xl border border-[#1E1E1E14] bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_15%)_0%,oklab(93.7%_0.019_-0.031_/_75%)_100%)] p-6 dark:border-white/10 dark:bg-none dark:bg-white/[0.02]">
          <h2 className="font-medium font-sans text-[#1E1E1E] text-lg tracking-[-0.015em] dark:text-white">
            Discovery
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[#1E1E1E99] dark:text-white/60">
            <li>Agent JSON: {siteUrl("/.well-known/agent.json")}</li>
            <li>Agent Card: {siteUrl("/.well-known/agent-card.json")}</li>
            <li>API Catalog: {siteUrl("/.well-known/api-catalog")}</li>
            <li>Auth guide: {siteUrl("/auth.md")}</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-[#1E1E1E14] bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_15%)_0%,oklab(93.7%_0.019_-0.031_/_75%)_100%)] p-6 dark:border-white/10 dark:bg-none dark:bg-white/[0.02]">
          <h2 className="font-medium font-sans text-[#1E1E1E] text-lg tracking-[-0.015em] dark:text-white">
            Endpoints
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[#1E1E1E99] dark:text-white/60">
            <li>API: {apiUrl()}</li>
            <li>OpenAPI: {apiUrl("/openapi.json")}</li>
            <li>MCP: {agent.mcp.streamable_http}</li>
            <li>NLWeb ask: {siteUrl("/ask")}</li>
          </ul>
        </div>
      </section>
      <pre className="overflow-auto rounded-2xl border border-[#1E1E1E14] bg-background p-5 font-mono text-[#1E1E1E] text-xs leading-6 dark:border-white/10 dark:text-white/80">
        {JSON.stringify(agent, null, 2)}
      </pre>
    </main>
  );
}
