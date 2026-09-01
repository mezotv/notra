"use client";

import { useRouter } from "next/navigation";

import { RaycastSetupGuideDialog } from "@/components/integrations/raycast-setup-guide-dialog";
import { useOrganizationsContext } from "@/components/providers/organization-provider";

export default function RaycastInterceptedPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizationsContext();
  const organizationSlug = activeOrganization?.slug ?? "";

  return (
    <RaycastSetupGuideDialog
      onOpenChange={(open) => {
        if (!open) {
          router.back();
        }
      }}
      open
      organizationSlug={organizationSlug}
    />
  );
}
