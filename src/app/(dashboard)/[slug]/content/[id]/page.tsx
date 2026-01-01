import type { Metadata } from "next";
import { Suspense } from "react";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "Content Detail",
};

async function Page({
  params,
}: {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}) {
  const { slug, id } = await params;

  return (
    <Suspense>
      <PageClient contentId={id} organizationSlug={slug} />
    </Suspense>
  );
}
export default Page;
