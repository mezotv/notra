#!/usr/bin/env python3
"""Extract figma clipboard metadata and buffer from a Figma-paste HTML file.

Figma's "Copy as HTML" produces:
  <span data-metadata="<!--(figmeta)BASE64_JSON(/figmeta)-->"></span>
  <span data-buffer="<!--(figma)BASE64_BINARY(/figma)-->"></span>

The base64 binary, once decoded, starts with the magic "fig-kiwij" followed by
the Kiwi-encoded schema and scene payload.
"""

from __future__ import annotations

import base64
import json
import re
import sys
from pathlib import Path


META_RE = re.compile(
    rb'data-metadata="&lt;!--\(figmeta\)([A-Za-z0-9+/=]+)\(/figmeta\)--&gt;"'
)
BUFFER_RE = re.compile(
    rb'data-buffer="&lt;!--\(figma\)([A-Za-z0-9+/=]+)\(/figma\)--&gt;"'
)


def extract(path: Path) -> tuple[dict, bytes]:
    raw = path.read_bytes()

    meta_match = META_RE.search(raw)
    buf_match = BUFFER_RE.search(raw)
    if not meta_match or not buf_match:
        raise SystemExit(f"Could not find figma metadata/buffer in {path}")

    meta_json = json.loads(base64.b64decode(meta_match.group(1)))
    buf_bytes = base64.b64decode(buf_match.group(1))
    return meta_json, buf_bytes


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: extract.py <input.html> [output-dir]")

    src = Path(sys.argv[1])
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else src.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    meta, buf = extract(src)

    meta_path = out_dir / f"{src.stem}.meta.json"
    buf_path = out_dir / f"{src.stem}.buffer.bin"

    meta_path.write_text(json.dumps(meta, indent=2))
    buf_path.write_bytes(buf)

    print(f"metadata -> {meta_path}: {meta}")
    print(f"buffer   -> {buf_path}: {len(buf)} bytes")
    print(f"first 32 bytes (hex): {buf[:32].hex()}")
    print(f"first 16 bytes (ascii): {buf[:16]!r}")


if __name__ == "__main__":
    main()
