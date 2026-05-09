#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OUT="$ROOT_DIR/bug-reporter.zip"

rm -f "$OUT"

cd "$ROOT_DIR"
zip -r "$OUT" \
  manifest.json \
  background.js \
  content.js \
  content-main.js \
  report-template.js \
  popup.html \
  popup.css \
  popup.js \
  icons/

echo ""
echo "Packaged: $OUT"
echo "Size: $(du -h "$OUT" | cut -f1)"
echo ""
echo "Upload this file to the Chrome Web Store Developer Dashboard:"
echo "https://chrome.google.com/webstore/devconsole"
