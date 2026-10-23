#!/usr/bin/env bash
# Bouwt de interface (fork van htmlui, branch homebase) en zet ze in htmlui-homebase/build, zodat ze in kopia ingebakken wordt.
# Gebruik: homebase/build-htmlui.sh [map van htmlui]   (standaard ../htmlui naast deze repo)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTMLUI="${1:-$ROOT/../htmlui}"
[ -f "$HTMLUI/package.json" ] || { echo "htmlui niet gevonden in $HTMLUI"; exit 1; }
# Versie onderaan in de app: de commit van de interface.
export VITE_FULL_VERSION_INFO="HomeBase Back-up, interface $(git -C "$HTMLUI" rev-parse --short HEAD)"
(cd "$HTMLUI" && npm ci --no-audit --no-fund && npm run build)
rm -rf "$ROOT/htmlui-homebase/build"
cp -R "$HTMLUI/build" "$ROOT/htmlui-homebase/build"
echo "Interface bijgewerkt in htmlui-homebase/build"
