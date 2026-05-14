#!/bin/bash
# One-shot: HTML file -> Figma clipboard HTML.
# Usage: ./convert.sh <input.html> <output.html>

set -euo pipefail

INPUT="${1:?usage: convert.sh <input.html> <output.html>}"
OUTPUT="${2:?usage: convert.sh <input.html> <output.html>}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAYOUT="$(mktemp -t figma-layout.XXXXXX.json)"
trap 'rm -f "$LAYOUT"' EXIT

echo "1/2 rendering and extracting layout..."
node "$SCRIPT_DIR/extract-layout.js" "$INPUT" "$LAYOUT"

echo "2/2 building Figma scene..."
cd "$SCRIPT_DIR"
python3 html_to_figma.py "$LAYOUT" "$OUTPUT"

echo
echo "done -> $OUTPUT"
echo "open the file, select all (Cmd+A), copy (Cmd+C), then paste into Figma."
