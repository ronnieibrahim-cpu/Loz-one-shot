#!/bin/bash
# SessionStart hook: install node dependencies in remote sessions only.
#
# A local checkout already has node_modules, and reinstalling on every session
# start would just cost time. Claude Code on the web starts from a fresh clone,
# so tools/ that reach for playwright would fail without this.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}"

npm install
