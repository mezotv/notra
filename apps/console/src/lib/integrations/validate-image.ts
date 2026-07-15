import "server-only";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const WEBP_HEADER_LENGTH = 12;
const SVG_SNIFF_LENGTH = 1024;

function startsWithBytes(bytes: Buffer, signature: number[]) {
  if (bytes.length < signature.length) {
    return false;
  }
  return signature.every((byte, index) => bytes[index] === byte);
}

function isWebp(bytes: Buffer) {
  return (
    bytes.length >= WEBP_HEADER_LENGTH &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
}

function isSvg(bytes: Buffer) {
  const head = bytes
    .toString("utf8", 0, Math.min(bytes.length, SVG_SNIFF_LENGTH))
    .toLowerCase();
  return head.includes("<svg");
}

export function matchesDeclaredImageType(bytes: Buffer, contentType: string) {
  switch (contentType) {
    case "image/png":
      return startsWithBytes(bytes, PNG_SIGNATURE);
    case "image/jpeg":
      return startsWithBytes(bytes, JPEG_SIGNATURE);
    case "image/webp":
      return isWebp(bytes);
    case "image/svg+xml":
      return isSvg(bytes);
    default:
      return false;
  }
}
