#!/usr/bin/env python3
"""Build a hand-crafted Figma scene and emit a clipboard HTML file.

Run:  python3 build_test.py
Open the output HTML in any text editor, copy its contents, paste into Figma.

This test produces a small frame with a heading and a paragraph, using only
the default field values from `scene_builder.SceneBuilder`. If Figma accepts
the paste, the format pipeline is wired end to end.
"""

from __future__ import annotations

from pathlib import Path

import kiwi
import packer
import scene_builder


def main() -> None:
    schema_bytes = (Path(__file__).parent / "figma-schema.bin").read_bytes()
    defs = kiwi.parse_schema(schema_bytes)
    msg_idx = next(i for i, d in enumerate(defs) if d.name == "Message")

    sb = scene_builder.SceneBuilder()

    body = sb.add_frame(
        name="Card",
        x=0,
        y=0,
        width=480,
        height=240,
        fill=scene_builder.solid_fill(1.0, 1.0, 1.0, 1.0),
        stack_mode="VERTICAL",
        stack_spacing=12.0,
        padding=(24.0, 24.0, 24.0, 24.0),
    )
    sb.add_text(
        parent=body,
        text="Hello from the encoder",
        font_family="Inter",
        font_style="Semi Bold",
        font_size=24.0,
        line_height=32.0,
        width=432.0,
        height=32.0,
        color=(0.1, 0.1, 0.1, 1.0),
    )
    sb.add_text(
        parent=body,
        text="If you can see this in Figma, the Kiwi pipeline works.",
        font_family="Inter",
        font_style="Regular",
        font_size=15.0,
        line_height=22.0,
        width=432.0,
        height=44.0,
        color=(0.35, 0.35, 0.4, 1.0),
    )

    message = sb.to_message()

    writer = kiwi.ByteWriter()
    kiwi.encode_definition(writer, message, msg_idx, defs)
    data_bytes = writer.get()
    print(f"encoded data: {len(data_bytes)} bytes")

    # Sanity round-trip
    reader = kiwi.ByteReader(data_bytes)
    decoded = kiwi.decode_definition(reader, msg_idx, defs)
    assert reader.remaining() == 0, f"leftover: {reader.remaining()}"
    print(f"round-trip ok, {len(decoded['nodeChanges'])} nodes")

    buf = packer.pack_buffer(schema_bytes, data_bytes)
    html = packer.pack_html(
        {"fileKey": "scene-from-html", "pasteID": sb.paste_id, "dataType": "scene"},
        buf,
    )
    out = Path("test-card.html")
    out.write_text(html)
    print(f"wrote {out}: {len(html)} bytes")
    print(f"\nopen the file, copy its contents (Cmd+A, Cmd+C), paste into Figma.")


if __name__ == "__main__":
    main()
