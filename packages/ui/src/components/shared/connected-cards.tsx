"use client";

import {
  ArrowRight01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@notra/ui/lib/utils";
import { type PointerEvent, useRef } from "react";

type ConnectedCardItem = {
  id: string;
  icon?: IconSvgElement;
  eyebrow?: string;
  title: string;
  description?: string;
  docsLabel?: string;
  docsHref?: string;
  accentIcon?: string;
};

type ConnectedCardsVariant = "segmented" | "elevated" | "accent";

type ConnectedCardsProps = {
  items: ConnectedCardItem[];
  variant?: ConnectedCardsVariant;
  className?: string;
  onSelect?: (id: string) => void;
  onDocs?: (id: string) => void;
};

const COLUMN_CLASSES: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

function getColumnClass(count: number) {
  return COLUMN_CLASSES[count] ?? "sm:grid-cols-3";
}

function PrimaryOverlay({
  item,
  onSelect,
}: {
  item: ConnectedCardItem;
  onSelect?: (id: string) => void;
}) {
  return (
    <button
      aria-label={`Create ${item.title} API key`}
      className="absolute inset-0 z-0 cursor-pointer rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={() => onSelect?.(item.id)}
      type="button"
    />
  );
}

function IconChip({
  icon,
  className,
}: {
  icon?: IconSvgElement;
  className?: string;
}) {
  if (!icon) {
    return null;
  }
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        className
      )}
    >
      <HugeiconsIcon className="size-5" icon={icon} />
    </span>
  );
}

function DocsAction({
  item,
  onDocs,
  className,
}: {
  item: ConnectedCardItem;
  onDocs?: (id: string) => void;
  className?: string;
}) {
  const label = item.docsLabel ?? "View docs";
  const inner = (
    <>
      <span>{label}</span>
      <HugeiconsIcon className="size-3.5" icon={ArrowUpRight01Icon} />
    </>
  );
  const baseClass = cn(
    "pointer-events-auto relative z-20 inline-flex w-fit items-center gap-1 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className
  );

  if (item.docsHref) {
    return (
      <a
        className={baseClass}
        href={item.docsHref}
        onClick={(event) => event.stopPropagation()}
        rel="noopener noreferrer"
        target="_blank"
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      className={baseClass}
      onClick={(event) => {
        event.stopPropagation();
        onDocs?.(item.id);
      }}
      type="button"
    >
      {inner}
    </button>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      {children}
    </p>
  );
}

const DOT_GRID_STYLE = {
  backgroundImage:
    "radial-gradient(color-mix(in oklch, var(--color-foreground) 9%, transparent) 1px, transparent 1px)",
  backgroundSize: "1.125rem 1.125rem",
  maskImage:
    "radial-gradient(ellipse 100% 80% at 50% 0%, black 30%, transparent 75%)",
} as const;

const SPOTLIGHT_STYLE = {
  background:
    "radial-gradient(16rem circle at var(--spotlight-x, 50%) var(--spotlight-y, 0%), color-mix(in oklch, var(--color-primary) 18%, transparent), transparent 60%)",
} as const;

function SegmentedCards({
  items,
  className,
  onSelect,
  onDocs,
}: ConnectedCardsProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const rect = panel.getBoundingClientRect();
    panel.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
    panel.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      className={cn(
        "group/panel relative grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10",
        getColumnClass(items.length),
        "sm:divide-x sm:divide-y-0",
        className
      )}
      onPointerMove={handlePointerMove}
      ref={panelRef}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-60"
        style={DOT_GRID_STYLE}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover/panel:opacity-100"
        style={SPOTLIGHT_STYLE}
      />
      {items.map((item) => (
        <div
          className="group/cell relative flex flex-col gap-4 p-5 transition-colors duration-200 hover:bg-muted/40"
          key={item.id}
        >
          <PrimaryOverlay item={item} onSelect={onSelect} />
          <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-4">
            <div className="flex items-start justify-between">
              <IconChip
                className={cn(
                  "ring-1 transition-transform duration-200 group-hover/cell:scale-105",
                  item.accentIcon ??
                    "bg-muted text-foreground ring-foreground/10"
                )}
                icon={item.icon}
              />
              <span
                aria-hidden
                className="-translate-x-1 flex size-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all duration-200 group-hover/cell:translate-x-0 group-hover/cell:text-foreground group-hover/cell:opacity-100"
              >
                <HugeiconsIcon className="size-4" icon={ArrowRight01Icon} />
              </span>
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="font-medium text-base tracking-tight">
                {item.title}
              </h3>
              {item.description ? (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              ) : null}
            </div>
            <DocsAction className="mt-auto" item={item} onDocs={onDocs} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ElevatedCards({ items, className, onSelect, onDocs }: ConnectedCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        getColumnClass(items.length),
        className
      )}
    >
      {items.map((item) => (
        <div
          className="group/cell relative flex flex-col rounded-xl bg-card shadow-sm ring-1 ring-foreground/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-foreground/20"
          key={item.id}
        >
          <PrimaryOverlay item={item} onSelect={onSelect} />
          <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <IconChip
                className={cn(
                  "ring-1",
                  item.accentIcon ?? "bg-primary/10 text-primary ring-primary/10"
                )}
                icon={item.icon}
              />
              {item.eyebrow ? (
                <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground text-xs">
                  {item.eyebrow}
                </span>
              ) : null}
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="font-semibold text-base leading-snug">
                {item.title}
              </h3>
              {item.description ? (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="pointer-events-none relative z-10 flex items-center border-t px-5 py-3">
            <DocsAction item={item} onDocs={onDocs} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AccentCards({ items, className, onSelect, onDocs }: ConnectedCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1.5 rounded-2xl border bg-muted/30 p-1.5",
        getColumnClass(items.length),
        className
      )}
    >
      {items.map((item) => (
        <div
          className="group/cell relative flex flex-col gap-4 overflow-hidden rounded-xl bg-card p-5 ring-1 ring-foreground/5 transition-colors hover:bg-gradient-to-br hover:from-primary/10 hover:to-card"
          key={item.id}
        >
          <PrimaryOverlay item={item} onSelect={onSelect} />
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-200 group-hover/cell:opacity-100"
          />
          <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-4">
            <IconChip
              className={cn(
                "ring-1 transition-transform duration-200 group-hover/cell:scale-105",
                item.accentIcon ?? "bg-primary/10 text-primary ring-primary/20"
              )}
              icon={item.icon}
            />
            <div className="flex-1 space-y-1.5">
              {item.eyebrow ? <Eyebrow>{item.eyebrow}</Eyebrow> : null}
              <h3 className="font-semibold text-lg leading-snug">
                {item.title}
              </h3>
              {item.description ? (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              ) : null}
            </div>
            <DocsAction
              className="w-fit rounded-full bg-muted px-3 py-1.5 text-foreground hover:bg-muted/70"
              item={item}
              onDocs={onDocs}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConnectedCards({
  variant = "segmented",
  ...props
}: ConnectedCardsProps) {
  if (variant === "elevated") {
    return <ElevatedCards {...props} />;
  }
  if (variant === "accent") {
    return <AccentCards {...props} />;
  }
  return <SegmentedCards {...props} />;
}

export { ConnectedCards };
export type { ConnectedCardItem, ConnectedCardsProps, ConnectedCardsVariant };
