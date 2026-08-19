"use client";

import { useParams } from "next/navigation";
import { CompetitorDetailView } from "@/components/geo/competitor-detail-view";
import { CompetitorModal } from "@/components/geo/competitor-modal";

export default function Page() {
  const { slug, competitor } = useParams<{
    slug: string;
    competitor: string;
  }>();
  const name = decodeURIComponent(competitor ?? "");

  return (
    <CompetitorModal title={name}>
      <CompetitorDetailView competitor={name} organizationSlug={slug ?? ""} />
    </CompetitorModal>
  );
}
