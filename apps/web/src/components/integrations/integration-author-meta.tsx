import { cn } from "@notra/ui/lib/utils";
import type { IntegrationAuthorMetaProps } from "@/types/integrations";

export function IntegrationAuthorMeta({
  integration,
  tail,
  className,
}: IntegrationAuthorMetaProps) {
  const { author, websiteUrl } = integration;

  if (!author) {
    return <span className={cn("truncate", className)}>{tail}</span>;
  }

  return (
    <span className={cn("truncate", className)}>
      by{" "}
      {websiteUrl ? (
        <a
          className="underline-offset-2 transition-colors hover:text-[#1E1E1E] hover:underline dark:hover:text-white"
          href={websiteUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {author}
        </a>
      ) : (
        author
      )}
      {tail ? ` · ${tail}` : ""}
    </span>
  );
}
