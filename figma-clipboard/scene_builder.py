"""Scene builder for Figma clipboard scenes.

A Figma clipboard scene is a `Message` containing:
  - type: NODE_CHANGES
  - sessionID, ackID, pasteID, pasteFileKey, blobs[]
  - nodeChanges: flat list of NodeChange messages, parent-linked by guid

Tree shape required:
  DOCUMENT (sessionID=0, localID=0)
    CANVAS (sessionID=N, localID=0)
      FRAME / TEXT / VECTOR ... (sessionID=N, localID=1..)
    INTERNAL_ONLY_CANVAS (sessionID=0, localID=0)  -- legacy slot

Sibling order is set by `parentIndex.position`, a fractional-index string
(printable ASCII; '!' is the lowest position used by Figma's own copy).

The defaults below mirror what Figma's HTML-to-design tool emits. Override
specific fields by passing kwargs to the helpers.
"""

from __future__ import annotations

import copy
import random
from dataclasses import dataclass, field
from typing import Any


IDENTITY_TRANSFORM = {"m00": 1.0, "m01": 0.0, "m02": 0.0, "m10": 0.0, "m11": 1.0, "m12": 0.0}


def position_for(index: int) -> str:
    """Map a 0-based sibling index to a fractional-index position string.

    Figma uses printable ASCII strings; '!' (0x21) is the canonical first
    position. Successive single characters work for up to ~94 siblings.
    """
    if index < 94:
        return chr(0x21 + index)
    raise ValueError("more than 94 siblings not yet supported")


def solid_fill(r: float, g: float, b: float, a: float = 1.0) -> dict[str, Any]:
    return {
        "type": "SOLID",
        "color": {"r": r, "g": g, "b": b, "a": a},
        "opacity": 1.0,
        "visible": True,
        "blendMode": "NORMAL",
    }


def transform_at(x: float, y: float) -> dict[str, Any]:
    return {"m00": 1.0, "m01": 0.0, "m02": x, "m10": 0.0, "m11": 1.0, "m12": y}


@dataclass
class SceneBuilder:
    session_id: int = 100
    paste_id: int = field(default_factory=lambda: random.randint(1, 2**31 - 1))
    paste_file_key: str = "scene-from-html"

    nodes: list[dict[str, Any]] = field(default_factory=list)
    _next_local: int = 1
    _children: dict[tuple[int, int], int] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.nodes.append(self._document())
        self.nodes.append(self._canvas())
        self.nodes.append(self._internal_canvas())

    def _document(self) -> dict[str, Any]:
        return {
            "guid": {"sessionID": 0, "localID": 0},
            "phase": "CREATED",
            "type": "DOCUMENT",
            "name": "Document",
            "visible": True,
            "opacity": 1.0,
            "transform": dict(IDENTITY_TRANSFORM),
            "slideThemeMap": {"entries": []},
        }

    def _canvas(self) -> dict[str, Any]:
        return {
            "guid": {"sessionID": self.session_id, "localID": 0},
            "phase": "CREATED",
            "parentIndex": {
                "guid": {"sessionID": 0, "localID": 0},
                "position": "!",
            },
            "type": "CANVAS",
            "name": "Page 1",
            "visible": True,
            "opacity": 1.0,
            "transform": dict(IDENTITY_TRANSFORM),
            "backgroundOpacity": 1.0,
            "backgroundEnabled": True,
        }

    def _internal_canvas(self) -> dict[str, Any]:
        return {
            "guid": {"sessionID": 0, "localID": 0},
            "phase": "CREATED",
            "parentIndex": {
                "guid": {"sessionID": 0, "localID": 0},
                "position": "~",
            },
            "type": "CANVAS",
            "name": "Internal Only Canvas",
            "visible": True,
            "opacity": 1.0,
            "transform": dict(IDENTITY_TRANSFORM),
            "backgroundOpacity": 1.0,
            "backgroundEnabled": True,
        }

    def _alloc_local(self) -> int:
        i = self._next_local
        self._next_local += 1
        return i

    def _next_child_pos(self, parent: dict[str, int]) -> str:
        key = (parent["sessionID"], parent["localID"])
        idx = self._children.get(key, 0)
        self._children[key] = idx + 1
        return position_for(idx)

    @property
    def canvas_guid(self) -> dict[str, int]:
        return {"sessionID": self.session_id, "localID": 0}

    def add_frame(
        self,
        *,
        parent: dict[str, int] | None = None,
        name: str = "Frame",
        x: float = 0.0,
        y: float = 0.0,
        width: float,
        height: float,
        fill: dict[str, Any] | None = None,
        stack_mode: str = "NONE",
        stack_spacing: float = 0.0,
        padding: tuple[float, float, float, float] = (0.0, 0.0, 0.0, 0.0),
    ) -> dict[str, int]:
        parent = parent or self.canvas_guid
        guid = {"sessionID": self.session_id, "localID": self._alloc_local()}
        pad_top, pad_right, pad_bottom, pad_left = padding
        node: dict[str, Any] = {
            "guid": guid,
            "phase": "CREATED",
            "parentIndex": {"guid": parent, "position": self._next_child_pos(parent)},
            "type": "FRAME",
            "name": name,
            "visible": True,
            "opacity": 1.0,
            "size": {"x": width, "y": height},
            "transform": transform_at(x, y),
            "strokeWeight": 1.0,
            "strokeAlign": "INSIDE",
            "strokeJoin": "MITER",
            "fillPaints": [fill] if fill else [],
            "effects": [],
            "horizontalConstraint": "MIN",
            "verticalConstraint": "MIN",
            "stackMode": stack_mode,
            "stackSpacing": stack_spacing,
            "stackHorizontalPadding": pad_left,
            "stackVerticalPadding": pad_top,
            "stackPaddingRight": pad_right,
            "stackPaddingBottom": pad_bottom,
            "stackPrimaryAlignItems": "MIN",
            "stackCounterAlignItems": "MIN",
            "stackReverseZIndex": False,
            "stackCounterSizing": "FIXED",
            "frameMaskDisabled": True,
        }
        self.nodes.append(node)
        return guid

    def add_text(
        self,
        *,
        parent: dict[str, int],
        text: str,
        x: float = 0.0,
        y: float = 0.0,
        width: float = 0.0,
        height: float = 0.0,
        font_family: str = "Inter",
        font_style: str = "Regular",
        font_size: float = 16.0,
        line_height: float = 0.0,
        letter_spacing: float = 0.0,
        color: tuple[float, float, float, float] = (0.0, 0.0, 0.0, 1.0),
        align_horizontal: str = "LEFT",
        align_vertical: str = "TOP",
        auto_resize: str = "WIDTH_AND_HEIGHT",
    ) -> dict[str, int]:
        guid = {"sessionID": self.session_id, "localID": self._alloc_local()}
        node: dict[str, Any] = {
            "guid": guid,
            "phase": "CREATED",
            "parentIndex": {"guid": parent, "position": self._next_child_pos(parent)},
            "type": "TEXT",
            "name": text[:30] if text else "Text",
            "visible": True,
            "opacity": 1.0,
            "size": {"x": width, "y": height},
            "transform": transform_at(x, y),
            "strokeWeight": 1.0,
            "strokeAlign": "OUTSIDE",
            "strokeJoin": "MITER",
            "fillPaints": [solid_fill(*color)],
            "textData": {
                "characters": text,
                "lines": [
                    {
                        "lineType": "PLAIN",
                        "styleId": 0,
                        "indentationLevel": 0,
                        "sourceDirectionality": "AUTO",
                        "listStartOffset": 0,
                        "isFirstLineOfList": False,
                    }
                ],
            },
            "fontName": {"family": font_family, "style": font_style, "postscript": ""},
            "fontSize": font_size,
            "fontVariations": [],
            "fontVersion": "",
            "fontVariantCommonLigatures": True,
            "fontVariantContextualLigatures": True,
            "lineHeight": {
                "value": line_height,
                "units": "RAW" if line_height == 0 else "PIXELS",
            },
            "letterSpacing": {"value": letter_spacing, "units": "PIXELS"},
            "textAlignHorizontal": align_horizontal,
            "textAlignVertical": align_vertical,
            "textAutoResize": auto_resize,
            "textBidiVersion": 1,
            "textExplicitLayoutVersion": 1,
            "textUserLayoutVersion": 4,
            "autoRename": True,
            "detachOpticalSizeFromFontSize": False,
            "stackChildAlignSelf": "AUTO",
        }
        self.nodes.append(node)
        return guid

    def to_message(self) -> dict[str, Any]:
        return {
            "type": "NODE_CHANGES",
            "sessionID": 0,
            "ackID": 0,
            "pasteID": self.paste_id,
            "pasteFileKey": self.paste_file_key,
            "pasteEditorType": "DESIGN",
            "pasteIsPartiallyOutsideEnclosingFrame": False,
            "publishedAssetGuids": [],
            "pastePageId": {"sessionID": 0, "localID": 1},
            "isCut": False,
            "nodeChanges": self.nodes,
            "blobs": [],
        }


def template_from_scene(scene: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Pull a representative node of each type out of an existing scene.

    Useful when defaults in `SceneBuilder` are missing fields that a future
    Figma version requires.
    """
    template: dict[str, dict[str, Any]] = {}
    for n in scene["nodeChanges"]:
        t = n.get("type")
        if t and t not in template:
            template[t] = copy.deepcopy(n)
    return template
