"use client";

import { UserShield01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  useAccessGroupAssignments,
  useAccessGroups,
  useAssignAccessGroup,
  useUnassignAccessGroup,
} from "@/lib/hooks/use-access-groups";
import { useMemberPermissions } from "@/lib/hooks/use-member-permissions";
import { useSlugOrganization } from "@/lib/hooks/use-slug-organization";
import { errorMessageOr } from "@/lib/utils";
import type { MemberAccessGroupsCellProps } from "@/types/members/member-access-groups";

export function MemberAccessGroupsCell({
  memberId,
  memberName,
  memberRole,
}: MemberAccessGroupsCellProps) {
  const organization = useSlugOrganization();
  const organizationId = organization?.id ?? "";

  const { hasScope } = useMemberPermissions(organizationId);
  const { data: assignmentsData, isPending } =
    useAccessGroupAssignments(organizationId);
  const { data: accessGroupsData } = useAccessGroups(organizationId);
  const assignAccessGroup = useAssignAccessGroup(organizationId);
  const unassignAccessGroup = useUnassignAccessGroup(organizationId);

  const assignments = (assignmentsData?.assignments ?? []).filter(
    (assignment) => assignment.memberId === memberId
  );
  const assignedAccessGroupIds = new Set(
    assignments.map((assignment) => assignment.accessGroupId)
  );
  const canManage = hasScope("members:manage");
  const isMutating =
    assignAccessGroup.isPending || unassignAccessGroup.isPending;

  const toggleAccessGroup = (accessGroupId: string, checked: boolean) => {
    const mutation = checked ? assignAccessGroup : unassignAccessGroup;

    mutation.mutate(
      { memberId, accessGroupId },
      {
        onSuccess: () => {
          toast.success(`Access groups updated for ${memberName}`);
        },
        onError: (error) => {
          toast.error(
            errorMessageOr(error.message, "Failed to update access groups")
          );
        },
      }
    );
  };

  if (isPending) {
    return <Skeleton className="h-5 w-20 rounded-full" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assignments.length === 0 ? (
        <span className="text-muted-foreground text-sm">
          {memberRole === "owner" ? "Full access" : "No access groups"}
        </span>
      ) : (
        assignments.map((assignment) => (
          <Badge
            className="font-normal"
            key={assignment.accessGroupId}
            variant="outline"
          >
            {assignment.accessGroupName}
          </Badge>
        ))
      )}

      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                className="size-7 p-0"
                disabled={isMutating}
                variant="ghost"
              >
                <span className="sr-only">
                  Manage access groups for {memberName}
                </span>
                <HugeiconsIcon className="size-4" icon={UserShield01Icon} />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            {(accessGroupsData?.accessGroups ?? []).map((accessGroup) => (
              <DropdownMenuCheckboxItem
                checked={assignedAccessGroupIds.has(accessGroup.id)}
                key={accessGroup.id}
                onCheckedChange={(checked) =>
                  toggleAccessGroup(accessGroup.id, checked)
                }
              >
                {accessGroup.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
