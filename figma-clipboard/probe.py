#!/usr/bin/env python3
"""Probe the Figma clipboard buffer to find structure.

Looks for known compression magics, attempts decompression at plausible offsets,
and prints a high-level map.
"""

from __future__ import annotations

import struct
import sys
import zlib
from pathlib import Path

try:
    import zstandard as zstd  # type: ignore
except ImportError:
    zstd = None


ZSTD_MAGIC = b"\x28\xb5\x2f\xfd"
GZIP_MAGIC = b"\x1f\x8b"
ZLIB_LIKELY = (b"\x78\x01", b"\x78\x9c", b"\x78\xda", b"\x78\x5e")


def scan_magics(buf: bytes) -> None:
    print("--- magic scan ---")
    for offset in range(0, min(len(buf), 4096)):
        head4 = buf[offset : offset + 4]
        if head4 == ZSTD_MAGIC:
            print(f"  zstd magic at offset {offset}")
        if head4[:2] == GZIP_MAGIC:
            print(f"  gzip magic at offset {offset}")
        if head4[:2] in ZLIB_LIKELY:
            print(f"  possible zlib header at offset {offset} ({head4[:2].hex()})")


def try_zstd(buf: bytes, offset: int) -> None:
    if zstd is None:
        print("  zstd module not available")
        return
    dctx = zstd.ZstdDecompressor()
    try:
        decompressed = dctx.decompress(buf[offset:], max_output_size=64 * 1024 * 1024)
        print(f"  zstd OK at offset {offset}: {len(decompressed)} bytes -> first 64: {decompressed[:64]!r}")
    except Exception as exc:  # noqa: BLE001
        print(f"  zstd FAIL at offset {offset}: {exc}")


def try_zstd_framed(buf: bytes, offset: int) -> None:
    """Try a stream reader so it can stop at the end of a single frame."""
    if zstd is None:
        return
    dctx = zstd.ZstdDecompressor()
    try:
        with dctx.stream_reader(buf[offset:]) as reader:
            decompressed = reader.read()
        print(
            f"  zstd-stream OK at offset {offset}: {len(decompressed)} bytes -> first 64: {decompressed[:64]!r}"
        )
    except Exception as exc:  # noqa: BLE001
        print(f"  zstd-stream FAIL at offset {offset}: {exc}")


def try_zlib(buf: bytes, offset: int) -> None:
    try:
        decompressed = zlib.decompress(buf[offset:])
        print(f"  zlib OK at offset {offset}: {len(decompressed)} bytes")
    except Exception as exc:  # noqa: BLE001
        print(f"  zlib FAIL at offset {offset}: {exc}")


def hex_dump(label: str, b: bytes, n: int = 64) -> None:
    print(f"{label}: ({n} of {len(b)}) {b[:n].hex(' ')}")


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "competitor.buffer.bin")
    buf = path.read_bytes()
    print(f"buffer: {path} -- {len(buf)} bytes")
    hex_dump("first  64", buf, 64)
    hex_dump("bytes 64-128", buf[64:128], 64)

    if not buf.startswith(b"fig-kiwij"):
        raise SystemExit("not a fig-kiwij buffer")

    print()
    print("--- after magic (offset 9) ---")
    after = buf[9:]
    hex_dump("after-magic head", after, 32)

    print()
    print("--- interpret 4 bytes at offset 9 ---")
    for name, fmt in (("u32 LE", "<I"), ("u32 BE", ">I"), ("i32 LE", "<i")):
        val = struct.unpack(fmt, buf[9:13])[0]
        print(f"  {name}: {val} (0x{val:x})")

    print()
    print("--- interpret 4 bytes at offset 13 ---")
    for name, fmt in (("u32 LE", "<I"), ("u32 BE", ">I")):
        val = struct.unpack(fmt, buf[13:17])[0]
        print(f"  {name}: {val} (0x{val:x})")

    scan_magics(buf)

    print()
    print("--- compression probes ---")
    for offset in (9, 13, 17, 21, 25):
        print(f"offset {offset}:")
        try_zstd(buf, offset)
        try_zstd_framed(buf, offset)
        try_zlib(buf, offset)


if __name__ == "__main__":
    main()
