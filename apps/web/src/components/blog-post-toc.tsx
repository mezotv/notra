"use client";

import type { TOCItemType } from "fumadocs-core/toc";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BlogPostTocProps } from "~types/blog";

const TOC_DEPTHS = [2, 3] as const;
const SCROLL_OFFSET_PX = 48;
const PATH_TRACK_WIDTH = 20;
const X_BY_DEPTH: Record<number, number> = {
  2: 1,
  3: 13,
};
const FALLBACK_X = 1;
const TRANSITION_INSET = 5;
const SCROLL_LOCK_FALLBACK_MS = 900;

interface TocPosition {
  id: string;
  depth: number;
  top: number;
  height: number;
}

function getHeadingId(item: TOCItemType) {
  return item.url.startsWith("#") ? item.url.slice(1) : item.url;
}

function scrollToHeading(id: string) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }
  const rect = target.getBoundingClientRect();
  const top = rect.top + window.scrollY - SCROLL_OFFSET_PX;
  window.scrollTo({ top, behavior: "smooth" });
  if (typeof history !== "undefined") {
    history.replaceState(null, "", `#${id}`);
  }
}

function buildPath(positions: TocPosition[]) {
  if (positions.length === 0) {
    return "";
  }

  const segments = positions.map((position, index) => {
    const x = X_BY_DEPTH[position.depth] ?? FALLBACK_X;
    const prev = positions[index - 1];
    const next = positions[index + 1];
    const prevX = prev ? (X_BY_DEPTH[prev.depth] ?? FALLBACK_X) : x;
    const nextX = next ? (X_BY_DEPTH[next.depth] ?? FALLBACK_X) : x;
    const startY =
      prev && prevX !== x ? position.top + TRANSITION_INSET : position.top;
    const endY =
      next && nextX !== x
        ? position.top + position.height - TRANSITION_INSET
        : position.top + position.height;
    return { x, startY, endY };
  });

  const first = segments[0];
  if (!first) {
    return "";
  }

  let d = `M ${first.x} ${first.startY}`;
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (!segment) {
      continue;
    }
    d += ` L ${segment.x} ${segment.endY}`;
    const next = segments[i + 1];
    if (next) {
      d += ` L ${next.x} ${next.startY}`;
    }
  }

  return d;
}

export function BlogPostToc({ toc }: BlogPostTocProps) {
  const items = useMemo(
    () =>
      toc.filter((item) =>
        (TOC_DEPTHS as readonly number[]).includes(item.depth)
      ),
    [toc]
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [positions, setPositions] = useState<TocPosition[]>([]);
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const scrollLockRef = useRef(false);
  const scrollLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function lockScrollSpy() {
    scrollLockRef.current = true;
    if (scrollLockTimerRef.current) {
      clearTimeout(scrollLockTimerRef.current);
    }
    scrollLockTimerRef.current = setTimeout(() => {
      scrollLockRef.current = false;
    }, SCROLL_LOCK_FALLBACK_MS);
  }

  useEffect(() => {
    function handleScrollEnd() {
      scrollLockRef.current = false;
      if (scrollLockTimerRef.current) {
        clearTimeout(scrollLockTimerRef.current);
        scrollLockTimerRef.current = null;
      }
    }
    if (!("onscrollend" in window)) {
      return;
    }
    window.addEventListener("scrollend", handleScrollEnd);
    return () => window.removeEventListener("scrollend", handleScrollEnd);
  }, []);

  useLayoutEffect(() => {
    function measure() {
      const next: TocPosition[] = [];
      for (const item of items) {
        const id = getHeadingId(item);
        const link = linkRefs.current.get(id);
        if (!link) {
          continue;
        }
        next.push({
          id,
          depth: item.depth,
          top: link.offsetTop,
          height: link.offsetHeight,
        });
      }
      setPositions(next);
    }

    measure();

    const observer = new ResizeObserver(measure);
    const list = listRef.current;
    if (list) {
      observer.observe(list);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }
    const headings = items
      .map((item) => document.getElementById(getHeadingId(item)))
      .filter((element): element is HTMLElement => element !== null);

    if (headings.length === 0) {
      return;
    }

    function update() {
      if (scrollLockRef.current) {
        return;
      }
      const scrollY = window.scrollY + SCROLL_OFFSET_PX + 8;
      let current: string | null = headings[0]?.id ?? null;
      for (const heading of headings) {
        if (heading.offsetTop <= scrollY) {
          current = heading.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  const lastPosition = positions.at(-1);
  const containerHeight = lastPosition
    ? lastPosition.top + lastPosition.height
    : 0;
  const pathD = buildPath(positions);
  const activePos = activeId
    ? (positions.find((p) => p.id === activeId) ?? null)
    : null;
  const clipPath = activePos
    ? `inset(${activePos.top}px 0px ${Math.max(
        0,
        containerHeight - activePos.top - activePos.height
      )}px 0px)`
    : "inset(100% 0px 0px 0px)";

  return (
    <nav aria-label="On this page" className="not-prose">
      <p className="mb-3 font-medium font-sans text-foreground text-sm">
        On this page
      </p>
      <div className="relative">
        {positions.length > 0 && containerHeight > 0 ? (
          <>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 text-border"
              height={containerHeight}
              preserveAspectRatio="none"
              viewBox={`0 0 ${PATH_TRACK_WIDTH} ${containerHeight}`}
              width={PATH_TRACK_WIDTH}
            >
              <path
                d={pathD}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
              />
            </svg>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 text-foreground transition-[clip-path] duration-300 ease-out"
              height={containerHeight}
              preserveAspectRatio="none"
              style={{ clipPath }}
              viewBox={`0 0 ${PATH_TRACK_WIDTH} ${containerHeight}`}
              width={PATH_TRACK_WIDTH}
            >
              <path
                d={pathD}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </>
        ) : null}
        <ul className="flex flex-col" ref={listRef}>
          {items.map((item) => {
            const id = getHeadingId(item);
            const isActive = id === activeId;
            const indent = item.depth === 3 ? "pl-7" : "pl-4";
            return (
              <li key={item.url}>
                <a
                  className={`block py-1.5 font-sans text-sm leading-snug transition-colors ${indent} ${
                    isActive
                      ? "text-foreground"
                      : "text-neutral-500 hover:text-foreground dark:text-neutral-400"
                  }`}
                  href={item.url}
                  onClick={(event) => {
                    event.preventDefault();
                    lockScrollSpy();
                    setActiveId(id);
                    scrollToHeading(id);
                  }}
                  ref={(node) => {
                    if (node) {
                      linkRefs.current.set(id, node);
                    } else {
                      linkRefs.current.delete(id);
                    }
                  }}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
