"use client";

import { BreadcrumbPage } from "@notra/ui/components/ui/breadcrumb";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useCollection } from "@/lib/hooks/use-collections";
import type { CollectionTopbarTitleProps } from "@/types/content/topbar";

export function CollectionTopbarTitle({
  collectionId,
}: CollectionTopbarTitleProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const { data } = useCollection(organizationId, collectionId);
  const name = data?.collection.name;

  return (
    <BreadcrumbPage className="block min-w-0 truncate">
      {name ?? "Collection"}
    </BreadcrumbPage>
  );
}
