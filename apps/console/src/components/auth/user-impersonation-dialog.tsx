"use client";

import { UserSwitchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@notra/ui/components/ui/command";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IMPERSONATION_SEARCH_DEBOUNCE_MS,
  IMPERSONATION_USER_RESULT_LIMIT,
} from "@/constants/auth";
import { authClient } from "@/lib/auth/client";
import { hasAdminRole } from "@/lib/auth/role";
import type {
  ImpersonationUser,
  UserImpersonationDialogProps,
} from "@/types/auth";

export function UserImpersonationDialog({
  currentUserId,
  onOpenChange,
  open,
}: UserImpersonationDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [users, setUsers] = useState<ImpersonationUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [impersonatingUserId, setImpersonatingUserId] = useState<string>();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, IMPERSONATION_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;
    setIsLoading(true);

    async function loadUsers() {
      const baseQuery = {
        limit: IMPERSONATION_USER_RESULT_LIMIT,
        sortBy: "name",
        sortDirection: "asc" as const,
      };

      if (!debouncedSearch) {
        const result = await authClient.admin.listUsers({
          query: baseQuery,
        });

        if (!ignore) {
          if (result.error) {
            toast.error(result.error.message ?? "Failed to load users");
            setUsers([]);
          } else {
            setUsers(result.data?.users ?? []);
          }
          setIsLoading(false);
        }
        return;
      }

      const [nameResult, emailResult] = await Promise.all([
        authClient.admin.listUsers({
          query: {
            ...baseQuery,
            searchField: "name",
            searchOperator: "contains",
            searchValue: debouncedSearch,
          },
        }),
        authClient.admin.listUsers({
          query: {
            ...baseQuery,
            searchField: "email",
            searchOperator: "contains",
            searchValue: debouncedSearch,
          },
        }),
      ]);

      if (!ignore) {
        const error = nameResult.error ?? emailResult.error;
        if (error) {
          toast.error(error.message ?? "Failed to search users");
          setUsers([]);
        } else {
          const uniqueUsers = new Map<string, ImpersonationUser>();
          for (const user of [
            ...(nameResult.data?.users ?? []),
            ...(emailResult.data?.users ?? []),
          ]) {
            uniqueUsers.set(user.id, user);
          }
          setUsers(
            Array.from(uniqueUsers.values()).slice(
              0,
              IMPERSONATION_USER_RESULT_LIMIT
            )
          );
        }
        setIsLoading(false);
      }
    }

    loadUsers().catch(() => {
      if (!ignore) {
        toast.error("Failed to load users");
        setUsers([]);
        setIsLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, open]);

  async function impersonateUser(user: ImpersonationUser) {
    if (
      user.id === currentUserId ||
      user.banned === true ||
      hasAdminRole(user.role)
    ) {
      toast.error("This user cannot be impersonated");
      return;
    }

    setImpersonatingUserId(user.id);
    try {
      const result = await authClient.admin.impersonateUser({
        userId: user.id,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Failed to impersonate user");
        setImpersonatingUserId(undefined);
        return;
      }

      onOpenChange(false);
      window.location.assign("/dashboard");
    } catch {
      toast.error("Failed to impersonate user");
      setImpersonatingUserId(undefined);
    }
  }

  return (
    <CommandDialog
      description="Search by name or email and choose a user to impersonate."
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton
      title="Impersonate user"
    >
      <Command shouldFilter={false}>
        <CommandInput
          onValueChange={setSearch}
          placeholder="Search users by name or email..."
          value={search}
        />
        <CommandList>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              Loading users...
            </div>
          ) : (
            <>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup heading="Users">
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  const isAdmin = hasAdminRole(user.role);
                  const disabled =
                    isCurrentUser || isAdmin || user.banned === true;
                  let status: string | undefined;
                  if (isCurrentUser) {
                    status = "Current account";
                  } else if (isAdmin) {
                    status = "Admin";
                  } else if (user.banned) {
                    status = "Banned";
                  }

                  let trailing = (
                    <HugeiconsIcon
                      className="ml-auto text-muted-foreground"
                      icon={UserSwitchIcon}
                    />
                  );
                  if (status) {
                    trailing = (
                      <span className="ml-auto text-muted-foreground text-xs">
                        {status}
                      </span>
                    );
                  }
                  if (impersonatingUserId === user.id) {
                    trailing = (
                      <Loader2Icon className="ml-auto size-4 animate-spin" />
                    );
                  }

                  return (
                    <CommandItem
                      disabled={disabled || impersonatingUserId !== undefined}
                      key={user.id}
                      onSelect={() => impersonateUser(user)}
                      value={`${user.name} ${user.email} ${user.id}`}
                    >
                      <Avatar size="sm">
                        <AvatarImage alt="" src={user.image ?? undefined} />
                        <AvatarFallback>
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{user.name}</div>
                        <div className="truncate text-muted-foreground text-xs">
                          {user.email}
                        </div>
                      </div>
                      {trailing}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
