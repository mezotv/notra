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
import { useMemberPermissions } from "@/lib/hooks/use-member-permissions";
import {
  useAssignRole,
  useRoleAssignments,
  useRoles,
  useUnassignRole,
} from "@/lib/hooks/use-roles";
import { useSlugOrganization } from "@/lib/hooks/use-slug-organization";
import { errorMessageOr } from "@/lib/utils";
import type { MemberRolesCellProps } from "@/types/members/member-roles";

export function MemberRolesCell({
  memberId,
  memberName,
}: MemberRolesCellProps) {
  const organization = useSlugOrganization();
  const organizationId = organization?.id ?? "";

  const { hasScope } = useMemberPermissions(organizationId);
  const { data: assignmentsData, isPending } =
    useRoleAssignments(organizationId);
  const { data: rolesData } = useRoles(organizationId);
  const assignRole = useAssignRole(organizationId);
  const unassignRole = useUnassignRole(organizationId);

  const assignments = (assignmentsData?.assignments ?? []).filter(
    (assignment) => assignment.memberId === memberId
  );
  const assignedRoleIds = new Set(
    assignments.map((assignment) => assignment.roleId)
  );
  const canManage = hasScope("members:manage");
  const isMutating = assignRole.isPending || unassignRole.isPending;

  const toggleRole = (roleId: string, checked: boolean) => {
    const mutation = checked ? assignRole : unassignRole;

    mutation.mutate(
      { memberId, roleId },
      {
        onSuccess: () => {
          toast.success(`Roles updated for ${memberName}`);
        },
        onError: (error) => {
          toast.error(errorMessageOr(error.message, "Failed to update roles"));
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
        <span className="text-muted-foreground text-sm">No roles</span>
      ) : (
        assignments.map((assignment) => (
          <Badge
            className="font-normal"
            key={assignment.roleId}
            variant="outline"
          >
            {assignment.roleName}
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
                <span className="sr-only">Manage roles for {memberName}</span>
                <HugeiconsIcon className="size-4" icon={UserShield01Icon} />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            {(rolesData?.roles ?? []).map((role) => (
              <DropdownMenuCheckboxItem
                checked={assignedRoleIds.has(role.id)}
                key={role.id}
                onCheckedChange={(checked) => toggleRole(role.id, checked)}
              >
                {role.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
