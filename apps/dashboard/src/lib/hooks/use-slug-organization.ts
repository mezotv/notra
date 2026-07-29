"use client";

import { useParams } from "next/navigation";
import {
  type Organization,
  useOrganizationsContext,
} from "@/components/providers/organization-provider";

export function useSlugOrganization(): Organization | undefined {
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug;
  const { activeOrganization, getOrganization } = useOrganizationsContext();

  if (!slug) {
    return activeOrganization ?? undefined;
  }

  if (activeOrganization?.slug === slug) {
    return activeOrganization;
  }

  return getOrganization(slug);
}
