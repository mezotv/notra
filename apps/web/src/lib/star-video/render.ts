import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import {
  ensureBrowser,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import type { StarVideoInputProps } from "@/types/star-video";

let serveUrlPromise: Promise<string> | null = null;

function bundleComposition(): Promise<string> {
  return bundle({
    entryPoint: join(process.cwd(), "src/remotion/index.ts"),
    publicDir: join(process.cwd(), "public"),
  });
}

function getServeUrl(): Promise<string> {
  if (process.env.NODE_ENV !== "production") {
    return bundleComposition();
  }
  if (!serveUrlPromise) {
    serveUrlPromise = bundleComposition();
    serveUrlPromise.catch(() => {
      serveUrlPromise = null;
    });
  }
  return serveUrlPromise;
}

export async function renderStarVideo(
  inputProps: StarVideoInputProps
): Promise<Buffer> {
  const [, serveUrl] = await Promise.all([ensureBrowser(), getServeUrl()]);

  const composition = await selectComposition({
    serveUrl,
    id: "StarVideo",
    inputProps,
  });

  const dir = await mkdtemp(join(tmpdir(), "star-video-"));
  const outputLocation = join(dir, "star-video.mp4");

  try {
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps,
    });
    return await readFile(outputLocation);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
