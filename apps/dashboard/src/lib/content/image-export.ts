import { copyAsFigma } from "@notra/kiwi";
import { copyAsPaper } from "@notra/kiwi/paper";
import { toast } from "sonner";
import {
  buildImageDownloadFilename,
  downloadBlob,
  sanitizeDownloadFilename,
} from "@/utils/download";

function createExportElement(html: string): HTMLDivElement {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "1200px";
  container.style.height = "630px";
  container.style.overflow = "hidden";
  container.style.pointerEvents = "none";

  const range = document.createRange();
  container.replaceChildren(range.createContextualFragment(html));
  document.body.appendChild(container);

  return container;
}

async function withExportElement(
  element: HTMLElement | null,
  html: string | null | undefined,
  htmlUrl: string | null | undefined,
  copy: (element: HTMLElement) => Promise<void>
): Promise<boolean> {
  let exportHtml = html?.trim() ? html : null;

  if (!(exportHtml || htmlUrl?.trim())) {
    if (!element) {
      return false;
    }
    await copy(element);
    return true;
  }

  if (!exportHtml && htmlUrl) {
    const response = await fetch(htmlUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image HTML artifact: ${response.status}`
      );
    }
    exportHtml = await response.text();
  }

  if (!exportHtml?.trim()) {
    return false;
  }

  const exportElement = createExportElement(exportHtml);
  try {
    await copy(exportElement);
  } finally {
    exportElement.remove();
  }
  return true;
}

export async function copyImageAsFigma(
  element: HTMLElement | null,
  label?: string,
  html?: string | null,
  htmlUrl?: string | null
): Promise<void> {
  try {
    const copied = await withExportElement(
      element,
      html,
      htmlUrl,
      (exportElement) => copyAsFigma(exportElement, { label, name: label })
    );
    if (!copied) {
      toast.error("Image is not ready yet");
      return;
    }
    toast.success("Copied for Figma. Paste it into your Figma file.");
  } catch (error) {
    console.error("Failed to copy image for Figma", error);
    toast.error("Failed to copy for Figma");
  }
}

export async function copyImageAsPaper(
  element: HTMLElement | null,
  label?: string,
  html?: string | null,
  htmlUrl?: string | null
): Promise<void> {
  try {
    const copied = await withExportElement(
      element,
      html,
      htmlUrl,
      (exportElement) => copyAsPaper(exportElement, { label, name: label })
    );
    if (!copied) {
      toast.error("Image is not ready yet");
      return;
    }
    toast.success("Copied for Paper. Paste it into your Paper file.");
  } catch (error) {
    console.error("Failed to copy image for Paper", error);
    toast.error("Failed to copy for Paper");
  }
}

export async function downloadImage(
  imageUrl: string | null | undefined,
  label?: string
): Promise<void> {
  if (!imageUrl) {
    toast.error("Image is not ready yet");
    return;
  }

  const baseName = sanitizeDownloadFilename(label ?? "image") || "image";

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const blob = await response.blob();
    downloadBlob(blob, buildImageDownloadFilename(baseName, blob.type, "png"));
    toast.success("Downloaded image");
  } catch (error) {
    console.error("Failed to download image", error);
    toast.error("Failed to download image");
  }
}
