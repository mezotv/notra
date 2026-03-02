"use client";

import { Button } from "@notra/ui/components/ui/button";
import { ButtonGroup } from "@notra/ui/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useAtom, useAtomValue } from "jotai";
import { useContext } from "react";
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

const ExportButton = () => {
  const pngClipboardSupported = usePngClipboardSupported();
  const frameContext = useContext(FrameContext);
  const [, setFlashMessage] = useAtom(derivedFlashMessageAtom);
  const [, setFlashShown] = useAtom(flashShownAtom);
  const customFileName = useAtomValue(fileNameAtom);
  const fileName = customFileName.replaceAll(" ", "-") || "code-export";
  const [exportSize, setExportSize] = useAtom(exportSizeAtom);

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
    <ButtonGroup>
      <Button onClick={savePng} size="sm">
        Export Image
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="See other export options"
          className="inline-flex h-7 items-center rounded-r-lg bg-primary px-1.5 text-primary-foreground transition-colors hover:bg-primary/80"
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
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
          <DropdownMenuItem onClick={() => savePng()}>
            Save PNG
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => saveSvg()}>
            Save SVG
          </DropdownMenuItem>
          {pngClipboardSupported && (
            <DropdownMenuItem onClick={() => copyPng()}>
              Copy Image
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => copyUrl()}>
            Copy URL
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Size</DropdownMenuLabel>
          {EXPORT_SIZE_OPTIONS.map((size) => (
            <DropdownMenuItem
              className={exportSize === size ? "bg-accent" : ""}
              key={size}
              onClick={() => setExportSize(size)}
            >
              {SIZE_LABELS[size]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
};

export default ExportButton;
