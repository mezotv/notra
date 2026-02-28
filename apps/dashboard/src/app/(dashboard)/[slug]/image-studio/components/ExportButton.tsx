"use client";

import classNames from "classnames";
import { useAtom, useAtomValue } from "jotai";
import { useContext, useEffect, useRef, useState } from "react";
import { toBlob, toPng, toSvg } from "../lib/image";
import { fileNameAtom } from "../store";
import { FrameContext } from "../store/FrameContextStore";
import { derivedFlashMessageAtom, flashShownAtom } from "../store/flash";
import {
  EXPORT_SIZE_OPTIONS,
  exportSizeAtom,
  SIZE_LABELS,
} from "../store/image";
import download from "../util/download";
import usePngClipboardSupported from "../util/usePngClipboardSupported";
import styles from "./ExportButton.module.css";

const ExportButton = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pngClipboardSupported = usePngClipboardSupported();
  const frameContext = useContext(FrameContext);
  const [, setFlashMessage] = useAtom(derivedFlashMessageAtom);
  const [, setFlashShown] = useAtom(flashShownAtom);
  const customFileName = useAtomValue(fileNameAtom);
  const fileName = customFileName.replaceAll(" ", "-") || "code-export";
  const [exportSize, setExportSize] = useAtom(exportSizeAtom);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const savePng = async () => {
    if (!frameContext?.current) {
      throw new Error("Couldn't find a frame to export");
    }

    setFlashMessage({ message: "Exporting PNG..." });

    const dataUrl = await toPng(frameContext.current, {
      pixelRatio: exportSize,
    });

    download(dataUrl, `${fileName}.png`);
    setFlashShown(false);
  };

  const copyPng = async () => {
    setFlashMessage({ message: "Copying PNG..." });
    if (!frameContext?.current) {
      throw new Error("Couldn't find a frame to export");
    }

    const clipboardItem = new ClipboardItem({
      "image/png": toBlob(frameContext.current, {
        pixelRatio: exportSize,
      }).then((blob) => {
        if (!blob) {
          throw new Error("expected toBlob to return a blob");
        }
        return blob;
      }),
    });

    await navigator.clipboard.write([clipboardItem]);
    setFlashMessage({
      message: "PNG Copied to clipboard!",
      timeout: 2000,
    });
  };

  const saveSvg = async () => {
    if (!frameContext?.current) {
      throw new Error("Couldn't find a frame to export");
    }

    setFlashMessage({ message: "Exporting SVG..." });

    const dataUrl = await toSvg(frameContext.current);
    download(dataUrl, `${fileName}.svg`);
    setFlashShown(false);
  };

  const copyUrl = async () => {
    const url = window.location.toString();
    await navigator.clipboard.writeText(url);
    setFlashMessage({
      message: "URL Copied to clipboard!",
      timeout: 2000,
    });
  };

  return (
    <div
      className={styles.exportContainer}
      ref={containerRef}
      style={{ position: "relative" }}
    >
      <button className={styles.exportButton} onClick={savePng} type="button">
        Export Image
      </button>
      <button
        aria-label="See other export options"
        className={styles.dropdownTrigger}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        type="button"
      >
        <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      {dropdownOpen && (
        <div className={styles.dropdownMenu}>
          <button
            className={styles.dropdownItem}
            onClick={() => {
              savePng();
              setDropdownOpen(false);
            }}
            type="button"
          >
            Save PNG
          </button>
          <button
            className={styles.dropdownItem}
            onClick={() => {
              saveSvg();
              setDropdownOpen(false);
            }}
            type="button"
          >
            Save SVG
          </button>
          {pngClipboardSupported && (
            <button
              className={styles.dropdownItem}
              onClick={() => {
                copyPng();
                setDropdownOpen(false);
              }}
              type="button"
            >
              Copy Image
            </button>
          )}
          <button
            className={styles.dropdownItem}
            onClick={() => {
              copyUrl();
              setDropdownOpen(false);
            }}
            type="button"
          >
            Copy URL
          </button>
          <div className={styles.separator} />
          <div className={styles.sizeGroup}>
            <span className={styles.sizeLabel}>Size</span>
            {EXPORT_SIZE_OPTIONS.map((size) => (
              <button
                className={classNames(
                  styles.sizeOption,
                  exportSize === size && styles.active
                )}
                key={size}
                onClick={() => setExportSize(size)}
                type="button"
              >
                {SIZE_LABELS[size]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
