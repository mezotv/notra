"use client";

import { useId } from "react";
import { ContentCard } from "@/components/content/content-card";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useTodayPosts } from "@/lib/hooks/use-posts";
import type { ContentType, PostStatus } from "@/schemas/content";

interface PageClientProps {
  organizationSlug: string;
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
  const { data, isPending } = useTodayPosts(organizationId);
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  const previewPosts = posts.slice(0, 3);
  const todayContent = (() => {
    if (isPending) {
      return (
        <div className="grid justify-items-center gap-3 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="h-[170px] w-full max-w-[340px] rounded-[20px] border border-border/60 bg-muted/30 sm:h-[140px] sm:max-w-none"
              key={`${skeletonId}-${index + 1}`}
            />
          ))}
        </div>
      );
    }

    if (previewPosts.length > 0) {
      return (
        <div className="grid justify-items-center gap-3 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3">
          {previewPosts.map((post) => (
            <div className="w-full max-w-[340px] sm:max-w-none" key={post.id}>
              <ContentCard
                className="min-h-[10.625rem] sm:min-h-[8.75rem]"
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
          <h1 className="font-bold text-3xl tracking-tight">👋 Welcome!</h1>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Today&apos;s content</h2>
              <p className="text-muted-foreground text-sm">
                Latest items created today
              </p>
            </div>
          </div>

          {todayContent}
        </section>
      </div>
    </PageContainer>
  );
}
