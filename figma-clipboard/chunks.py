#!/usr/bin/env python3
"""Parse the buffer assuming chunked layout:
  magic 'fig-kiwij' (9 bytes)
  3 bytes padding to align to 12
  repeating: <u32 LE length><N bytes payload>

Try several header sizes to see which one yields valid chunks that fit the file.
"""

from __future__ import annotations

import struct
import sys
from pathlib import Path


def try_layout(buf: bytes, header_size: int, label: str) -> bool:
    print(f"\n--- layout: {label} (header={header_size}) ---")
    pos = header_size
    chunk_no = 0
    while pos < len(buf):
        if pos + 4 > len(buf):
            print(f"  pos {pos}: not enough bytes for length prefix")
            return False
        (length,) = struct.unpack_from("<I", buf, pos)
        chunk_start = pos + 4
        chunk_end = chunk_start + length
        if chunk_end > len(buf):
            print(
                f"  chunk {chunk_no}: pos={pos} length={length} would overrun (buf len {len(buf)})"
            )
            return False
        payload = buf[chunk_start:chunk_end]
        print(
            f"  chunk {chunk_no}: pos={pos} length={length} first8={payload[:8].hex(' ')}"
        )
        pos = chunk_end
        chunk_no += 1
        if chunk_no > 8:
            print("  stopping after 8 chunks")
            break
    if pos == len(buf):
        print(f"  OK — consumed exactly {len(buf)} bytes in {chunk_no} chunks")
        return True
    print(f"  INCOMPLETE — pos={pos}, file ends at {len(buf)}")
    return False


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "competitor.buffer.bin")
    buf = path.read_bytes()
    print(f"buffer: {len(buf)} bytes")

    for header in (9, 12, 13, 16, 17):
        try_layout(buf, header, f"after {header} bytes")


if __name__ == "__main__":
    main()
