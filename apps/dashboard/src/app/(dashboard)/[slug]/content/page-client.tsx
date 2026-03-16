"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  LayoutGridIcon,
  ListViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ContentType } from "@notra/ai/schemas/content";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { ButtonGroup } from "@notra/ui/components/ui/button-group";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ContentCard,
  getContentTypeLabel,
} from "@/components/content/content-card";
import { ContentRowActions } from "@/components/content/content-row-actions";
import { ContentSkeletonCard } from "@/components/content/content-skeleton-card";
import { CreateContentDialog } from "@/components/content/create-content-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useActiveGenerations } from "@/lib/hooks/use-active-generations";
import { useLocalStorage } from "@/lib/utils/local-storage";
import type { Post, PostStatus } from "@/schemas/content";
import { usePosts } from "../../../../lib/hooks/use-posts";
import { ContentPageSkeleton } from "./skeleton";

const CONTENT_VIEW_STORAGE_KEY = "notra:content-view";

type ViewMode = "grid" | "table";

interface PageClientProps {
  organizationSlug: string;
}

function formatDateHeading(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function groupPostsByDate(posts: Post[]): Map<string, Post[]> {
  const groups = new Map<string, Post[]>();

  for (const post of posts) {
    const date = new Date(post.createdAt);
    const dateKey = date.toDateString();

    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(post);
    } else {
      groups.set(dateKey, [post]);
    }
  }

  return groups;
}

function getPreview(markdown: string): string {
  const lines = markdown
    .split("\n")
    .filter((line) => !line.startsWith("#") && line.trim().length > 0);

  const preview = lines.slice(0, 3).join(" ").trim();

  return preview
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .slice(0, 200);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";
  const router = useRouter();
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    CONTENT_VIEW_STORAGE_KEY,
    "grid"
  );
  const [createdSortOrder, setCreatedSortOrder] = useState<
    false | "asc" | "desc"
  >(false);
  const [updatedSortOrder, setUpdatedSortOrder] = useState<
    false | "asc" | "desc"
  >(false);

  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } =
    usePosts(organizationId);
  const { data: activeGenerations } = useActiveGenerations(organizationId);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data?.pages]
  );

  const groupedPosts = useMemo(() => groupPostsByDate(allPosts), [allPosts]);

  const previewsByPostId = useMemo(() => {
    const map = new Map<string, string>();
    for (const post of allPosts) {
      map.set(post.id, getPreview(post.markdown));
    }
    return map;
  }, [allPosts]);

  const sortedPosts = useMemo(() => {
    const posts = viewMode === "table" ? allPosts : [];
    if (viewMode !== "table" || posts.length === 0) {
      return posts;
    }

    if (createdSortOrder !== false) {
      return [...posts].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return createdSortOrder === "desc" ? bTime - aTime : aTime - bTime;
      });
    }
    if (updatedSortOrder !== false) {
      return [...posts].sort((a, b) => {
        const aTime = new Date(a.updatedAt).getTime();
        const bTime = new Date(b.updatedAt).getTime();
        return updatedSortOrder === "desc" ? bTime - aTime : aTime - bTime;
      });
    }
    return posts;
  }, [allPosts, viewMode, createdSortOrder, updatedSortOrder]);

  function getSortIcon(isSorted: false | "asc" | "desc") {
    if (isSorted === "asc") {
      return ArrowUp01Icon;
    }
    if (isSorted === "desc") {
      return ArrowDown01Icon;
    }
    return ArrowUpDownIcon;
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Content</h1>
            <p className="text-muted-foreground">
              View and manage your generated content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonGroup>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      className={
                        viewMode === "grid"
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          : undefined
                      }
                      onClick={() => setViewMode("grid")}
                      size="icon-sm"
                      variant="outline"
                    >
                      <HugeiconsIcon className="size-4" icon={LayoutGridIcon} />
                    </Button>
                  }
                />
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      className={
                        viewMode === "table"
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          : undefined
                      }
                      onClick={() => setViewMode("table")}
                      size="icon-sm"
                      variant="outline"
                    >
                      <HugeiconsIcon className="size-4" icon={ListViewIcon} />
                    </Button>
                  }
                />
                <TooltipContent>Table view</TooltipContent>
              </Tooltip>
            </ButtonGroup>
            <CreateContentDialog organizationId={organizationId} />
          </div>
        </div>
        {isPending && <ContentPageSkeleton />}
        {!isPending &&
          allPosts.length === 0 &&
          !(activeGenerations && activeGenerations.length > 0) && (
            <EmptyState
              className="p-8"
              description="Generate your first piece of content to get started."
              title="No content yet"
            />
          )}
        {!isPending &&
          (allPosts.length > 0 ||
            (activeGenerations && activeGenerations.length > 0)) &&
          viewMode === "grid" &&
          (() => {
            const todayKey = new Date().toDateString();
            const hasActiveGens =
              activeGenerations && activeGenerations.length > 0;
            const entries = Array.from(groupedPosts.entries());
            const todayExists = entries.some(([key]) => key === todayKey);

            return (
              <>
                {hasActiveGens && !todayExists && (
                  <section className="space-y-4" key="today-generating">
                    <h2 className="font-semibold text-lg">
                      {formatDateHeading(todayKey)}
                    </h2>
                    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {activeGenerations.map((gen) => (
                        <ContentSkeletonCard
                          key={`gen-${gen.runId}`}
                          outputType={gen.outputType}
                          source={gen.source}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {entries.map(([dateKey, posts]) => (
                  <section className="space-y-4" key={dateKey}>
                    <h2 className="font-semibold text-lg">
                      {formatDateHeading(dateKey)}
                    </h2>
                    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {hasActiveGens &&
                        dateKey === todayKey &&
                        activeGenerations.map((gen) => (
                          <ContentSkeletonCard
                            key={`gen-${gen.runId}`}
                            outputType={gen.outputType}
                            source={gen.source}
                          />
                        ))}
                      {posts.map((post) => (
                        <ContentCard
                          contentType={post.contentType as ContentType}
                          href={`/${organizationSlug}/content/${post.id}`}
                          id={post.id}
                          key={post.id}
                          organizationId={organizationId}
                          preview={previewsByPostId.get(post.id) ?? ""}
                          status={post.status as PostStatus}
                          title={post.title}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            );
          })()}
        {!isPending && allPosts.length > 0 && viewMode === "table" && (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] min-w-[180px]">
                    Title
                  </TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[110px]">
                    <Button
                      className="-ml-4"
                      onClick={() => {
                        setUpdatedSortOrder(false);
                        setCreatedSortOrder(
                          createdSortOrder === "desc" ? "asc" : "desc"
                        );
                      }}
                      variant="ghost"
                    >
                      Created At
                      <HugeiconsIcon
                        className="ml-2 size-4"
                        icon={getSortIcon(createdSortOrder)}
                      />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[110px]">
                    <Button
                      className="-ml-4"
                      onClick={() => {
                        setCreatedSortOrder(false);
                        setUpdatedSortOrder(
                          updatedSortOrder === "desc" ? "asc" : "desc"
                        );
                      }}
                      variant="ghost"
                    >
                      Updated At
                      <HugeiconsIcon
                        className="ml-2 size-4"
                        icon={getSortIcon(updatedSortOrder)}
                      />
                    </Button>
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPosts.map((post) => {
                  const href = `/${organizationSlug}/content/${post.id}`;
                  return (
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      key={post.id}
                      onClick={() => router.push(href)}
                      onMouseEnter={() => router.prefetch(href)}
                    >
                      <TableCell>
                        <span className="font-medium">{post.title}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize" variant="secondary">
                          {getContentTypeLabel(post.contentType as ContentType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="capitalize"
                          variant={
                            post.status === "published" ? "default" : "outline"
                          }
                        >
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[110px] whitespace-nowrap text-muted-foreground text-sm tabular-nums">
                        {formatDate(post.createdAt)}
                      </TableCell>
                      <TableCell className="w-[110px] whitespace-nowrap text-muted-foreground text-sm tabular-nums">
                        {formatDate(post.updatedAt)}
                      </TableCell>
                      <TableCell
                        className="w-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ContentRowActions
                          id={post.id}
                          organizationId={organizationId}
                          status={post.status as PostStatus}
                          title={post.title}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="h-10" ref={loadMoreRef}>
          {isFetchingNextPage && (
            <div className="flex items-center justify-center">
              <Skeleton className="size-6 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
