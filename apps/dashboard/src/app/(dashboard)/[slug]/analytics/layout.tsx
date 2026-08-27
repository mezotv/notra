import type { ReactNode } from "react";

import { AnalyticsProvider } from "@/components/analytics/analytics-context";
import { AnalyticsShell } from "@/components/analytics/analytics-shell";

export default async function AnalyticsLayout({
  children,
  modal,
  params,
}: {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <AnalyticsProvider organizationSlug={slug}>
      <AnalyticsShell>{children}</AnalyticsShell>
      {modal}
    </AnalyticsProvider>
  );
}
