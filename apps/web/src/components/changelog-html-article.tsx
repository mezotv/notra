import { addExternalLinkAttrs } from "@/utils/sanitize-html-links";
import type { ChangelogHtmlArticleProps } from "~types/changelog";

export function ChangelogHtmlArticle({ html }: ChangelogHtmlArticleProps) {
  return (
    <article
      className="prose prose-neutral dark:prose-invert mt-8 max-w-none prose-headings:font-sans prose-headings:font-semibold prose-p:font-sans prose-a:text-primary prose-li:text-foreground/80 prose-p:text-foreground/80 prose-strong:text-foreground prose-p:leading-7 prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: changelog HTML is from our own CMS
      dangerouslySetInnerHTML={{ __html: addExternalLinkAttrs(html) }}
    />
  );
}
