"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { changelogPostTitleTransitionName } from "@/utils/blog-view-transitions";
import { formatChangelogDate } from "@/utils/changelog";
import type { ChangelogTimelineProps } from "~types/changelog";

const ACTIVE_VIEWPORT_RATIO = 0.33;
const TRACK_LEFT_PX = 4;

export function ChangelogScrollTimeline({
  items,
  emptyTitle = "No updates yet",
  emptyDescription = "Check back soon for the latest product updates.",
}: ChangelogTimelineProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const positionsRef = useRef<number[]>([]);
  const [trackHeight, setTrackHeight] = useState(0);
  const [progressHeight, setProgressHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    const listTop = list.getBoundingClientRect().top;
    const positions = dotRefs.current.map((dot) => {
      if (!dot) {
        return 0;
      }
      const rect = dot.getBoundingClientRect();
      return rect.top - listTop + rect.height / 2;
    });

    positionsRef.current = positions;
    setTrackHeight(positions.at(-1) ?? 0);
  }, []);

  const updateActive = useCallback(() => {
    const threshold = window.innerHeight * ACTIVE_VIEWPORT_RATIO;
    let active = -1;

    dotRefs.current.forEach((dot, index) => {
      if (dot && dot.getBoundingClientRect().top <= threshold) {
        active = index;
      }
    });

    setActiveIndex(active);
    setProgressHeight(active >= 0 ? (positionsRef.current[active] ?? 0) : 0);
  }, []);

  useLayoutEffect(() => {
    measure();
    updateActive();

    const observer = new ResizeObserver(() => {
      measure();
      updateActive();
    });
    const list = listRef.current;
    if (list) {
      observer.observe(list);
    }

    return () => observer.disconnect();
  }, [measure, updateActive]);

  useEffect(() => {
    function handle() {
      updateActive();
    }

    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);

    return () => {
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [updateActive]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border border-dashed bg-muted/30 px-6 py-12 text-center">
        <h2 className="font-sans font-semibold text-foreground text-xl">
          {emptyTitle}
        </h2>
        <p className="mt-2 font-sans text-muted-foreground text-sm leading-6">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-0" ref={listRef}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 w-px bg-border"
        style={{ left: `${TRACK_LEFT_PX}px`, height: `${trackHeight}px` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 w-px bg-primary transition-[height] duration-300 ease-out"
        style={{ left: `${TRACK_LEFT_PX}px`, height: `${progressHeight}px` }}
      />

      {items.map((item, index) => {
        const isActive = index <= activeIndex;

        return (
          <div className="relative pl-8" key={item.id}>
            <span
              className={`absolute top-2 left-0 size-2.5 rounded-full ring-4 ring-background transition-colors ${
                isActive ? "bg-primary" : "bg-border"
              }`}
              ref={(node) => {
                dotRefs.current[index] = node;
              }}
            />
            <time className="block font-sans text-foreground/45 text-sm">
              {formatChangelogDate(item.date)}
            </time>
            <Link className="group block py-6" href={item.href}>
              <ViewTransition
                name={changelogPostTitleTransitionName(item.slug)}
              >
                <h2 className="font-sans font-semibold text-foreground text-xl tracking-tight transition-colors group-hover:text-primary">
                  {item.title}
                </h2>
              </ViewTransition>
              <p className="mt-2 font-sans text-muted-foreground text-sm leading-6 sm:text-base">
                {item.description}
              </p>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
