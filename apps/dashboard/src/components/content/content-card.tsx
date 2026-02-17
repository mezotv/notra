import { Badge } from "@notra/ui/components/ui/badge";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import Link from "next/link";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { formatSnakeCaseLabel } from "@/utils/format";

const CONTENT_TYPES = [
  "changelog",
  "blog_post",
  "twitter_post",
  "linkedin_post",
  "investor_update",
] as const;

type ContentType = (typeof CONTENT_TYPES)[number];

function getContentTypeLabel(contentType: ContentType): string {
  if (contentType === "twitter_post") {
    return "tweet";
  }

  return formatSnakeCaseLabel(contentType);
}

interface ContentCardProps {
  title: string;
  preview: string;
  contentType: ContentType;
  className?: string;
  href?: string;
}

const ContentCard = memo(function ContentCard({
  title,
  preview,
  contentType,
  className,
  href,
}: ContentCardProps) {
  const cardContent = (
    <TitleCard
      action={
        <Badge className="capitalize" variant="secondary">
          {getContentTypeLabel(contentType)}
        </Badge>
      }
      className={cn(
        "h-full transition-colors",
        href && "cursor-pointer hover:bg-muted/80",
        className
      )}
      heading={title}
    >
      <p className="line-clamp-3 text-muted-foreground text-sm">{preview}</p>
    </TitleCard>
  );

  if (href) {
    return (
      <Link
        className="block w-full rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={href}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
});

export { ContentCard, getContentTypeLabel };
export type { ContentType };
