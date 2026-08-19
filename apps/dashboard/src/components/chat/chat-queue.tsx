"use client";

import { Cancel01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export interface QueuedMessage {
  id: string;
  text: string;
}

interface ChatQueueProps {
  messages: QueuedMessage[];
  onEdit: (message: QueuedMessage) => void;
  onRemove: (id: string) => void;
}

const INSTANT = { duration: 0 } as const;
const CONTAINER_SPRING = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.7,
} as const;
const ITEM_SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;

export function ChatQueue({ messages, onEdit, onRemove }: ChatQueueProps) {
  const reduceMotion = useReducedMotion();
  const hasMessages = messages.length > 0;
  const containerTransition = reduceMotion ? INSTANT : CONTAINER_SPRING;
  const itemTransition = reduceMotion ? INSTANT : ITEM_SPRING;

  return (
    <AnimatePresence initial={false}>
      {hasMessages && (
        <motion.div
          animate={{ height: "auto", opacity: 1, y: 0 }}
          aria-label="Queued messages"
          className="overflow-hidden rounded-t-[14px] border border-border border-b-0 bg-background px-1.5 pt-1.5 pb-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none"
          exit={{ height: 0, opacity: 0, y: 12 }}
          initial={{ height: 0, opacity: 0, y: 12 }}
          transition={containerTransition}
        >
          <div className="flex items-center justify-between px-2 pt-0.5 pb-1.5">
            <span className="font-medium text-muted-foreground text-xs">
              Queued · {messages.length}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              Sends after next tool
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0, y: -4 }}
                  initial={{ height: 0, opacity: 0, y: -4 }}
                  key={message.id}
                  layout={!reduceMotion}
                  transition={itemTransition}
                >
                  <div className="group flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-foreground text-xs transition-colors">
                    <p className="line-clamp-1 flex-1 font-medium">
                      {message.text}
                    </p>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        aria-label="Edit queued message"
                        className="ml-0.5 cursor-pointer rounded p-0.5 transition-colors hover:bg-accent"
                        onClick={() => onEdit(message)}
                        type="button"
                      >
                        <HugeiconsIcon className="size-3" icon={Edit02Icon} />
                      </button>
                      <button
                        aria-label="Remove from queue"
                        className="cursor-pointer rounded p-0.5 transition-colors hover:bg-accent"
                        onClick={() => onRemove(message.id)}
                        type="button"
                      >
                        <HugeiconsIcon className="size-3" icon={Cancel01Icon} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
