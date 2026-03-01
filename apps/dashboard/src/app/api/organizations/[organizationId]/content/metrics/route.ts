import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { eachDayOfInterval, endOfYear, format, startOfYear } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";

interface RouteContext {
  params: Promise<{ organizationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const allPosts = await db
      .select({
        status: posts.status,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.organizationId, organizationId),
          gte(posts.createdAt, yearStart),
          lte(posts.createdAt, yearEnd)
        )
      )
      .orderBy(posts.createdAt);

    const totalDrafts = allPosts.filter((p) => p.status === "draft").length;
    const totalPublished = allPosts.filter(
      (p) => p.status === "published"
    ).length;

    const dateMap = new Map<string, { drafts: number; published: number }>();

    for (const post of allPosts) {
      const dateKey = format(post.createdAt, "yyyy-MM-dd");
      const entry = dateMap.get(dateKey) ?? { drafts: 0, published: 0 };
      if (post.status === "published") {
        entry.published += 1;
      } else {
        entry.drafts += 1;
      }
      dateMap.set(dateKey, entry);
    }

    const allDaysInYear = eachDayOfInterval({
      start: yearStart,
      end: yearEnd,
    });

    const maxCount = Math.max(
      ...Array.from(dateMap.values()).map((v) => v.drafts + v.published),
      1
    );

    const activityData = allDaysInYear.map((date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const entry = dateMap.get(dateKey) ?? { drafts: 0, published: 0 };
      const count = entry.drafts + entry.published;

      let level: number;
      const percentage = count === 0 ? 0 : (count / maxCount) * 100;

      if (count === 0) {
        level = 0;
      } else if (percentage <= 25) {
        level = 1;
      } else if (percentage <= 50) {
        level = 2;
      } else if (percentage <= 75) {
        level = 3;
      } else {
        level = 4;
      }

      return {
        date: dateKey,
        count,
        drafts: entry.drafts,
        published: entry.published,
        level,
      };
    });

    return NextResponse.json({
      drafts: totalDrafts,
      published: totalPublished,
      graph: {
        activity: activityData,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch content metrics" },
      { status: 500 }
    );
  }
}
