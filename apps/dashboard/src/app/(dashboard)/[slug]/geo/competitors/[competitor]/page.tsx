import type { Metadata } from "next";
import { CompetitorDetailView } from "@/components/geo/competitor-detail-view";
import { PageContainer } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Competitor",
};

async function Page({
  params,
}: {
  params: Promise<{ slug: string; competitor: string }>;
}) {
  const { slug, competitor } = await params;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full px-4 lg:px-6">
        <CompetitorDetailView
          competitor={decodeURIComponent(competitor)}
          organizationSlug={slug}
          variant="page"
        />
      </div>
    </PageContainer>
  );
}
export default Page;
