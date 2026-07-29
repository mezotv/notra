"use client";

import { ArrowDown01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { usePersonas, useUpdatePersona } from "@/lib/hooks/use-personas";
import type { MemberPersonaCellProps } from "@/types/components/personas";

export function PersonaCell({ member }: MemberPersonaCellProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const { data } = usePersonas(organizationId);
  const updatePersona = useUpdatePersona(organizationId);

  const personas = data?.personas ?? [];
  const linkedPersona = personas.find(
    (persona) => persona.memberId === member.id
  );
  const availablePersonas = linkedPersona
    ? []
    : personas.filter((persona) => !persona.memberId);

  async function handleLink(personaId: string) {
    try {
      await updatePersona.mutateAsync({
        personaId,
        payload: { memberId: member.id },
      });
      toast.success(`Persona linked to ${member.user.name}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to link persona"
      );
    }
  }

  async function handleUnlink() {
    if (!linkedPersona) {
      return;
    }
    try {
      await updatePersona.mutateAsync({
        personaId: linkedPersona.id,
        payload: { memberId: null },
      });
      toast.success(`Persona unlinked from ${member.user.name}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unlink persona"
      );
    }
  }

  if (personas.length === 0) {
    return <span className="text-muted-foreground text-sm">None</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="h-8 gap-1.5 px-2 font-normal"
            disabled={updatePersona.isPending}
            variant="ghost"
          >
            {linkedPersona ? (
              <>
                <Avatar className="size-5">
                  <AvatarImage
                    alt={linkedPersona.name}
                    src={linkedPersona.avatarUrl ?? undefined}
                  />
                  <AvatarFallback className="text-[0.625rem]">
                    {linkedPersona.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-32 truncate">{linkedPersona.name}</span>
              </>
            ) : (
              <>
                <HugeiconsIcon className="size-4" icon={UserAdd01Icon} />
                <span className="text-muted-foreground">Link persona</span>
              </>
            )}
            <HugeiconsIcon
              className="size-3.5 text-muted-foreground"
              icon={ArrowDown01Icon}
            />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56">
        {availablePersonas.map((persona) => (
          <DropdownMenuItem
            disabled={
              updatePersona.isPending || persona.id === linkedPersona?.id
            }
            key={persona.id}
            onClick={() => handleLink(persona.id)}
          >
            <Avatar className="mr-2 size-5">
              <AvatarImage
                alt={persona.name}
                src={persona.avatarUrl ?? undefined}
              />
              <AvatarFallback className="text-[0.625rem]">
                {persona.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{persona.name}</span>
          </DropdownMenuItem>
        ))}
        {!linkedPersona && availablePersonas.length === 0 && (
          <DropdownMenuItem disabled>
            All personas are already linked
          </DropdownMenuItem>
        )}
        {linkedPersona ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={updatePersona.isPending}
              onClick={handleUnlink}
              variant="destructive"
            >
              Unlink persona
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
