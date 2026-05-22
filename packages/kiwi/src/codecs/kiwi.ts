// biome-ignore-all lint/suspicious/noBitwiseOperators: Kiwi binary encoding requires explicit bitwise operations.
import { KIND_ENUM, KIND_MESSAGE, KIND_STRUCT } from "../constants/kiwi";
import type { Definition, FieldDef, KiwiValue } from "../types/kiwi";

export type { Definition, FieldDef, KiwiValue } from "../types/kiwi";

const textDecoder = new TextDecoder("utf-8");
const textEncoder = new TextEncoder();
const scratch = new ArrayBuffer(4);
const scratchView = new DataView(scratch);

export class ByteReader {
  buf: Uint8Array;
  pos: number;

  constructor(buf: Uint8Array, pos = 0) {
    this.buf = buf;
    this.pos = pos;
  }

  remaining(): number {
    return this.buf.length - this.pos;
  }

  private at(pos: number): number {
    const b = this.buf[pos];
    if (b === undefined) {
      throw new Error(`buffer underrun at offset ${pos}`);
    }
    return b;
  }

  readByte(): number {
    const b = this.at(this.pos);
    this.pos += 1;
    return b;
  }

  readBytes(n: number): Uint8Array {
    const out = this.buf.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }

  readVarint(): number {
    let result = 0;
    let shift = 0;
    while (true) {
      const b = this.at(this.pos);
      this.pos += 1;
      result |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) {
        return result >>> 0;
      }
      shift += 7;
      if (shift > 31) {
        throw new Error("varint too long");
      }
    }
  }

  readVarintBig(): bigint {
    let result = 0n;
    let shift = 0n;
    while (true) {
      const b = this.at(this.pos);
      this.pos += 1;
      result |= BigInt(b & 0x7f) << shift;
      if ((b & 0x80) === 0) {
        return result;
      }
      shift += 7n;
      if (shift > 63n) {
        throw new Error("varint too long");
      }
    }
  }

  readSignedVarint(): number {
    const v = this.readVarint();
    return (v >>> 1) ^ -(v & 1);
  }

  readBool(): boolean {
    return this.readByte() !== 0;
  }

  readInt(): number {
    return this.readSignedVarint();
  }

  readUint(): number {
    return this.readVarint();
  }

  readInt64(): bigint {
    const v = this.readVarintBig();
    return (v >> 1n) ^ -(v & 1n);
  }

  readUint64(): bigint {
    return this.readVarintBig();
  }

  readFloat(): number {
    const first = this.readByte();
    if (first === 0) {
      return 0;
    }
    const b1 = this.readByte();
    const b2 = this.readByte();
    const b3 = this.readByte();
    const raw = (first | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0;
    const bits = ((raw << 23) | (raw >>> 9)) >>> 0;
    scratchView.setUint32(0, bits, true);
    return scratchView.getFloat32(0, true);
  }

  readString(): string {
    const start = this.pos;
    let end = start;
    while (this.buf[end] !== 0) {
      end += 1;
    }
    const s = textDecoder.decode(this.buf.subarray(start, end));
    this.pos = end + 1;
    return s;
  }
}

export class ByteWriter {
  private readonly chunks: number[] = [];

  writeByte(b: number): void {
    this.chunks.push(b & 0xff);
  }

  writeBytes(bytes: Uint8Array): void {
    for (const b of bytes) {
      this.chunks.push(b);
    }
  }

  writeVarint(v: number): void {
    if (v < 0) {
      throw new Error("varint must be non-negative");
    }
    let value = v >>> 0;
    while (true) {
      const b = value & 0x7f;
      value >>>= 7;
      if (value) {
        this.chunks.push(b | 0x80);
      } else {
        this.chunks.push(b);
        return;
      }
    }
  }

  writeVarintBig(v: bigint): void {
    if (v < 0n) {
      throw new Error("varint must be non-negative");
    }
    let value = v;
    while (true) {
      const b = Number(value & 0x7fn);
      value >>= 7n;
      if (value > 0n) {
        this.chunks.push(b | 0x80);
      } else {
        this.chunks.push(b);
        return;
      }
    }
  }

  writeSignedVarint(v: number): void {
    const zig = v < 0 ? (-v << 1) - 1 : v << 1;
    this.writeVarint(zig >>> 0);
  }

  writeBool(v: boolean): void {
    this.writeByte(v ? 1 : 0);
  }

  writeInt(v: number): void {
    this.writeSignedVarint(v);
  }

  writeUint(v: number): void {
    this.writeVarint(v);
  }

  writeInt64(v: bigint): void {
    const zig = v < 0n ? (-v << 1n) - 1n : v << 1n;
    this.writeVarintBig(zig);
  }

  writeUint64(v: bigint): void {
    this.writeVarintBig(v);
  }

  writeFloat(v: number): void {
    if (v === 0) {
      this.writeByte(0);
      return;
    }
    scratchView.setFloat32(0, v, true);
    const bits = scratchView.getUint32(0, true);
    const rotated = ((bits << 9) | (bits >>> 23)) >>> 0;
    this.chunks.push(rotated & 0xff);
    this.chunks.push((rotated >>> 8) & 0xff);
    this.chunks.push((rotated >>> 16) & 0xff);
    this.chunks.push((rotated >>> 24) & 0xff);
  }

  writeString(s: string): void {
    const bytes = textEncoder.encode(s);
    for (const b of bytes) {
      this.chunks.push(b);
    }
    this.chunks.push(0);
  }

  get(): Uint8Array {
    return Uint8Array.from(this.chunks);
  }
}

export function parseSchema(buf: Uint8Array): Definition[] {
  const r = new ByteReader(buf);
  const count = r.readVarint();
  const defs: Definition[] = [];
  for (let i = 0; i < count; i += 1) {
    const name = r.readString();
    const kind = r.readByte();
    const fieldCount = r.readVarint();
    const fields: FieldDef[] = [];
    for (let j = 0; j < fieldCount; j += 1) {
      const fname = r.readString();
      const ftype = r.readSignedVarint();
      const farr = r.readByte();
      const fval = r.readVarint();
      fields.push({
        name: fname,
        typeCode: ftype,
        isArray: farr === 1,
        value: fval,
      });
    }
    defs.push({ name, kind, fields });
  }
  return defs;
}

function decodeBuiltin(reader: ByteReader, code: number): KiwiValue {
  switch (code) {
    case -1:
      return reader.readBool();
    case -2:
      return reader.readByte();
    case -3:
      return reader.readInt();
    case -4:
      return reader.readUint();
    case -5:
      return reader.readFloat();
    case -6:
      return reader.readString();
    case -7:
      return reader.readInt64();
    case -8:
      return reader.readUint64();
    default:
      throw new Error(`unknown builtin ${code}`);
  }
}

function encodeBuiltin(
  writer: ByteWriter,
  value: KiwiValue,
  code: number
): void {
  switch (code) {
    case -1:
      writer.writeBool(Boolean(value));
      return;
    case -2:
      writer.writeByte(numberValue(value, "byte"));
      return;
    case -3:
      writer.writeInt(numberValue(value, "int"));
      return;
    case -4:
      writer.writeUint(numberValue(value, "uint"));
      return;
    case -5:
      writer.writeFloat(numberValue(value, "float"));
      return;
    case -6:
      writer.writeString(stringValue(value));
      return;
    case -7:
      writer.writeInt64(bigintValue(value, "int64"));
      return;
    case -8:
      writer.writeUint64(bigintValue(value, "uint64"));
      return;
    default:
      throw new Error(`unknown builtin ${code}`);
  }
}

function numberValue(value: KiwiValue, typeName: string): number {
  if (typeof value !== "number") {
    throw new Error(`cannot encode ${String(value)} as ${typeName}`);
  }
  return value;
}

function stringValue(value: KiwiValue): string {
  if (typeof value !== "string") {
    throw new Error(`cannot encode ${String(value)} as string`);
  }
  return value;
}

function bigintValue(value: KiwiValue, typeName: string): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    return BigInt(value);
  }
  throw new Error(`cannot encode ${String(value)} as ${typeName}`);
}

function arrayValue(value: KiwiValue): KiwiValue[] {
  if (!Array.isArray(value)) {
    throw new Error(`cannot encode ${String(value)} as array`);
  }
  return value;
}

function objectValue(value: KiwiValue): Record<string, KiwiValue> {
  if (!isKiwiRecord(value)) {
    throw new Error(`cannot encode ${String(value)} as object`);
  }
  return value;
}

function isKiwiRecord(value: KiwiValue): value is Record<string, KiwiValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function decodeValue(
  reader: ByteReader,
  typeCode: number,
  isArray: boolean,
  defs: Definition[]
): KiwiValue {
  if (isArray) {
    const n = reader.readVarint();
    const out: KiwiValue[] = [];
    for (let i = 0; i < n; i += 1) {
      out.push(decodeValue(reader, typeCode, false, defs));
    }
    return out;
  }
  if (typeCode < 0) {
    return decodeBuiltin(reader, typeCode);
  }
  return decodeDefinition(reader, typeCode, defs);
}

export function encodeValue(
  writer: ByteWriter,
  value: KiwiValue,
  typeCode: number,
  isArray: boolean,
  defs: Definition[]
): void {
  if (isArray) {
    if (typeCode === -2 && value instanceof Uint8Array) {
      writer.writeVarint(value.length);
      writer.writeBytes(value);
      return;
    }
    const arr = arrayValue(value);
    writer.writeVarint(arr.length);
    for (const item of arr) {
      encodeValue(writer, item, typeCode, false, defs);
    }
    return;
  }
  if (typeCode < 0) {
    encodeBuiltin(writer, value, typeCode);
    return;
  }
  encodeDefinition(writer, value, typeCode, defs);
}

function defAt(defs: Definition[], idx: number): Definition {
  const d = defs[idx];
  if (!d) {
    throw new Error(`definition index out of range: ${idx}`);
  }
  return d;
}

export function decodeDefinition(
  reader: ByteReader,
  defIdx: number,
  defs: Definition[]
): KiwiValue {
  const d = defAt(defs, defIdx);
  if (d.kind === KIND_ENUM) {
    const value = reader.readVarint();
    for (const f of d.fields) {
      if (f.value === value) {
        return f.name;
      }
    }
    return value;
  }
  if (d.kind === KIND_STRUCT) {
    const result: Record<string, KiwiValue> = {};
    for (const f of d.fields) {
      result[f.name] = decodeValue(reader, f.typeCode, f.isArray, defs);
    }
    return result;
  }
  if (d.kind === KIND_MESSAGE) {
    const result: Record<string, KiwiValue> = {};
    while (true) {
      const tag = reader.readVarint();
      if (tag === 0) {
        return result;
      }
      let target: FieldDef | null = null;
      for (const f of d.fields) {
        if (f.value === tag) {
          target = f;
          break;
        }
      }
      if (!target) {
        throw new Error(
          `unknown message field id ${tag} in '${d.name}' (offset ${reader.pos})`
        );
      }
      result[target.name] = decodeValue(
        reader,
        target.typeCode,
        target.isArray,
        defs
      );
    }
  }
  throw new Error(`unknown kind ${d.kind}`);
}

export function encodeDefinition(
  writer: ByteWriter,
  value: KiwiValue,
  defIdx: number,
  defs: Definition[]
): void {
  const d = defAt(defs, defIdx);
  if (d.kind === KIND_ENUM) {
    if (typeof value === "string") {
      for (const f of d.fields) {
        if (f.name === value) {
          writer.writeVarint(f.value);
          return;
        }
      }
      throw new Error(`unknown enum value: ${value} for ${d.name}`);
    }
    if (typeof value === "number") {
      writer.writeVarint(value);
      return;
    }
    throw new Error(`cannot encode ${String(value)} as enum ${d.name}`);
  }
  if (d.kind === KIND_STRUCT) {
    const obj = objectValue(value);
    for (const f of d.fields) {
      encodeValue(writer, obj[f.name], f.typeCode, f.isArray, defs);
    }
    return;
  }
  if (d.kind === KIND_MESSAGE) {
    const obj = objectValue(value);
    for (const f of d.fields) {
      const v = obj[f.name];
      if (v !== undefined && v !== null) {
        writer.writeVarint(f.value);
        encodeValue(writer, v, f.typeCode, f.isArray, defs);
      }
    }
    writer.writeVarint(0);
    return;
  }
  throw new Error(`unknown kind ${d.kind}`);
}

export function findDefinition(defs: Definition[], name: string): number {
  for (let i = 0; i < defs.length; i += 1) {
    const d = defs[i];
    if (d && d.name === name) {
      return i;
    }
  }
  throw new Error(`definition not found: ${name}`);
}
