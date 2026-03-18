"use client";

import { useRouter } from "next/navigation";
import { FramerSetupGuideDialog } from "@/components/integrations/framer-setup-guide-dialog";
import { useOrganizationsContext } from "@/components/providers/organization-provider";

export default function FramerInterceptedPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizationsContext();
  const organizationSlug = activeOrganization?.slug ?? "";

  return (
    <FramerSetupGuideDialog
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
