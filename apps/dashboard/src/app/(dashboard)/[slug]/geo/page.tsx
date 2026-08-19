import type { Metadata } from "next";
import { Suspense } from "react";
import PageClient from "./page-client";
import { GeoPageSkeleton } from "./skeleton";

export const metadata: Metadata = {
  title: "GEO",
};

async function Page({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  return (
    <Suspense fallback={<GeoPageSkeleton />}>
      <PageClient organizationSlug={slug} />
    </Suspense>
  );
}
export default Page;
