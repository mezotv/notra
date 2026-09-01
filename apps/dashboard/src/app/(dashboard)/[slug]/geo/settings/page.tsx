import type { Metadata } from "next";
import { Suspense } from "react";

import PageClient from "./page-client";
import { GeoSettingsSkeleton } from "./skeleton";

export const metadata: Metadata = {
  title: "GEO Settings",
};

export const instant = true;

async function PageContent({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  return <PageClient organizationSlug={slug} />;
}

function Page({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  return (
    <Suspense fallback={<GeoSettingsSkeleton />}>
      <PageContent params={params} />
    </Suspense>
  );
}
export default Page;
