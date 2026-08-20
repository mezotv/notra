import { fetchBlobFromUrl } from "@/utils/download";

async function blobToPng(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);
  let image: HTMLImageElement;
  try {
    image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = document.createElement("img");
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Failed to decode image"));
      element.src = objectUrl;
    });
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
  URL.revokeObjectURL(objectUrl);

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create canvas");
  }
  context.drawImage(image, 0, 0);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((encoded) => {
      if (encoded) {
        resolve(encoded);
        return;
      }
      reject(new Error("Failed to encode PNG"));
    }, "image/png");
  });
}

export async function copyImageToClipboard(url: string) {
  if (!navigator.clipboard?.write) {
    throw new Error("Clipboard is not available");
  }

  const blob = await fetchBlobFromUrl(url);
  const pngBlob = blob.type === "image/png" ? blob : await blobToPng(blob);

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": pngBlob }),
  ]);
}
