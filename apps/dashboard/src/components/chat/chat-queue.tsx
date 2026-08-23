"use client";

import type { ContextItem, TextSelection } from "@notra/ai/types/chat";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Composer } from "@/components/composer/composer-shell";

export interface QueuedMessage {
  id: string;
  text: string;
  selection?: TextSelection;
  context?: ContextItem[];
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
          className="overflow-hidden rounded-t-[14px] border border-border border-b-0 bg-muted px-2.5 pt-1.5 pb-1"
          exit={{ height: 0, opacity: 0, y: 12 }}
          initial={{ height: 0, opacity: 0, y: 12 }}
          transition={containerTransition}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-full"
                  exit={{ opacity: 0, scale: 0.96 }}
                  initial={{ opacity: 0, scale: 0.96 }}
                  key={message.id}
                  layout={!reduceMotion}
                  transition={itemTransition}
                >
                  <Composer.Chip
                    editLabel="Edit queued message"
                    label={message.text}
                    onEdit={() => onEdit(message)}
                    onRemove={() => onRemove(message.id)}
                    removeLabel="Remove from queue"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
