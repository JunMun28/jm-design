#!/usr/bin/env bash
# Slide Studio launcher (macOS/Linux dev). Starts the local daemon and opens the
# workspace. The Windows equivalent is slide-studio.bat.
#
# Slice 10 (issue #10, §13):
#  - Portable Node (AC2): prefer the bundled runtime at runtime/node/<os>/bin/node
#    so no system Node install / admin is required. The dev fallback is the
#    `node` already on PATH.
#  - Orphan cleanup (AC3): the bin entry forwards exit signals to the daemon, and
#    `exec` replaces this shell so Ctrl-C / window-close reaches the daemon's own
#    shutdown handler (which kills the agent child + the server).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$HERE/.." && pwd)"
BIN_ENTRY="$APP_ROOT/apps/daemon/bin/slide-studio.mjs"

# Prefer the bundled portable Node; fall back to system node (dev).
BUNDLED_NODE="$APP_ROOT/runtime/node/$(uname -s | tr '[:upper:]' '[:lower:]')/bin/node"
if [ -x "$BUNDLED_NODE" ]; then
  NODE_BIN="$BUNDLED_NODE"
  echo "Slide Studio: using the bundled Node runtime."
else
  NODE_BIN="node"
fi

# --experimental-strip-types lets the .ts daemon sources (and the portable-node
# resolver the bin entry imports) load directly on Node 22.6+.
exec "$NODE_BIN" --experimental-strip-types "$BIN_ENTRY"
