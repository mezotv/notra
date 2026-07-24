const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const HEX_CHANNEL_MAX = 255;

export function normalizeHex(input: string): string | null {
  if (!HEX_COLOR.test(input)) {
    return null;
  }
  const hex = input.slice(1);
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((char) => char + char)
      .join("")}`.toLowerCase();
  }
  return `#${hex}`.toLowerCase();
}

export function rgbaToHex(channels: readonly number[]): string {
  const toHex = (channel: number | undefined) =>
    Math.round(Math.min(Math.max(channel ?? 0, 0), HEX_CHANNEL_MAX))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(channels[0])}${toHex(channels[1])}${toHex(channels[2])}`;
}
