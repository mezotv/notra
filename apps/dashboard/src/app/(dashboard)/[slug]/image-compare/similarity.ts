/**
 * Pixel-similarity comparison for two images, run entirely in the browser.
 *
 * Both images are drawn onto a fixed-size offscreen canvas so they can be
 * compared cell-for-cell regardless of their original dimensions. The score is
 * the mean per-channel difference expressed as a percentage of identical
 * pixels (100% = pixel-identical, 0% = maximally different).
 */

const COMPARISON_SIZE = 256;
const MAX_CHANNEL_VALUE = 255;
const CHANNELS_PER_PIXEL = 3;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

function drawToImageData(image: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = COMPARISON_SIZE;
  canvas.height = COMPARISON_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is unavailable");
  }

  context.drawImage(image, 0, 0, COMPARISON_SIZE, COMPARISON_SIZE);
  return context.getImageData(0, 0, COMPARISON_SIZE, COMPARISON_SIZE);
}

export async function computeImageSimilarity(
  srcA: string,
  srcB: string
): Promise<number> {
  const [imageA, imageB] = await Promise.all([
    loadImage(srcA),
    loadImage(srcB),
  ]);

  const dataA = drawToImageData(imageA).data;
  const dataB = drawToImageData(imageB).data;

  let totalDifference = 0;
  for (let i = 0; i < dataA.length; i += 4) {
    const redA = dataA[i] ?? 0;
    const greenA = dataA[i + 1] ?? 0;
    const blueA = dataA[i + 2] ?? 0;
    const redB = dataB[i] ?? 0;
    const greenB = dataB[i + 1] ?? 0;
    const blueB = dataB[i + 2] ?? 0;
    totalDifference +=
      Math.abs(redA - redB) +
      Math.abs(greenA - greenB) +
      Math.abs(blueA - blueB);
  }

  const pixelCount = COMPARISON_SIZE * COMPARISON_SIZE;
  const maxDifference = pixelCount * CHANNELS_PER_PIXEL * MAX_CHANNEL_VALUE;
  const similarity = (1 - totalDifference / maxDifference) * 100;

  return Math.max(0, Math.min(100, similarity));
}
