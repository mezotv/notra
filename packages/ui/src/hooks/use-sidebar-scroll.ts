"use client";

import * as React from "react";

function useSidebarScroll() {
  const contentElementRef = React.useRef<HTMLDivElement | null>(null);

  const contentRef = React.useCallback((element: HTMLDivElement | null) => {
    contentElementRef.current = element;
  }, []);

  const proxyWheelToContent = React.useCallback(
    (event: React.WheelEvent<HTMLElement>) => {
      const contentElement = contentElementRef.current;
      if (!contentElement || event.deltaY === 0 || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      contentElement.scrollTop += event.deltaY;
    },
    []
  );

  return {
    contentRef,
    proxyWheelToContent,
  };
}

export { useSidebarScroll };
