"use client";

import { cn } from "@notra/ui/lib/utils";
import { useAtom } from "jotai";
import {
  type MouseEventHandler,
  type PropsWithChildren,
  useCallback,
  useRef,
  useState,
} from "react";
import { windowWidthAtom } from "../store";

type Handle = "right" | "left";

const maxWidth = 640;
const minWidth = 360;

const dragPointBase =
  "absolute z-2 top-1/2 h-6 w-6 cursor-col-resize select-none after:absolute after:top-1/2 after:left-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-foreground after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";

const ResizableFrame = ({ children }: PropsWithChildren) => {
  const currentHandleRef = useRef<Handle>(undefined);
  const windowRef = useRef<HTMLDivElement>(null);
  const startWidthRef = useRef<number>(undefined);
  const startXRef = useRef<number>(undefined);
  const [windowWidth, setWindowWidth] = useAtom(windowWidthAtom);
  const [isResizing, setResizing] = useState(false);

  const mouseMoveHandler = useCallback(
    (event: MouseEvent) => {
      let newWidth;

      if (currentHandleRef.current === "left") {
        newWidth =
          startWidthRef.current! - (event.clientX - startXRef.current!) * 2;
      } else {
        newWidth =
          startWidthRef.current! + (event.clientX - startXRef.current!) * 2;
      }

      if (newWidth > maxWidth) {
        newWidth = maxWidth;
      } else if (newWidth < minWidth) {
        newWidth = minWidth;
      }

      setWindowWidth(newWidth);
    },
    [setWindowWidth]
  );

  const clearSelection = useCallback(() => {
    const sel = document.getSelection();
    if (sel && sel.removeAllRanges) {
      sel.removeAllRanges();
    }
  }, []);

  const mouseUpHandler = useCallback(() => {
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", mouseUpHandler);
    setResizing(false);
    clearSelection();
  }, [mouseMoveHandler, clearSelection]);

  const handleResizeFrameX = useCallback(
    (handle: Handle): MouseEventHandler<HTMLDivElement> =>
      (event) => {
        currentHandleRef.current = handle;
        startWidthRef.current = windowRef.current!.offsetWidth;
        startXRef.current = event.clientX;
        setResizing(true);

        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
      },
    [mouseMoveHandler, mouseUpHandler]
  );

  return (
    <div className={cn("relative inline-block", isResizing && "select-none")}>
      <div
        className={cn(
          dragPointBase,
          "-translate-x-1/2 -translate-y-1/2 left-0"
        )}
        onMouseDown={handleResizeFrameX("left")}
      />
      <div
        className={cn(
          dragPointBase,
          "-translate-y-1/2 right-0 translate-x-1/2"
        )}
        onMouseDown={handleResizeFrameX("right")}
      />
      <div ref={windowRef} style={{ width: windowWidth || "auto" }}>
        {children}
      </div>

      {windowWidth && !isResizing && (
        <div className="absolute inset-x-0 flex justify-center">
          <a
            className="m-4 inline-flex cursor-pointer flex-col items-center gap-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
            onClick={(event) => {
              event.preventDefault();
              setWindowWidth(null);
            }}
          >
            Set to auto width
          </a>
        </div>
      )}

      {isResizing && (
        <div className="before:-z-1 absolute inset-x-0 my-4 border-muted-foreground/50 border-x text-center text-muted-foreground/50 text-xs before:absolute before:inset-x-0 before:top-1/2 before:border-muted-foreground/50 before:border-t before:content-['']">
          <span className="bg-background px-4">{windowWidth} px</span>
        </div>
      )}
    </div>
  );
};

export default ResizableFrame;
