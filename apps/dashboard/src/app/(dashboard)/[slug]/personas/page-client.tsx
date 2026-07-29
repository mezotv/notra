"use client";

import { PlusSignIcon, UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { usePersonas } from "@/lib/hooks/use-personas";
import type { PersonasPageClientProps } from "@/types/components/personas";
import { CreatePersonaDialog } from "./components/create-persona-dialog";
import { PersonaCard } from "./components/persona-card";
import { PersonasPageSkeleton } from "./skeleton";

export default function PageClient({ slug }: PersonasPageClientProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isPending } = usePersonas(organizationId);
  const personas = data?.personas ?? [];
  const isLoading = !!organizationId && isPending;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Personas</h1>
            <p className="text-muted-foreground">
              Individual voices your team can publish content as.
            </p>
          </div>
          <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Create Persona
          </Button>
        </div>

        {isLoading && <PersonasPageSkeleton />}
        {!isLoading && personas.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <HugeiconsIcon
              className="size-8 text-muted-foreground"
              icon={UserMultiple02Icon}
            />
            <div className="space-y-1">
              <p className="font-medium">No personas yet</p>
              <p className="text-muted-foreground text-sm">
                Create a persona to write content in an individual voice instead
                of your brand's.
              </p>
            </div>
            <Button
              className="gap-1.5"
              onClick={() => setDialogOpen(true)}
              variant="outline"
            >
              <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
              Create your first persona
            </Button>
          </div>
        )}
        {!isLoading && personas.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personas.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} slug={slug} />
            ))}
          </div>
        )}
      </div>

      <CreatePersonaDialog
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        organizationId={organizationId}
        slug={slug}
      />
    </PageContainer>
  );
}
