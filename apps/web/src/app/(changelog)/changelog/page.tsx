import type { Metadata } from "next";
import { ChangelogPageHeader } from "@/components/changelog-page-header";
import { ChangelogTimeline } from "@/components/changelog-timeline";
import { buildChangelogTimelineItems, listNotraChangelogPosts } from "@/utils/changelog";

const title = "Changelog - Notra";
const description =
  "Follow the latest Notra product updates, improvements, and release notes.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://usenotra.com/changelog",
  },
  openGraph: {
    title,
    description,
    url: "https://usenotra.com/changelog",
    type: "website",
    siteName: "Notra",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function ChangelogOverviewPage() {
  const posts = await listNotraChangelogPosts();
  const timelineItems = buildChangelogTimelineItems(posts);

  return (
    <>
      <ChangelogPageHeader
        description={
          <>
            Every product update, release note, and improvement from the Notra
            team in one place.
          </>
        }
        eyebrow="What’s New"
        meta={
          posts.length > 0 ? (
            <p className="font-sans text-muted-foreground text-sm">
              {posts.length} {posts.length === 1 ? "update" : "updates"} published
            </p>
          ) : null
        }
        title={
          <>
            The Notra <span className="text-primary">Changelog</span>
          </>
        }
      />

      <div className="mt-14 w-full max-w-[760px] self-center">
        <ChangelogTimeline
          emptyDescription="We’ll share new releases and product improvements here soon."
          emptyTitle="No changelog entries yet"
          items={timelineItems}
        />
      </div>
    </>
  );
}
