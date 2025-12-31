import { requireAuth } from "@/actions/auth";
import { dashboardMetadata } from "@/utils/metadata";
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper";

export const metadata = dashboardMetadata;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <DashboardClientWrapper>{children}</DashboardClientWrapper>;
}
