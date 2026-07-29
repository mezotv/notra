import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Chat",
};

async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  return <PageClient organizationSlug={slug} />;
}

export default Page;
