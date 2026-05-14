import { type Font, parse } from "opentype.js";
import { INTER_TTF_BASE64 } from "./inter-data";

let fallbackFontPromise: Promise<Font> | null = null;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function loadFallbackFont(): Promise<Font> {
  fallbackFontPromise ??= Promise.resolve(
    parse(base64ToArrayBuffer(INTER_TTF_BASE64))
  );
  return fallbackFontPromise;
}

export async function loadTextFont(): Promise<Font | null> {
  try {
    return await loadFallbackFont();
  } catch (error) {
    console.warn("[kiwi] failed to load fallback text font", error);
    return null;
  }
}
