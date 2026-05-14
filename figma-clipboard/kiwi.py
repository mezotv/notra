"""Minimal Kiwi schema + data decoder.

Format reference: https://github.com/evanw/kiwi/blob/master/binary.md

Wire format primer:
  * varint (unsigned): LEB128 little-endian, 7 bits per byte, MSB = continuation
  * int (signed):      zigzag varint
  * string:            null-terminated UTF-8

Schema layout:
  varint definition_count
  for each definition:
    string name
    uint8  kind     (0 = enum, 1 = struct, 2 = message)
    varint field_count
    for each field:
      string name
      int    type   (negative = builtin code, 0-based index into definitions otherwise)
      uint8  is_array
      varint value  (enum constant, struct = 0, message = field id)

Builtin type codes:
  -1 bool   -2 byte   -3 int    -4 uint
  -5 float  -6 string -7 int64  -8 uint64

Data layout (recursive per definition):
  - enum:    varint  → field_index lookup → field.value (a constant)
  - struct:  fields in declaration order, no terminator
  - message: pairs of (varint field_id, value) terminated by field_id = 0
  - array:   varint count, then count values
"""

from __future__ import annotations

import struct
from dataclasses import dataclass, field
from io import BytesIO
from typing import Any


BUILTINS = {
    -1: "bool",
    -2: "byte",
    -3: "int",
    -4: "uint",
    -5: "float",
    -6: "string",
    -7: "int64",
    -8: "uint64",
}

KIND_ENUM = 0
KIND_STRUCT = 1
KIND_MESSAGE = 2
KIND_NAMES = {0: "enum", 1: "struct", 2: "message"}


@dataclass
class FieldDef:
    name: str
    type_code: int
    is_array: bool
    value: int


@dataclass
class Definition:
    name: str
    kind: int
    fields: list[FieldDef] = field(default_factory=list)


class ByteReader:
    __slots__ = ("buf", "pos")

    def __init__(self, buf: bytes, pos: int = 0) -> None:
        self.buf = buf
        self.pos = pos

    def remaining(self) -> int:
        return len(self.buf) - self.pos

    def read_byte(self) -> int:
        b = self.buf[self.pos]
        self.pos += 1
        return b

    def read_bytes(self, n: int) -> bytes:
        out = self.buf[self.pos : self.pos + n]
        self.pos += n
        return out

    def read_varint(self) -> int:
        result = 0
        shift = 0
        while True:
            b = self.buf[self.pos]
            self.pos += 1
            result |= (b & 0x7F) << shift
            if (b & 0x80) == 0:
                return result
            shift += 7
            if shift > 63:
                raise ValueError("varint too long")

    def read_signed_varint(self) -> int:
        v = self.read_varint()
        return (v >> 1) ^ -(v & 1)

    def read_bool(self) -> bool:
        return self.read_byte() != 0

    def read_int(self) -> int:
        return self.read_signed_varint()

    def read_uint(self) -> int:
        return self.read_varint()

    def read_int64(self) -> int:
        return self.read_signed_varint()

    def read_uint64(self) -> int:
        return self.read_varint()

    def read_float(self) -> float:
        first = self.read_byte()
        if first == 0:
            return 0.0
        rest = self.read_bytes(3)
        bits = first | (rest[0] << 8) | (rest[1] << 16) | (rest[2] << 24)
        bits = ((bits & 0xFFFFFFFF) << 23) | ((bits & 0xFFFFFFFF) >> 9)
        bits &= 0xFFFFFFFF
        return struct.unpack("<f", struct.pack("<I", bits))[0]

    def read_string(self) -> str:
        start = self.pos
        end = self.buf.index(0, start)
        s = self.buf[start:end].decode("utf-8")
        self.pos = end + 1
        return s


class ByteWriter:
    __slots__ = ("out",)

    def __init__(self) -> None:
        self.out = bytearray()

    def write_byte(self, b: int) -> None:
        self.out.append(b & 0xFF)

    def write_bytes(self, b: bytes) -> None:
        self.out.extend(b)

    def write_varint(self, v: int) -> None:
        if v < 0:
            raise ValueError("varint must be non-negative")
        while True:
            b = v & 0x7F
            v >>= 7
            if v:
                self.out.append(b | 0x80)
            else:
                self.out.append(b)
                return

    def write_signed_varint(self, v: int) -> None:
        zig = ((-v) << 1) - 1 if v < 0 else v << 1
        self.write_varint(zig)

    def write_bool(self, v: bool) -> None:
        self.write_byte(1 if v else 0)

    def write_int(self, v: int) -> None:
        self.write_signed_varint(v)

    def write_uint(self, v: int) -> None:
        self.write_varint(v)

    def write_int64(self, v: int) -> None:
        self.write_signed_varint(v)

    def write_uint64(self, v: int) -> None:
        self.write_varint(v)

    def write_float(self, v: float) -> None:
        if v == 0:
            self.write_byte(0)
            return
        bits = struct.unpack("<I", struct.pack("<f", v))[0]
        rotated = ((bits << 9) | (bits >> 23)) & 0xFFFFFFFF
        # 4 bytes LE
        self.out.append(rotated & 0xFF)
        self.out.append((rotated >> 8) & 0xFF)
        self.out.append((rotated >> 16) & 0xFF)
        self.out.append((rotated >> 24) & 0xFF)

    def write_string(self, s: str) -> None:
        self.out.extend(s.encode("utf-8"))
        self.out.append(0)

    def get(self) -> bytes:
        return bytes(self.out)


# ---------- Schema ----------


def parse_schema(buf: bytes) -> list[Definition]:
    r = ByteReader(buf)
    count = r.read_varint()
    defs: list[Definition] = []
    for _ in range(count):
        name = r.read_string()
        kind = r.read_byte()
        field_count = r.read_varint()
        fields: list[FieldDef] = []
        for _ in range(field_count):
            fname = r.read_string()
            ftype = r.read_signed_varint()
            farr = r.read_byte()
            fval = r.read_varint()
            fields.append(FieldDef(fname, ftype, farr == 1, fval))
        defs.append(Definition(name, kind, fields))
    return defs


def schema_to_dict(defs: list[Definition]) -> dict[str, Any]:
    out = {"count": len(defs), "definitions": []}
    for d in defs:
        entry = {"name": d.name, "kind": KIND_NAMES[d.kind], "fields": []}
        for f in d.fields:
            ref = None
            if f.type_code < 0:
                ref = BUILTINS.get(f.type_code, f"<builtin {f.type_code}>")
            else:
                idx = f.type_code
                if d.kind == KIND_ENUM:
                    ref = None
                elif 0 <= idx < len(defs):
                    ref = defs[idx].name
                else:
                    ref = f"<def {f.type_code}>"
            entry["fields"].append(
                {
                    "name": f.name,
                    "type": ref,
                    "array": f.is_array,
                    "value": f.value,
                }
            )
        out["definitions"].append(entry)
    return out


# ---------- Data ----------


def decode_value(
    reader: ByteReader, type_code: int, is_array: bool, defs: list[Definition]
) -> Any:
    if is_array:
        n = reader.read_varint()
        return [decode_value(reader, type_code, False, defs) for _ in range(n)]
    if type_code < 0:
        return _decode_builtin(reader, type_code)
    return decode_definition(reader, type_code, defs)


def _decode_builtin(reader: ByteReader, code: int) -> Any:
    if code == -1:
        return reader.read_bool()
    if code == -2:
        return reader.read_byte()
    if code == -3:
        return reader.read_int()
    if code == -4:
        return reader.read_uint()
    if code == -5:
        return reader.read_float()
    if code == -6:
        return reader.read_string()
    if code == -7:
        return reader.read_int64()
    if code == -8:
        return reader.read_uint64()
    raise ValueError(f"unknown builtin {code}")


def encode_value(
    writer: ByteWriter,
    value: Any,
    type_code: int,
    is_array: bool,
    defs: list[Definition],
) -> None:
    if is_array:
        writer.write_varint(len(value))
        for item in value:
            encode_value(writer, item, type_code, False, defs)
        return
    if type_code < 0:
        _encode_builtin(writer, value, type_code)
        return
    encode_definition(writer, value, type_code, defs)


def _encode_builtin(writer: ByteWriter, value: Any, code: int) -> None:
    if code == -1:
        writer.write_bool(bool(value))
    elif code == -2:
        writer.write_byte(int(value))
    elif code == -3:
        writer.write_int(int(value))
    elif code == -4:
        writer.write_uint(int(value))
    elif code == -5:
        writer.write_float(float(value))
    elif code == -6:
        writer.write_string(str(value))
    elif code == -7:
        writer.write_int64(int(value))
    elif code == -8:
        writer.write_uint64(int(value))
    else:
        raise ValueError(f"unknown builtin {code}")


def encode_definition(
    writer: ByteWriter, value: Any, def_idx: int, defs: list[Definition]
) -> None:
    d = defs[def_idx]
    if d.kind == KIND_ENUM:
        if isinstance(value, str):
            for f in d.fields:
                if f.name == value:
                    writer.write_varint(f.value)
                    return
            raise ValueError(f"unknown enum value: {value} for {d.name}")
        if isinstance(value, int):
            writer.write_varint(value)
            return
        raise ValueError(f"cannot encode {value!r} as enum {d.name}")
    if d.kind == KIND_STRUCT:
        for f in d.fields:
            encode_value(writer, value[f.name], f.type_code, f.is_array, defs)
        return
    if d.kind == KIND_MESSAGE:
        for f in d.fields:
            if f.name in value and value[f.name] is not None:
                writer.write_varint(f.value)
                encode_value(writer, value[f.name], f.type_code, f.is_array, defs)
        writer.write_varint(0)
        return
    raise ValueError(f"unknown kind {d.kind}")


def decode_definition(
    reader: ByteReader, def_idx: int, defs: list[Definition]
) -> Any:
    d = defs[def_idx]
    if d.kind == KIND_ENUM:
        value = reader.read_varint()
        for f in d.fields:
            if f.value == value:
                return f.name
        return value  # unknown enum value
    if d.kind == KIND_STRUCT:
        result: dict[str, Any] = {}
        for f in d.fields:
            result[f.name] = decode_value(reader, f.type_code, f.is_array, defs)
        return result
    if d.kind == KIND_MESSAGE:
        result = {}
        while True:
            tag = reader.read_varint()
            if tag == 0:
                return result
            target = None
            for f in d.fields:
                if f.value == tag:
                    target = f
                    break
            if target is None:
                raise ValueError(
                    f"unknown message field id {tag} in '{d.name}' (offset {reader.pos})"
                )
            result[target.name] = decode_value(
                reader, target.type_code, target.is_array, defs
            )
    raise ValueError(f"unknown kind {d.kind}")
