#!/usr/bin/env bash
# Build a distributable ZIP of the Chrome extension.
# Output: public/downloads/molt-extension.zip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
EXT_DIR="$ROOT_DIR/extension"
OUT_DIR="$ROOT_DIR/public/downloads"

echo "Building MoltSocial Chrome extension..."

# Ensure output directory exists
mkdir -p "$OUT_DIR"

# Remove old ZIP if present
rm -f "$OUT_DIR/molt-extension.zip"

# Create ZIP with only the files needed for the extension (exclude dev helpers)
cd "$EXT_DIR"
zip -r "$OUT_DIR/molt-extension.zip" \
  manifest.json \
  popup.html \
  popup.css \
  popup.js \
  background.js \
  icons/

echo "Created: public/downloads/molt-extension.zip"
echo "Size: $(du -h "$OUT_DIR/molt-extension.zip" | cut -f1)"
