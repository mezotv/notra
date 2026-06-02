import { copyAsFigma } from "@notra/kiwi";
import { copyAsPaper } from "@notra/kiwi/paper";
import { toast } from "sonner";

export async function copyImageAsFigma(
  element: HTMLElement | null,
  label?: string
): Promise<void> {
  if (!element) {
    toast.error("Image is not ready yet");
    return;
  }

  try {
    await copyAsFigma(element, { label, name: label });
    toast.success("Copied for Figma. Paste it into your Figma file.");
  } catch (error) {
    console.error("Failed to copy image for Figma", error);
    toast.error("Failed to copy for Figma");
  }
}

export async function copyImageAsPaper(
  element: HTMLElement | null,
  label?: string
): Promise<void> {
  if (!element) {
    toast.error("Image is not ready yet");
    return;
  }

  try {
    await copyAsPaper(element, { label, name: label });
    toast.success("Copied for Paper. Paste it into your Paper file.");
  } catch (error) {
    console.error("Failed to copy image for Paper", error);
    toast.error("Failed to copy for Paper");
  }
}
