#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_PATH="$ROOT_DIR/src-tauri/target/release/bundle/macos/coding-agent-preheat.app"
DMG_DIR="$ROOT_DIR/src-tauri/target/release/bundle/dmg"
VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"
OUT_PATH="${1:-$DMG_DIR/coding-agent-preheat_${VERSION}_aarch64.dmg}"
STAGING_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

if [[ ! -d "$APP_PATH" ]]; then
  echo "App bundle not found: $APP_PATH" >&2
  echo "Run pnpm tauri:build first." >&2
  exit 1
fi

mkdir -p "$DMG_DIR"
cp -R "$APP_PATH" "$STAGING_DIR/"
ln -s /Applications "$STAGING_DIR/Applications"

hdiutil create \
  -volname coding-agent-preheat \
  -srcfolder "$STAGING_DIR" \
  -ov \
  -format UDZO \
  "$OUT_PATH"

echo "$OUT_PATH"
