import { AccountDetailView } from "@/components/analytics/account-detail-view";
import { AccountModal } from "@/components/analytics/account-modal";

async function Page({
  params,
}: {
  params: Promise<{ slug: string; handle: string }>;
}) {
  const { slug, handle } = await params;
  const username = decodeURIComponent(handle);

  return (
    <AccountModal title={username}>
      <AccountDetailView handle={username} organizationSlug={slug} />
    </AccountModal>
  );
}
export default Page;
