import type { Metadata } from "next";

import PageClient from "../page-client";

export const metadata: Metadata = {
  title: "Chat",
};

async function Page({
  params,
}: {
  params: Promise<{ slug: string; chatId: string }>;
}) {
  const { slug, chatId } = await params;

  return <PageClient chatId={chatId} key={chatId} organizationSlug={slug} />;
}

export default Page;
