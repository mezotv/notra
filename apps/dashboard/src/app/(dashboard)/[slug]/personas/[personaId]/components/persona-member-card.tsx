"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { authClient } from "@/lib/auth/client";
import { useUpdatePersona } from "@/lib/hooks/use-personas";
import type { PersonaMemberCardProps } from "@/types/components/personas";
import type { Member } from "@/types/members/member";

const UNLINKED_VALUE = "none";

export function PersonaMemberCard({
  organizationId,
  persona,
}: PersonaMemberCardProps) {
  const updatePersona = useUpdatePersona(organizationId);

  const { data: membersData, isPending } = useQuery({
    queryKey: ["members", organizationId],
    queryFn: async () => {
      const { data, error } = await authClient.organization.listMembers({
        query: { organizationId },
      });
      if (error) {
        throw new Error("Failed to fetch members");
      }
      return data;
    },
    enabled: !!organizationId,
  });

  const memberList: Member[] = membersData?.members ?? [];

  async function handleSelect(value: string) {
    const memberId = value === UNLINKED_VALUE ? null : value;
    if (memberId === persona.memberId) {
      return;
    }

    try {
      await updatePersona.mutateAsync({
        personaId: persona.id,
        payload: { memberId },
      });
      toast.success(
        memberId ? "Persona linked to member" : "Persona unlinked from member"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update link"
      );
    }
  }

  return (
    <TitleCard heading="Linked Member">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Optionally connect this persona to a workspace member so their account
          and persona stay in sync.
        </p>
        {persona.linkedMember ? (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage
                  alt={persona.linkedMember.name}
                  src={persona.linkedMember.image ?? undefined}
                />
                <AvatarFallback>
                  {persona.linkedMember.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {persona.linkedMember.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {persona.linkedMember.email}
                </p>
              </div>
            </div>
            <Button
              disabled={updatePersona.isPending}
              onClick={() => handleSelect(UNLINKED_VALUE)}
              type="button"
              variant="outline"
            >
              Unlink
            </Button>
          </div>
        ) : (
          <Select
            disabled={isPending || updatePersona.isPending}
            onValueChange={(value) => value && handleSelect(value)}
            value={persona.memberId ?? undefined}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Select a member to link" />
            </SelectTrigger>
            <SelectContent>
              {memberList.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.user.name} ({member.user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </TitleCard>
  );
}
