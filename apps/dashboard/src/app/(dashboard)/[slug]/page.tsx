import type { Metadata } from "next";
import { Suspense } from "react";

import { redirectOrgRootToStoredMode } from "@/lib/nav/org-root-redirect";

import PageClient from "./page-client";
import { DashboardPageSkeleton } from "./skeleton";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function Page({
  params,
  searchParams,
}: {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  await redirectOrgRootToStoredMode(slug, searchParams);

  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <PageClient organizationSlug={slug} />
    </Suspense>
  );
}
export default Page;
