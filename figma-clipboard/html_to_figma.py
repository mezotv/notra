#!/usr/bin/env python3
"""Convert an HTML layout tree (from extract-layout.js) to a Figma clipboard HTML.

Pipeline:
  HTML file --(playwright)--> layout JSON --(this script)--> scene message --(kiwi)-->
  --> raw DEFLATE --> chunked buffer --> base64 --> clipboard HTML
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import kiwi
import packer
import scene_builder


RGB_RE = re.compile(r"rgba?\(([^)]+)\)")
WEIGHT_TO_STYLE = {
    "100": "Thin",
    "200": "Extra Light",
    "300": "Light",
    "400": "Regular",
    "normal": "Regular",
    "500": "Medium",
    "600": "Semi Bold",
    "700": "Bold",
    "bold": "Bold",
    "800": "Extra Bold",
    "900": "Black",
}


def parse_color(s: str) -> tuple[float, float, float, float] | None:
    if not s:
        return None
    m = RGB_RE.match(s)
    if not m:
        return None
    parts = [p.strip() for p in m.group(1).split(",")]
    if len(parts) < 3:
        return None
    r, g, b = (float(parts[0]) / 255, float(parts[1]) / 255, float(parts[2]) / 255)
    a = float(parts[3]) if len(parts) > 3 else 1.0
    return (r, g, b, a)


def parse_first_font(font_family: str) -> str:
    first = font_family.split(",")[0].strip()
    return first.strip('"').strip("'")


def parse_px(s: str) -> float:
    if not s or s == "normal":
        return 0.0
    s = s.strip()
    if s.endswith("px"):
        try:
            return float(s[:-2])
        except ValueError:
            return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def build_scene(layout: dict) -> scene_builder.SceneBuilder:
    sb = scene_builder.SceneBuilder()
    # The body's bounding box defines the "frame" of the paste. Use its child
    # (typically the design root) instead of the entire 1600px viewport.
    root = layout
    children = [c for c in root.get("children", []) if c["kind"] != "text"]
    if len(children) == 1:
        root = children[0]

    _emit_element(sb, root, parent=sb.canvas_guid, parent_x=root["x"], parent_y=root["y"])
    return sb


def _emit_element(
    sb: scene_builder.SceneBuilder,
    node: dict,
    *,
    parent: dict[str, int],
    parent_x: float,
    parent_y: float,
) -> None:
    if node["kind"] == "text":
        return  # handled by the parent

    rel_x = node["x"] - parent_x
    rel_y = node["y"] - parent_y
    bg = parse_color(node.get("background", ""))
    fill = scene_builder.solid_fill(*bg) if bg and bg[3] > 0 else None

    name = node.get("tag", "div")
    frame_guid = sb.add_frame(
        parent=parent,
        name=name,
        x=rel_x,
        y=rel_y,
        width=node["width"],
        height=node["height"],
        fill=fill,
    )

    for child in node.get("children", []):
        if child["kind"] == "text":
            color = parse_color(child.get("color", "")) or (0.0, 0.0, 0.0, 1.0)
            font_family = parse_first_font(child.get("fontFamily", "Inter"))
            weight_style = WEIGHT_TO_STYLE.get(str(child.get("fontWeight", "")), "Regular")
            line_height = parse_px(child.get("lineHeight", ""))
            letter_spacing = parse_px(child.get("letterSpacing", ""))
            text_align_map = {
                "left": "LEFT",
                "right": "RIGHT",
                "center": "CENTER",
                "justify": "JUSTIFIED",
                "start": "LEFT",
                "end": "RIGHT",
            }
            align = text_align_map.get(child.get("textAlign", "left"), "LEFT")

            sb.add_text(
                parent=frame_guid,
                text=child["text"],
                x=child["x"] - node["x"],
                y=child["y"] - node["y"],
                width=child["width"],
                height=child["height"],
                font_family=font_family,
                font_style=weight_style,
                font_size=child.get("fontSize", 16.0),
                line_height=line_height,
                letter_spacing=letter_spacing,
                color=color,
                align_horizontal=align,
                auto_resize="WIDTH_AND_HEIGHT",
            )
        elif child["kind"] == "svg":
            # Placeholder: emit a frame the size of the svg with a hint colour.
            sb.add_frame(
                parent=frame_guid,
                name=f"svg ({child['width']:.0f}x{child['height']:.0f})",
                x=child["x"] - node["x"],
                y=child["y"] - node["y"],
                width=child["width"],
                height=child["height"],
                fill=scene_builder.solid_fill(0.9, 0.9, 0.95, 1.0),
            )
        else:
            _emit_element(sb, child, parent=frame_guid, parent_x=node["x"], parent_y=node["y"])


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: html_to_figma.py <layout.json> <out.html>")

    layout_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2])

    layout = json.loads(layout_path.read_text())
    sb = build_scene(layout)
    message = sb.to_message()

    schema_bytes = (Path(__file__).parent / "figma-schema.bin").read_bytes()
    defs = kiwi.parse_schema(schema_bytes)
    msg_idx = next(i for i, d in enumerate(defs) if d.name == "Message")

    writer = kiwi.ByteWriter()
    kiwi.encode_definition(writer, message, msg_idx, defs)
    data_bytes = writer.get()

    # Sanity round-trip
    reader = kiwi.ByteReader(data_bytes)
    decoded = kiwi.decode_definition(reader, msg_idx, defs)
    assert reader.remaining() == 0
    print(f"scene: {len(decoded['nodeChanges'])} nodes, {len(data_bytes)} bytes encoded")

    buf = packer.pack_buffer(schema_bytes, data_bytes)
    html = packer.pack_html(
        {"fileKey": "html-to-figma", "pasteID": sb.paste_id, "dataType": "scene"},
        buf,
    )
    out_path.write_text(html)
    print(f"wrote {out_path}: {len(html)} bytes")


if __name__ == "__main__":
    main()
