import type { Metadata } from "next";
import { McpCommandTabs } from "@/components/mcp/mcp-command-tabs";
import { McpHero } from "@/components/mcp/mcp-hero";
import { McpTerminalDemo } from "@/components/mcp/mcp-terminal-demo";
import { McpToolsGrid } from "@/components/mcp/mcp-tools-grid";
import { MCP_FALLBACK_TOOL_CARDS } from "@/constants/mcp";
import { fetchMcpTools } from "@/lib/mcp/tools";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { formatMcpHeroSubhead } from "@/utils/mcp";
import { PAGE_SOCIAL_IMAGES, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = "Notra MCP Server";
const description =
  "Connect your agent to Notra over MCP to draft changelogs, launch posts, and social updates from the editor it already lives in.";
const url = `${SITE_URL}/mcp`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    siteName: "Notra",
    images: [PAGE_SOCIAL_IMAGES.mcpServer],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [PAGE_SOCIAL_IMAGES.mcpServer.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", url: SITE_URL },
  { name: "MCP Server", url },
]);

export default async function McpPage() {
  const liveTools = await fetchMcpTools();
  const tools = liveTools ?? MCP_FALLBACK_TOOL_CARDS;

  return (
    <div className="flex w-full flex-col items-center gap-8 pb-14 antialiased [font-synthesis:none]">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        type="application/ld+json"
      />
      <McpHero subhead={formatMcpHeroSubhead(tools.length)} />
      <div className="flex w-[min(100%-3rem,62.5rem)] flex-col gap-14 pt-6">
        <McpTerminalDemo toolCount={tools.length} />
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="font-sans font-semibold text-[#1E1E1E] text-[1.0625rem] leading-[1.29] tracking-[-0.01em] dark:text-white">
            Connect from any client
          </h2>
          <McpCommandTabs className="max-w-[45rem]" />
        </section>
        <McpToolsGrid tools={tools} />
      </div>
    </div>
  );
}
