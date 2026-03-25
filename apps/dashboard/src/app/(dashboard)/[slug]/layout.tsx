import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper";
import { validateOrganizationAccess } from "@/lib/auth/actions";

interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const { slug } = await params;

  const { organization } = await validateOrganizationAccess(slug);

  return (
    <DashboardClientWrapper
      initialActiveOrganization={{
        id: organization.id,
        logo: organization.logo,
        name: organization.name,
        slug: organization.slug,
      }}
    >
      {children}
    </DashboardClientWrapper>
  );
}
