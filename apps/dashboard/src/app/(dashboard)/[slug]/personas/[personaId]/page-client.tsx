"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { usePersona } from "@/lib/hooks/use-personas";
import type { PersonaDetailPageClientProps } from "@/types/components/personas";
import { DeletePersonaCard } from "./components/delete-persona-card";
import { PersonaMemberCard } from "./components/persona-member-card";
import { PersonaProfileCard } from "./components/persona-profile-card";
import { PersonaReferencesCard } from "./components/persona-references-card";
import { PersonaSocialsCard } from "./components/persona-socials-card";

function PersonaDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function PageClient({
  slug,
  personaId,
}: PersonaDetailPageClientProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";

  const {
    data: persona,
    isPending,
    isError,
  } = usePersona(organizationId, personaId);

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 lg:px-6">
        <Link
          className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
          href={`/${slug}/personas`}
        >
          <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
          Back to personas
        </Link>

        {isPending && !!organizationId && <PersonaDetailSkeleton />}
        {isError && (
          <p className="text-muted-foreground">
            This persona could not be found.
          </p>
        )}
        {persona ? (
          <>
            <div className="space-y-1">
              <h1 className="font-bold text-3xl tracking-tight">
                {persona.name}
              </h1>
              <p className="text-muted-foreground">
                {persona.title ?? "Persona"}
              </p>
            </div>
            <PersonaProfileCard
              organizationId={organizationId}
              persona={persona}
            />
            <PersonaSocialsCard
              organizationId={organizationId}
              persona={persona}
            />
            <PersonaMemberCard
              organizationId={organizationId}
              persona={persona}
            />
            <PersonaReferencesCard
              organizationId={organizationId}
              personaId={persona.id}
            />
            <DeletePersonaCard
              organizationId={organizationId}
              persona={persona}
              slug={slug}
            />
          </>
        ) : null}
      </div>
    </PageContainer>
  );
}
