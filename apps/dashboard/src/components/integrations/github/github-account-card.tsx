"use client";

import { Add01Icon, LockKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { useMemo } from "react";
import { Button } from "@/components/button";
import type { GitHubAccountCardProps } from "@/types/integrations/github";

export function GitHubAccountCard({
  account,
  repositories,
  selectedRepositoryIds,
  onAddRepositories,
  onDisconnect,
}: GitHubAccountCardProps) {
  const selectedRepositories = useMemo(
    () =>
      repositories.filter((repo) => selectedRepositoryIds.includes(repo.id)),
    [repositories, selectedRepositoryIds]
  );

  const accountInitial = account.login.charAt(0).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage alt={account.login} src={account.avatarUrl} />
            <AvatarFallback>{accountInitial}</AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-2">
              {account.name ?? account.login}
              <Badge variant="secondary">
                {account.type === "Organization" ? "Organization" : "Personal"}
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground text-sm">@{account.login}</p>
          </div>
        </div>
        <CardAction>
          <Button onClick={onDisconnect} size="sm" variant="ghost">
            Disconnect
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">
            Connected repositories
            <span className="ml-1.5 text-muted-foreground">
              {selectedRepositories.length}
            </span>
          </p>
          <Button
            className="gap-1.5"
            onClick={onAddRepositories}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon className="size-4" icon={Add01Icon} />
            Add repositories
          </Button>
        </div>
        {selectedRepositories.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-muted-foreground text-sm">
            No repositories selected yet.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {selectedRepositories.map((repo) => (
              <li className="flex items-center gap-3 px-3 py-2.5" key={repo.id}>
                <Github className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="min-w-0 truncate font-medium text-sm">
                    {repo.fullName}
                  </span>
                  {repo.private ? (
                    <>
                      <HugeiconsIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground"
                        icon={LockKeyIcon}
                      />
                      <span className="sr-only">Private repository</span>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
