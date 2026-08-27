"use client";

import Link from "next/link";

import type { PostSocialErrorNoticeProps } from "@/types/content/post-social";

export function PostSocialErrorNotice({
  label,
  error,
  slug,
}: PostSocialErrorNoticeProps) {
  return (
    <div className="space-y-1">
      <p className="text-destructive text-sm">{error.message}</p>
      {error.docsUrl && (
        <p className="text-muted-foreground text-sm">
          {label} rejects duplicate posts.{" "}
          <a
            className="text-primary underline underline-offset-2"
            href={error.docsUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Read the {label} docs
          </a>
        </p>
      )}
      {error.reconnectRequired && slug && (
        <p className="text-muted-foreground text-sm">
          Have you tried reconnecting?{" "}
          <Link
            className="text-primary underline underline-offset-2"
            href={`/${slug}/settings/general`}
          >
            Reconnect in settings
          </Link>
        </p>
      )}
    </div>
  );
}
