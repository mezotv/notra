import {
  getSidebarOpenFromCookie,
  SIDEBAR_COOKIE_NAME,
} from "@notra/ui/lib/sidebar-state";
import { cookies } from "next/headers";
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper";
import { validateOrganizationAccess } from "@/lib/auth/actions";

interface OrganizationLayoutProps {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function OrganizationLayout({
  children,
  modal,
  params,
}: OrganizationLayoutProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const initialSidebarOpen = getSidebarOpenFromCookie(
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value
  );

  const { organization } = await validateOrganizationAccess(slug);

  return (
    <DashboardClientWrapper
      initialActiveOrganization={{
        createdAt: organization.createdAt,
        id: organization.id,
        logo: organization.logo,
        metadata: organization.metadata ?? undefined,
        name: organization.name,
        slug: organization.slug,
      }}
      initialSidebarOpen={initialSidebarOpen}
      modal={modal}
    >
      {children}
    </DashboardClientWrapper>
  );
}
