#!/usr/bin/env bash
# Builds the interface (fork of htmlui, branch homebase) and puts it in htmlui-homebase/build, so it gets baked into kopia.
# Usage: homebase/build-htmlui.sh [htmlui folder]   (default ../htmlui next to this repo)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTMLUI="${1:-$ROOT/../htmlui}"
[ -f "$HTMLUI/package.json" ] || { echo "htmlui not found in $HTMLUI"; exit 1; }
# Version at the bottom of the app: the interface's commit.
export VITE_FULL_VERSION_INFO="HomeBase Backup, interface $(git -C "$HTMLUI" rev-parse --short HEAD)"
(cd "$HTMLUI" && npm ci --no-audit --no-fund && npm run build)
rm -rf "$ROOT/htmlui-homebase/build"
cp -R "$HTMLUI/build" "$ROOT/htmlui-homebase/build"
echo "Interface updated in htmlui-homebase/build"
