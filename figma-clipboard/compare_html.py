#!/usr/bin/env python3
"""Compare working.html vs broken.html — decode both buffers and dump scenes."""
import base64
import json
import re
import struct
import sys
import zlib
from pathlib import Path

import kiwi

META_RE = re.compile(r'data-metadata="&lt;!--\(figmeta\)([A-Za-z0-9+/=]+)\(/figmeta\)--&gt;"')
BUFFER_RE = re.compile(r'data-buffer="&lt;!--\(figma\)([A-Za-z0-9+/=]+)\(/figma\)--&gt;"')


def unpack_buffer(buf: bytes) -> tuple[bytes, bytes]:
    MAGIC = b"fig-kiwij"
    assert buf.startswith(MAGIC), buf[:16]
    assert buf[len(MAGIC):len(MAGIC)+3] == b"\x00\x00\x00", buf[len(MAGIC):len(MAGIC)+3]
    pos = len(MAGIC) + 3
    chunks = []
    while pos < len(buf):
        n = struct.unpack_from("<I", buf, pos)[0]
        pos += 4
        chunks.append(zlib.decompress(buf[pos:pos+n], wbits=-15))
        pos += n
    return chunks[0], chunks[1]


def decode_html(path: Path) -> dict:
    html = path.read_text()
    meta_b64 = META_RE.search(html).group(1)
    buf_b64 = BUFFER_RE.search(html).group(1)
    meta = json.loads(base64.b64decode(meta_b64))
    buf = base64.b64decode(buf_b64)
    schema, data = unpack_buffer(buf)
    defs = kiwi.parse_schema(schema)
    msg_idx = next(i for i, d in enumerate(defs) if d.name == "Message")
    scene = kiwi.decode_definition(kiwi.ByteReader(data), msg_idx, defs)
    return {"metadata": meta, "scene": scene, "schema_len": len(schema), "data_len": len(data)}


def main() -> None:
    base = Path(__file__).parent.parent
    working = decode_html(base / "working.html")
    broken = decode_html(base / "broken.html")

    print("=== METADATA ===")
    print(f"working: {working['metadata']}")
    print(f"broken:  {broken['metadata']}")

    print("\n=== SIZES ===")
    print(f"working: schema={working['schema_len']}, data={working['data_len']}")
    print(f"broken:  schema={broken['schema_len']}, data={broken['data_len']}")

    # Save full scenes for diffing
    (base / "working.scene.json").write_text(json.dumps(working["scene"], indent=2, default=str))
    (base / "broken.scene.json").write_text(json.dumps(broken["scene"], indent=2, default=str))
    print("\nFull scenes written: working.scene.json, broken.scene.json")

    # Top-level keys diff
    print("\n=== TOP-LEVEL KEYS ===")
    wkeys = set(working["scene"].keys())
    bkeys = set(broken["scene"].keys())
    print(f"only in working: {wkeys - bkeys}")
    print(f"only in broken:  {bkeys - wkeys}")
    print(f"common:          {wkeys & bkeys}")

    # nodeChanges count
    if "nodeChanges" in working["scene"] and "nodeChanges" in broken["scene"]:
        print(f"\nworking nodeChanges: {len(working['scene']['nodeChanges'])}")
        print(f"broken  nodeChanges: {len(broken['scene']['nodeChanges'])}")


if __name__ == "__main__":
    main()
