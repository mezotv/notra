export function rgbaToHex(channels: readonly number[]): string {
  const toHex = (channel: number | undefined) =>
    Math.round(Math.min(Math.max(channel ?? 0, 0), 255))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(channels[0])}${toHex(channels[1])}${toHex(channels[2])}`;
}
