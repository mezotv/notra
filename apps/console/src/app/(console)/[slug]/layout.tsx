import {
  getSidebarOpenFromCookie,
  SIDEBAR_COOKIE_NAME,
} from "@notra/ui/lib/sidebar-state";
import { cookies } from "next/headers";
import { ConsoleShell } from "@/components/layout/console-shell";
import { validateOrganizationAccess } from "@/lib/auth/actions";
import { hasAdminRole } from "@/lib/auth/role";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const initialSidebarOpen = getSidebarOpenFromCookie(
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value
  );
  const { organization, user } = await validateOrganizationAccess(slug);

  return (
    <ConsoleShell
      activeOrganization={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
      }}
      initialSidebarOpen={initialSidebarOpen}
      isAdmin={hasAdminRole(user.role)}
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
      }}
    >
      {children}
    </ConsoleShell>
  );
}
