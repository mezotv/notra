import type { Metadata } from "next";

import { AccountDetailView } from "@/components/analytics/account-detail-view";
import { PageContainer } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Account",
};

async function Page({
  params,
}: {
  params: Promise<{ slug: string; handle: string }>;
}) {
  const { slug, handle } = await params;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full px-4 lg:px-6">
        <AccountDetailView
          handle={decodeURIComponent(handle)}
          organizationSlug={slug}
          variant="page"
        />
      </div>
    </PageContainer>
  );
}
export default Page;
