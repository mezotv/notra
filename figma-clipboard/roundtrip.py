#!/usr/bin/env python3
"""Round-trip test: decode competitor data, re-encode, compare bytes.

Field order inside a Kiwi message is irrelevant on the wire (each field carries
its tag), so a byte-for-byte match isn't guaranteed -- but a successful re-decode
of our own output is the real correctness check.
"""

from __future__ import annotations

import json

import kiwi


def main() -> None:
    schema_bytes = open("competitor.chunk0.raw.bin", "rb").read()
    data_bytes = open("competitor.chunk1.raw.bin", "rb").read()
    defs = kiwi.parse_schema(schema_bytes)
    msg_idx = next(i for i, d in enumerate(defs) if d.name == "Message")

    # Decode original
    reader = kiwi.ByteReader(data_bytes)
    scene = kiwi.decode_definition(reader, msg_idx, defs)
    assert reader.remaining() == 0, f"leftover bytes: {reader.remaining()}"

    # Re-encode
    writer = kiwi.ByteWriter()
    kiwi.encode_definition(writer, scene, msg_idx, defs)
    re_bytes = writer.get()

    print(f"original: {len(data_bytes)} bytes")
    print(f"re-encoded: {len(re_bytes)} bytes")
    print(f"identical? {data_bytes == re_bytes}")

    # Decode our re-encoded bytes to make sure it round-trips
    re_reader = kiwi.ByteReader(re_bytes)
    re_scene = kiwi.decode_definition(re_reader, msg_idx, defs)
    assert re_reader.remaining() == 0
    print(f"re-decoded leftover: {re_reader.remaining()} bytes")
    print(f"scene == re_scene? {scene == re_scene}")

    if data_bytes != re_bytes:
        # Find first diff
        n = min(len(data_bytes), len(re_bytes))
        for i in range(n):
            if data_bytes[i] != re_bytes[i]:
                start = max(0, i - 16)
                end = min(n, i + 16)
                print(f"first byte diff at {i}:")
                print(f"  orig: {data_bytes[start:end].hex()}")
                print(f"  new:  {re_bytes[start:end].hex()}")
                break


if __name__ == "__main__":
    main()
