"use client";

import { ArrowLeft02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { ContentCard } from "@/components/content/content-card";
import { ContentSkeletonCard } from "@/components/content/content-skeleton-card";
import { GroupContentTypes } from "@/components/content/group/group-content-types";
import { RenameCollectionDialog } from "@/components/content/group/rename-collection-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { useCollection } from "@/lib/hooks/use-collections";
import type { CollectionDetailPageClientProps } from "@/types/content/collection";
import { formatLongDate, getMarkdownPreview } from "@/utils/content-preview";
import { resolveImagePreviewSrc } from "@/utils/markdown-image";
import { GroupDetailSkeleton } from "./skeleton";

export default function PageClient({
  collectionId,
  organizationId,
  organizationSlug,
}: CollectionDetailPageClientProps) {
  const { data, isPending, error } = useCollection(
    organizationId,
    collectionId
  );
  const [showRenameDialog, setShowRenameDialog] = useState(false);

  if (isPending) {
    return <GroupDetailSkeleton />;
  }

  if (error || !data?.collection) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full px-4 lg:px-6">
          <EmptyState
            action={
              <Link href={`/${organizationSlug}/content`}>
                <Button tabIndex={-1} variant="outline">
                  Back to Content
                </Button>
              </Link>
            }
            description="This collection may have been deleted or you don't have access to it."
            title="Collection not found"
          />
        </div>
      </PageContainer>
    );
  }

  const collection = data.collection;
  const postCountLabel = `${collection.posts.length} ${
    collection.posts.length === 1 ? "post" : "posts"
  }`;

  const pendingCount =
    collection.isGenerating && collection.expectedPostCount !== null
      ? Math.max(0, collection.expectedPostCount - collection.posts.length)
      : 0;
  const pendingTypes = Array.from({ length: pendingCount }, (_, index) =>
    collection.contentTypes.length > 0
      ? (collection.contentTypes[index % collection.contentTypes.length] ??
        "blog_post")
      : "blog_post"
  );
  const hasContent = collection.posts.length > 0 || pendingCount > 0;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-4">
          <Link
            className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
            href={`/${organizationSlug}/content`}
          >
            <HugeiconsIcon className="size-4" icon={ArrowLeft02Icon} />
            Content
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-2xl tracking-tight">
                  {collection.name}
                </h1>
                <Button
                  className="size-7 shrink-0 text-muted-foreground"
                  onClick={() => setShowRenameDialog(true)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <span className="sr-only">Rename collection</span>
                  <HugeiconsIcon className="size-4" icon={PencilEdit02Icon} />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
                <span>{postCountLabel}</span>
                <span aria-hidden>·</span>
                <time dateTime={collection.createdAt}>
                  {formatLongDate(collection.createdAt)}
                </time>
              </div>
            </div>
            <GroupContentTypes contentTypes={collection.contentTypes} />
          </div>
        </div>

        {hasContent && (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collection.posts.map((post) => (
              <ContentCard
                contentType={post.contentType}
                href={`/${organizationSlug}/content/${post.id}`}
                id={post.id}
                imagePreviewSrc={
                  post.contentType === "image"
                    ? resolveImagePreviewSrc({
                        content: post.content,
                        markdown: post.markdown,
                      })
                    : null
                }
                key={post.id}
                organizationId={organizationId}
                preview={getMarkdownPreview(post.markdown ?? "")}
                status={post.status}
                title={post.title}
              />
            ))}
            {pendingTypes.map((type, index) => (
              <ContentSkeletonCard key={`pending-${index}`} outputType={type} />
            ))}
          </div>
        )}

        {!hasContent && (
          <EmptyState
            description="This collection has no posts."
            title="Nothing here yet"
          />
        )}
      </div>

      <RenameCollectionDialog
        collectionId={collection.id}
        currentName={collection.name}
        onOpenChange={setShowRenameDialog}
        open={showRenameDialog}
        organizationId={organizationId}
      />
    </PageContainer>
  );
}
