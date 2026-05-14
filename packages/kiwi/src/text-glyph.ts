import type { Glyph, PathCommand } from "opentype.js";

const CMD_END = 0;
const CMD_MOVE_TO = 1;
const CMD_LINE_TO = 2;
const CMD_QUAD_TO = 3;
const CMD_CUBIC_TO = 4;

class GlyphCommandWriter {
  private readonly bytes: number[] = [];
  private readonly scratch = new ArrayBuffer(4);
  private readonly scratchView = new DataView(this.scratch);

  writeByte(value: number): void {
    this.bytes.push(((Math.trunc(value) % 256) + 256) % 256);
  }

  writeFloat(value: number): void {
    this.scratchView.setFloat32(0, value, true);
    this.bytes.push(
      this.scratchView.getUint8(0),
      this.scratchView.getUint8(1),
      this.scratchView.getUint8(2),
      this.scratchView.getUint8(3)
    );
  }

  get(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

function writePoint(writer: GlyphCommandWriter, x: number, y: number): void {
  writer.writeFloat(x);
  writer.writeFloat(y);
}

export function encodeGlyphCommands(
  glyph: Glyph,
  unitsPerEm: number
): Uint8Array {
  const writer = new GlyphCommandWriter();
  writer.writeByte(0);

  const scale = unitsPerEm === 0 ? 1 : 1 / unitsPerEm;
  for (const command of glyph.path.commands) {
    writeGlyphCommand(writer, command, scale);
  }

  writer.writeByte(CMD_END);
  return writer.get();
}

function writeGlyphCommand(
  writer: GlyphCommandWriter,
  command: PathCommand,
  scale: number
): void {
  switch (command.type) {
    case "M":
      writer.writeByte(CMD_MOVE_TO);
      writePoint(writer, command.x * scale, command.y * scale);
      return;
    case "L":
      writer.writeByte(CMD_LINE_TO);
      writePoint(writer, command.x * scale, command.y * scale);
      return;
    case "Q":
      writer.writeByte(CMD_QUAD_TO);
      writePoint(writer, command.x1 * scale, command.y1 * scale);
      writePoint(writer, command.x * scale, command.y * scale);
      return;
    case "C":
      writer.writeByte(CMD_CUBIC_TO);
      writePoint(writer, command.x1 * scale, command.y1 * scale);
      writePoint(writer, command.x2 * scale, command.y2 * scale);
      writePoint(writer, command.x * scale, command.y * scale);
      return;
    case "Z":
      return;
    default:
      return;
  }
}
