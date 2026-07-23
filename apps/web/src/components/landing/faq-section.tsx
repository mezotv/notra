"use client";

import { cn } from "@notra/ui/lib/utils";
import { useState } from "react";
import { FAQ_CONTENT } from "@/constants/landing/faq";
import type { FaqItem } from "@/types/landing/faq";

function FaqToggleIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.992 12H3.992"
        fill="none"
        stroke="#8B5CF6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        className={cn(
          "origin-center transition-transform duration-300 ease-out motion-reduce:transition-none",
          open ? "scale-y-0" : "scale-y-100"
        )}
        d="M11.992 4V20"
        fill="none"
        stroke="#8B5CF6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `faq-panel-${item.id}`;
  const triggerId = `faq-trigger-${item.id}`;

  return (
    <div className="flex flex-col border-[#1E1E1E1F] border-t py-7.5 dark:border-white/10">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-4 text-left sm:gap-8"
        id={triggerId}
        onClick={onToggle}
        type="button"
      >
        <span className="flex shrink-0 items-center justify-center">
          <FaqToggleIcon open={open} />
        </span>
        <span className="grow font-medium font-sans text-[#1E1E1E] text-lg leading-7 tracking-[-0.01em] sm:text-xl sm:leading-[1.875rem] dark:text-white">
          {item.question}
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        id={panelId}
      >
        <div className="overflow-hidden">
          <p className="whitespace-pre-wrap pt-3.5 font-sans text-[#1E1E1E99] text-base leading-6 tracking-[-0.01em] dark:text-white/60">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function getInitialOpenId(items: FaqItem[]) {
  const defaultItem = items.find((item) => item.defaultOpen);
  return defaultItem ? defaultItem.id : null;
}

export function FaqSection() {
  const { heading, subcopy, items } = FAQ_CONTENT;
  const [openId, setOpenId] = useState<string | null>(() =>
    getInitialOpenId(items)
  );

  return (
    <section className="flex flex-col items-center px-6 pt-20 pb-16 antialiased sm:px-12 lg:px-20 lg:pt-35 lg:pb-24">
      <div className="flex w-full flex-col items-center gap-14 lg:gap-18">
        <div className="flex w-full max-w-[51.5625rem] flex-col items-center gap-4">
          <h2 className="text-balance text-center font-display font-medium text-[2rem] text-black leading-[1.1] tracking-[-0.02em] sm:text-[2.75rem] lg:text-[3.0625rem] lg:leading-[3.5rem] dark:text-white">
            {heading}
          </h2>
          <p className="max-w-[31rem] text-balance text-center font-display font-medium text-[#1E1E1EBF] text-lg leading-7 tracking-[-0.01em] sm:text-xl sm:leading-[1.875rem] dark:text-white/70">
            {subcopy}
          </p>
        </div>
        <div className="flex w-full max-w-[55rem] flex-col">
          {items.map((item) => (
            <FaqRow
              item={item}
              key={item.id}
              onToggle={() =>
                setOpenId((current) => (current === item.id ? null : item.id))
              }
              open={openId === item.id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
