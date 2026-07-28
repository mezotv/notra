import type { Metadata } from "next";
import { isAgentChatEnabled } from "@/lib/agent/flag";
import AgentChatClient from "./agent-chat-client";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Chat",
};

async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  if (isAgentChatEnabled()) {
    return <AgentChatClient organizationSlug={slug} />;
  }

  return <PageClient organizationSlug={slug} />;
}

export default Page;
