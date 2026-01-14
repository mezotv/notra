import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientWrapper>{children}</DashboardClientWrapper>;
}
