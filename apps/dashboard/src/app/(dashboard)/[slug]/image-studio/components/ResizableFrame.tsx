"use client";

import classNames from "classnames";
import { useAtom } from "jotai";
import {
  type MouseEventHandler,
  type PropsWithChildren,
  useCallback,
  useRef,
  useState,
} from "react";
import { windowWidthAtom } from "../store";
import styles from "./ResizableFrame.module.css";

type Handle = "right" | "left";

const maxWidth = 920;
const minWidth = 520;

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
    <div
      className={classNames(
        styles.resizableFrame,
        isResizing && styles.isResizing
      )}
    >
      <div
        className={classNames(styles.windowSizeDragPoint, styles.left)}
        onMouseDown={handleResizeFrameX("left")}
      />
      <div
        className={classNames(styles.windowSizeDragPoint, styles.right)}
        onMouseDown={handleResizeFrameX("right")}
      />
      <div ref={windowRef} style={{ width: windowWidth || "auto" }}>
        {children}
      </div>

      {windowWidth && !isResizing && (
        <div className={styles.resetWidthContainer}>
          <a
            className={styles.resetWidth}
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
        <div className={styles.ruler}>
          <span>{windowWidth} px</span>
        </div>
      )}
    </div>
  );
};

export default ResizableFrame;
