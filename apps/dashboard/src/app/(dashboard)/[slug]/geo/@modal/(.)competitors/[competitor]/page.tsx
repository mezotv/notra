import { CompetitorDetailView } from "@/components/geo/competitor-detail-view";
import { CompetitorModal } from "@/components/geo/competitor-modal";

async function Page({
  params,
}: {
  params: Promise<{ slug: string; competitor: string }>;
}) {
  const { slug, competitor } = await params;
  const name = decodeURIComponent(competitor);

  return (
    <CompetitorModal title={name}>
      <CompetitorDetailView competitor={name} organizationSlug={slug} />
    </CompetitorModal>
  );
}
export default Page;
