import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@notra/ui/components/ui/card";
import { Skeleton } from "@notra/ui/components/ui/skeleton";

const REPOSITORY_SKELETONS = ["first", "second", "third"];

export function GitHubIntegrationSkeleton() {
  return (
    <Card
      aria-busy="true"
      aria-label="Loading GitHub integration"
      role="status"
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <CardAction>
          <Skeleton className="h-8 w-20" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="divide-y rounded-lg border">
          {REPOSITORY_SKELETONS.map((repository) => (
            <div
              className="flex items-center gap-3 px-3 py-2.5"
              key={repository}
            >
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-4 w-48 max-w-2/3" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function GitHubLegacyIntegrationsSkeleton() {
  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold">
          Personal access token (Legacy)
        </h2>
        <p className="text-muted-foreground text-sm">
          Legacy integrations connected with a personal access token.
        </p>
      </div>
      <Card
        aria-busy="true"
        aria-label="Loading personal access token integrations"
        role="status"
      >
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          <CardAction className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="size-8" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-36" />
        </CardContent>
      </Card>
    </section>
  );
}
