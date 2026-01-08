"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TextSelection {
  text: string;
}

export function useTextSelection(
  containerRef: React.RefObject<HTMLElement | null>
) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const lastValidSelection = useRef<TextSelection | null>(null);

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const target = event.target as HTMLElement;

      // Check if click is within our container
      if (!container.contains(target)) {
        return;
      }

      // Handle textarea selection
      if (target instanceof HTMLTextAreaElement) {
        const start = target.selectionStart;
        const end = target.selectionEnd;
        if (start !== end) {
          const text = target.value.substring(start, end).trim();
          if (text) {
            const newSelection = { text };
            lastValidSelection.current = newSelection;
            setSelection(newSelection);
          }
        }
        return;
      }

      // Handle regular text selection
      const activeSelection = window.getSelection();
      if (!activeSelection || activeSelection.isCollapsed) {
        return;
      }

      const range = activeSelection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        return;
      }

      const text = activeSelection.toString().trim();
      if (!text) {
        return;
      }

      const newSelection = { text };
      lastValidSelection.current = newSelection;
      setSelection(newSelection);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerRef]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    lastValidSelection.current = null;
    window.getSelection()?.removeAllRanges();
  }, []);

  return { selection, clearSelection };
}
