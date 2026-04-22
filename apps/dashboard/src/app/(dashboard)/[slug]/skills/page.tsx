import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Skills",
};

async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PageClient slug={slug} />;
}

export default Page;
