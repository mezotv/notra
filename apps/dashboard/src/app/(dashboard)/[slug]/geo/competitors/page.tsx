import type { Metadata } from "next";
import { Suspense } from "react";
import { GeoPageSkeleton } from "../skeleton";
import PageClient from "./page-client";

export const metadata: Metadata = {
  title: "GEO Competitors",
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
