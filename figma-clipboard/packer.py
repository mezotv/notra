#!/usr/bin/env python3
"""Pack / unpack Figma clipboard HTML.

Buffer layout (after base64 decode of the data-buffer span):
  9 bytes   magic "fig-kiwij"
  3 bytes   padding 0x00 0x00 0x00
  4 bytes   u32 LE   length of schema chunk
  N bytes   raw DEFLATE schema chunk (uncompressed: Kiwi schema)
  4 bytes   u32 LE   length of data chunk
  M bytes   raw DEFLATE data chunk (uncompressed: Kiwi-encoded Message)

Metadata layout (base64-decoded data-metadata span):
  JSON: {"fileKey": "...", "pasteID": <int>, "dataType": "scene"}

The wrapper HTML is straightforward and mirrors what Figma's own copy emits.
"""

from __future__ import annotations

import base64
import json
import re
import struct
import zlib
from pathlib import Path


MAGIC = b"fig-kiwij"
PADDING = b"\x00\x00\x00"

META_RE = re.compile(
    rb'data-metadata="&lt;!--\(figmeta\)([A-Za-z0-9+/=]+)\(/figmeta\)--&gt;"'
)
BUFFER_RE = re.compile(
    rb'data-buffer="&lt;!--\(figma\)([A-Za-z0-9+/=]+)\(/figma\)--&gt;"'
)


def unpack_html(path: Path) -> tuple[dict, bytes, bytes]:
    raw = path.read_bytes()
    meta_match = META_RE.search(raw)
    buf_match = BUFFER_RE.search(raw)
    if not meta_match or not buf_match:
        raise SystemExit(f"Could not find figma metadata/buffer in {path}")

    metadata = json.loads(base64.b64decode(meta_match.group(1)))
    buf = base64.b64decode(buf_match.group(1))
    schema_bytes, data_bytes = unpack_buffer(buf)
    return metadata, schema_bytes, data_bytes


def unpack_buffer(buf: bytes) -> tuple[bytes, bytes]:
    if not buf.startswith(MAGIC):
        raise ValueError("not a fig-kiwij buffer")
    if buf[len(MAGIC) : len(MAGIC) + len(PADDING)] != PADDING:
        raise ValueError(f"unexpected padding: {buf[9:12].hex()}")

    pos = len(MAGIC) + len(PADDING)
    chunks: list[bytes] = []
    while pos < len(buf):
        (length,) = struct.unpack_from("<I", buf, pos)
        pos += 4
        compressed = buf[pos : pos + length]
        if len(compressed) != length:
            raise ValueError(f"chunk underrun at pos {pos}: need {length}, got {len(compressed)}")
        chunks.append(zlib.decompress(compressed, -15))
        pos += length
    if pos != len(buf):
        raise ValueError(f"trailing bytes: pos={pos} len={len(buf)}")
    if len(chunks) != 2:
        raise ValueError(f"expected 2 chunks, got {len(chunks)}")
    return chunks[0], chunks[1]


def pack_buffer(schema_bytes: bytes, data_bytes: bytes) -> bytes:
    out = bytearray(MAGIC + PADDING)
    for chunk in (schema_bytes, data_bytes):
        compressed = _deflate(chunk)
        out.extend(struct.pack("<I", len(compressed)))
        out.extend(compressed)
    return bytes(out)


def _deflate(data: bytes) -> bytes:
    """Raw DEFLATE (no zlib header) matching Figma's encoder."""
    compressor = zlib.compressobj(level=9, wbits=-15)
    return compressor.compress(data) + compressor.flush()


def pack_html(metadata: dict, buffer: bytes, label: str = "Paste from divriots") -> str:
    meta_b64 = base64.b64encode(json.dumps(metadata, separators=(",", ":")).encode()).decode()
    buf_b64 = base64.b64encode(buffer).decode()

    return (
        "<meta charset='utf-8'>"
        "<html><head><meta charset=\"utf-8\"></head><body>"
        f"<span data-metadata=\"&lt;!--(figmeta){meta_b64}(/figmeta)--&gt;\"></span>"
        f"<span data-buffer=\"&lt;!--(figma){buf_b64}(/figma)--&gt;\"></span>"
        f"<span style=\"white-space:pre-wrap;\">{label}</span>"
        "</body></html>"
    )


def main() -> None:
    """Self-test: unpack competitor.html, repack, verify it parses back to same scene."""
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "selftest":
        meta, schema, data = unpack_html(Path("../competitor.html"))
        print(f"meta: {meta}")
        print(f"schema: {len(schema)} bytes")
        print(f"data:   {len(data)} bytes")

        buf = pack_buffer(schema, data)
        # Re-unpack
        schema2, data2 = unpack_buffer(buf)
        print(f"repack ok? schema_match={schema == schema2} data_match={data == data2}")

        html = pack_html(meta, buf)
        out_path = Path("competitor.repacked.html")
        out_path.write_text(html)
        print(f"wrote {out_path}: {len(html)} bytes")
        return

    raise SystemExit("usage: packer.py selftest")


if __name__ == "__main__":
    main()
