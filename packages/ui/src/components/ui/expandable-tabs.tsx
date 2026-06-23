"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useId, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { cn } from "@notra/ui/lib/utils";

interface ExpandableTabsItem {
  value: string;
  label: string;
  icon: ReactNode;
  href?: string;
}

interface ExpandableTabsProps {
  items: ExpandableTabsItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  className?: string;
}

const SPRING = { type: "spring", bounce: 0.2, duration: 0.45 } as const;

interface ExpandableTabProps {
  item: ExpandableTabsItem;
  isActive: boolean;
  layoutId: string;
  onSelect: (value: string) => void;
}

function ExpandableTab({
  item,
  isActive,
  layoutId,
  onSelect,
}: ExpandableTabProps) {
  const tabClassName =
    "relative flex shrink-0 cursor-pointer items-center rounded-xl p-2 outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring";

  const content = (
    <>
      {isActive && (
        <motion.span
          className="absolute inset-0 rounded-xl bg-background shadow-sm ring-1 ring-border"
          layoutId={layoutId}
          transition={SPRING}
        />
      )}
      <span className="relative z-10 flex items-center">
        {item.icon}
        <AnimatePresence initial={false}>
          {isActive && (
            <motion.span
              animate={{ width: "auto", opacity: 1 }}
              className="overflow-hidden whitespace-nowrap font-medium text-foreground text-sm"
              exit={{ width: 0, opacity: 0 }}
              initial={{ width: 0, opacity: 0 }}
              transition={SPRING}
            >
              <span className="block pr-1 pl-2">{item.label}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </>
  );

  return (
    <Tooltip disabled={isActive}>
      <TooltipTrigger
        render={
          item.href ? (
            <a
              aria-current={isActive ? "page" : undefined}
              className={tabClassName}
              href={item.href}
            >
              {content}
            </a>
          ) : (
            <button
              aria-pressed={isActive}
              className={tabClassName}
              onClick={() => onSelect(item.value)}
              type="button"
            >
              {content}
            </button>
          )
        }
      />
      <TooltipContent>{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function ExpandableTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  label = "Choose an option",
  className,
}: ExpandableTabsProps) {
  const layoutId = useId();
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? items[0]?.value
  );
  const activeValue = value ?? internalValue;

  const handleSelect = (next: string) => {
    setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <div className="flex justify-center">
      {/* biome-ignore lint/a11y/useSemanticElements: A fieldset's min-width prevents the horizontal overflow scrolling this group needs. */}
      <div
        aria-label={label}
        className={cn(
          "flex max-w-full items-center gap-1.5 overflow-x-auto overscroll-none rounded-2xl border bg-muted/50 p-1.5 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible [&::-webkit-scrollbar]:hidden",
          className
        )}
        role="group"
      >
        {items.map((item) => (
          <ExpandableTab
            isActive={item.value === activeValue}
            item={item}
            key={item.value}
            layoutId={layoutId}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

export type { ExpandableTabsItem, ExpandableTabsProps };
