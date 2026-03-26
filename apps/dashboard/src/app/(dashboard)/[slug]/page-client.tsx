"use client";

import type { ContentType } from "@notra/ai/schemas/content";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";
import { ContentCard } from "@/components/content/content-card";
import { ContentSkeletonCard } from "@/components/content/content-skeleton-card";
import { CreateContentDialog } from "@/components/content/create-content-dialog";
import { ContentActivityCard } from "@/components/dashboard/content-activity-card";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { authClient } from "@/lib/auth/client";
import { useActiveGenerations } from "@/lib/hooks/use-active-generations";
import { useTodayPosts } from "@/lib/hooks/use-posts";
import type { PostStatus } from "@/schemas/content";

interface PageClientProps {
  organizationSlug: string;
}

function getGreeting(now: Date): string {
  const hour = now.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getPreview(markdown: string): string {
  const lines = markdown
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.trim().length > 0);

  const preview = lines.slice(0, 2).join(" ").trim();

  return preview
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .slice(0, 160);
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";
  const skeletonId = useId();
  const { data: session } = authClient.useSession();
  const { data, isPending } = useTodayPosts(organizationId);
  const { data: activeGenerations } = useActiveGenerations(organizationId);
  const greeting = getGreeting(new Date());
  const userName = session?.user?.name?.trim();
  const greetingText = userName ? `${greeting}, ${userName}!` : `${greeting}!`;
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  const visibleGenerations = activeGenerations?.slice(0, 3) ?? [];
  const hasActiveGenerations = visibleGenerations.length > 0;
  const maxPreviewPosts = Math.max(0, 3 - visibleGenerations.length);
  const previewPosts = posts.slice(0, maxPreviewPosts);
  const todayContent = (() => {
    if (isPending && !hasActiveGenerations) {
      return (
        <div className="grid auto-rows-[1fr] justify-items-center gap-3 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              className="h-[10.625rem] w-full max-w-[21.25rem] rounded-lg sm:h-[8.75rem] sm:max-w-none"
              key={`${skeletonId}-${index + 1}`}
            />
          ))}
        </div>
      );
    }

    if (hasActiveGenerations || previewPosts.length > 0) {
      return (
        <div className="grid auto-rows-[1fr] justify-items-center gap-3 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3">
          {visibleGenerations.map((gen) => (
            <div
              className="w-full max-w-[340px] sm:max-w-none"
              key={`gen-${gen.runId}`}
            >
              <ContentSkeletonCard
                className="min-h-35"
                outputType={gen.outputType}
                source={gen.source}
              />
            </div>
          ))}
          {previewPosts.map((post) => (
            <div className="w-full max-w-[340px] sm:max-w-none" key={post.id}>
              <ContentCard
                className="min-h-35"
                contentType={post.contentType as ContentType}
                href={`/${organizationSlug}/content/${post.id}`}
                id={post.id}
                organizationId={organizationId}
                preview={getPreview(post.markdown)}
                status={post.status as PostStatus}
                title={post.title}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <EmptyState
        className="p-6"
        description="Check back later or start a new post from the content page."
        title="No content created today"
      />
    );
  })();

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">{greetingText}</h1>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Today&apos;s Content</h2>
              <p className="text-muted-foreground text-sm">
                Latest items created today
              </p>
            </div>
            <CreateContentDialog organizationId={organizationId} />
          </div>

          {todayContent}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Content Activity</h2>
            <p className="text-muted-foreground text-sm">
              Your content creation over the year
            </p>
          </div>

          <ContentActivityCard />
        </section>
      </div>
    </PageContainer>
  );
}
